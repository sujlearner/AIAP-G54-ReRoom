// Image-edit adapters. Each takes a room photo + prompt and returns an edited photo.
// Used by BOTH the edge function and the bake-off script, so the test is the real code.
// API keys are read from environment variables only (Supabase secrets in production).

import { decodeBase64, encodeBase64 } from "jsr:@std/encoding@1/base64";

// openai     = OpenAI gpt-image edit
// gemini     = Google Gemini image edit
// flux       = Black Forest Labs FLUX Kontext (direct)
// fal        = FLUX Kontext hosted on fal.ai (photo + instruction edit)
// fal-depth  = fal.ai FLUX depth-control (ControlNet style: redraws the room from its depth map)
export type Provider = "openai" | "gemini" | "flux" | "fal" | "fal-depth";
export const PROVIDERS: Provider[] = ["gemini", "openai", "fal", "fal-depth", "flux"];

// Which prompt style each provider needs (see styles.ts).
// "edit" = photo + instruction. "scene" = descriptive prompt, structure comes from the depth map.
export const promptMode: Record<Provider, "edit" | "scene"> = {
  openai: "edit",
  gemini: "edit",
  flux: "edit",
  fal: "edit",
  "fal-depth": "scene",
};

export interface EditInput {
  imageBase64: string; // raw base64, no "data:" prefix
  mimeType: string; // image/jpeg | image/png | image/webp
  prompt: string;
}
export interface EditOutput {
  imageBase64: string;
  mimeType: string;
}

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret ${name}`);
  return v;
}

function extFor(mime: string): string {
  return mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
}

export function isConfigured(p: Provider): boolean {
  const key = {
    openai: "OPENAI_API_KEY",
    gemini: "GEMINI_API_KEY",
    flux: "BFL_API_KEY",
    fal: "FAL_KEY",
    "fal-depth": "FAL_KEY",
  }[p];
  return !!Deno.env.get(key);
}

// ---------- OpenAI (gpt-image family, /v1/images/edits) ----------
async function openaiEdit(input: EditInput): Promise<EditOutput> {
  const model = Deno.env.get("OPENAI_IMAGE_MODEL") ?? "gpt-image-2";
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", input.prompt);
  form.append("size", "auto"); // keep the original shape where the model allows
  form.append("quality", Deno.env.get("OPENAI_IMAGE_QUALITY") ?? "medium");
  // input_fidelity asks the model to stick closely to the source photo.
  // Only gpt-image-1 models accept it; gpt-image-2 rejects it (and holds the photo well without it).
  const fidelity = Deno.env.get("OPENAI_INPUT_FIDELITY") ?? (model.startsWith("gpt-image-1") ? "high" : "off");
  if (fidelity !== "off") form.append("input_fidelity", fidelity);
  form.append(
    "image",
    new Blob([decodeBase64(input.imageBase64) as BlobPart], { type: input.mimeType }),
    `room.${extFor(input.mimeType)}`,
  );
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${json?.error?.message ?? "request failed"}`);
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image");
  return { imageBase64: b64, mimeType: "image/png" };
}

// ---------- Google Gemini image editing (generateContent) ----------
async function geminiEdit(input: EditInput): Promise<EditOutput> {
  const model = Deno.env.get("GEMINI_IMAGE_MODEL") ?? "gemini-2.5-flash-image";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": requireEnv("GEMINI_API_KEY"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: input.prompt },
              { inline_data: { mime_type: input.mimeType, data: input.imageBase64 } },
            ],
          },
        ],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${json?.error?.message ?? "request failed"}`);
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData ?? part.inline_data;
    if (inline?.data) {
      return { imageBase64: inline.data, mimeType: inline.mimeType ?? inline.mime_type ?? "image/png" };
    }
  }
  throw new Error("Gemini returned no image (it may have refused or returned text only)");
}

// ---------- Black Forest Labs FLUX Kontext (async: submit, then poll) ----------
async function fluxEdit(input: EditInput): Promise<EditOutput> {
  const key = requireEnv("BFL_API_KEY");
  const model = Deno.env.get("BFL_MODEL") ?? "flux-kontext-pro";
  const submit = await fetch(`https://api.bfl.ai/v1/${model}`, {
    method: "POST",
    headers: { "x-key": key, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      prompt: input.prompt,
      input_image: input.imageBase64,
      output_format: "jpeg",
      safety_tolerance: 2,
    }),
  });
  const sub = await submit.json();
  if (!submit.ok) throw new Error(`FLUX ${submit.status}: ${JSON.stringify(sub).slice(0, 200)}`);
  const pollUrl: string = sub.polling_url;
  if (!pollUrl) throw new Error("FLUX gave no polling URL");

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(pollUrl, { headers: { "x-key": key, accept: "application/json" } });
    const p = await poll.json();
    if (p.status === "Ready") {
      const imgRes = await fetch(p.result.sample);
      const buf = new Uint8Array(await imgRes.arrayBuffer());
      return { imageBase64: encodeBase64(buf), mimeType: "image/jpeg" };
    }
    if (p.status === "Error" || p.status === "Failed" || p.status === "Request Moderated" || p.status === "Content Moderated") {
      throw new Error(`FLUX ${p.status}`);
    }
  }
  throw new Error("FLUX timed out");
}

