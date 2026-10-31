// generate-makeover
// POST { imageBase64, mimeType, style, roomType? }  ->  { imageBase64, mimeType, style, provider }
// The image API key lives ONLY in Supabase secrets. The app never sees it.
// JWT verification stays ON (default), so only signed-in app users can call this.
// Each makeover takes about 30-40 seconds with OpenAI gpt-image-2.

import { buildPrompt, STYLES } from "../_shared/styles.ts";
import { editImage, isConfigured, PROVIDERS, promptMode, type Provider } from "../_shared/providers.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BASE64_CHARS = 10 * 1024 * 1024; // ~7.5 MB image; resize in the app before sending

const BUSY_MESSAGE = "The makeover service is busy right now. Please wait a minute and try again.";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Verify JWT accepts the public anon key too, so also confirm there is a real signed-in user.
async function isSignedIn(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!auth || !url || !anon) return false;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { Authorization: auth, apikey: anon } });
  if (!res.ok) return false;
  const user = await res.json();
  return !!user?.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  if (!(await isSignedIn(req))) return json({ error: "Please sign in to create a makeover." }, 401);

  let body: { imageBase64?: string; mimeType?: string; style?: string; roomType?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }

  const { imageBase64, mimeType, style } = body;
  if (!imageBase64 || !mimeType || !style) {
    return json({ error: "imageBase64, mimeType and style are required" }, 400);
  }
  if (!ALLOWED_MIME.includes(mimeType)) return json({ error: "Use a JPEG, PNG or WebP photo" }, 400);
  if (imageBase64.length > MAX_BASE64_CHARS) return json({ error: "Photo too large. Please shrink it." }, 413);
  if (!STYLES[style]) return json({ error: `Unknown style. Choose one of: ${Object.keys(STYLES).join(", ")}` }, 400);

  // Which API? Only the server decides, with one secret: IMAGE_PROVIDER = openai | gemini | flux | fal | fal-depth
  const provider = (Deno.env.get("IMAGE_PROVIDER") ?? "openai") as Provider;
  if (!PROVIDERS.includes(provider) || !isConfigured(provider)) {
    console.error(`makeover misconfigured: provider "${provider}" is unknown or its API key secret is missing`);
    return json({ error: BUSY_MESSAGE }, 503);
  }

  try {
    // roomType is optional (living room, bedroom, kitchen...). It sharpens the furniture the model picks.
    const prompt = buildPrompt(style, { roomType: body.roomType, mode: promptMode[provider] });
    const out = await editImage(provider, { imageBase64, mimeType, prompt });
    return json({ ...out, style, provider });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("makeover failed:", message); // visible in Supabase logs only
    if (/\b(429|500|502|503)\b/.test(message)) return json({ error: BUSY_MESSAGE }, 503);
    return json({ error: "We couldn't generate that makeover. Please try again." }, 502);
  }
});