// ---------- fal.ai ----------
// Two routes, one FAL_KEY. fal's sync endpoint is https://fal.run/<model-id>.
// Photos go in as a data URI, so no upload step is needed. Results come back as a URL that we download.

async function falCall(model: string, payload: Record<string, unknown>): Promise<EditOutput> {
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${requireEnv("FAL_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`fal ${res.status}: ${JSON.stringify(json?.detail ?? json).slice(0, 200)}`);
  const url: string | undefined = json?.images?.[0]?.url;
  if (!url) throw new Error("fal returned no image");
  const img = await fetch(url);
  if (!img.ok) throw new Error("fal image download failed");
  const buf = new Uint8Array(await img.arrayBuffer());
  return { imageBase64: encodeBase64(buf), mimeType: img.headers.get("content-type") ?? "image/jpeg" };
}

// FLUX Kontext on fal: photo + instruction edit.
async function falEdit(input: EditInput): Promise<EditOutput> {
  return falCall(Deno.env.get("FAL_EDIT_MODEL") ?? "fal-ai/flux-pro/kontext", {
    prompt: input.prompt,
    image_url: `data:${input.mimeType};base64,${input.imageBase64}`,
    output_format: "jpeg",
    safety_tolerance: "2",
  });
}

// Reads width/height from a JPEG or PNG so the depth model can render at the original shape.
function imageSize(b64: string): { width: number; height: number } | null {
  try {
    const b = decodeBase64(b64);
    if (b[0] === 0x89 && b[1] === 0x50) {
      const dv = new DataView(b.buffer, b.byteOffset);
      return { width: dv.getUint32(16), height: dv.getUint32(20) };
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const marker = b[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
        }
        i += 2 + ((b[i + 2] << 8) | b[i + 3]);
      }
    }
  } catch { /* fall through */ }
  return null;
}

// Depth-controlled generation (the "ControlNet" route). The model redraws the room using the photo's
// depth map as a blueprint, so walls, windows and perspective follow the original geometry.
async function falDepth(input: EditInput): Promise<EditOutput> {
  const payload: Record<string, unknown> = {
    prompt: input.prompt,
    control_lora_image_url: `data:${input.mimeType};base64,${input.imageBase64}`,
    preprocess_depth: true,
    output_format: "jpeg",
  };
  const dims = imageSize(input.imageBase64);
  if (dims) {
    // keep the original shape, max 1536 on the long side, multiples of 16
    const scale = Math.min(1, 1536 / Math.max(dims.width, dims.height));
    const r16 = (n: number) => Math.max(256, Math.round((n * scale) / 16) * 16);
    payload.image_size = { width: r16(dims.width), height: r16(dims.height) };
  }
  return falCall(Deno.env.get("FAL_DEPTH_MODEL") ?? "fal-ai/flux-control-lora-depth", payload);
}

export async function editImage(provider: Provider, input: EditInput): Promise<EditOutput> {
  switch (provider) {
    case "fal":
      return falEdit(input);
    case "fal-depth":
      return falDepth(input);
    case "openai":
      return openaiEdit(input);
    case "gemini":
      return geminiEdit(input);
    case "flux":
      return fluxEdit(input);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
