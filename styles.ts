// Style prompts v2: "Structural Anchor Prompting".
//
// Every prompt is assembled from 4 parts so the room's structure never drifts:
//   1. TASK     - tells the model this is a restyle of a real photo, not a new picture
//   2. ANCHORS  - lists what must stay identical (walls, windows, camera, light)
//   3. STYLE    - palette, materials, furniture, lighting, decor for the chosen style
//   4. AVOID    - the things that usually go wrong (moved windows, warped furniture...)
//
// Two modes:
//   "edit"  - for models that take a photo + instruction (OpenAI, Gemini, FLUX Kontext)
//   "scene" - for depth/ControlNet models that redraw the room from its depth map and
//             cannot follow "keep this" instructions, so they get a descriptive scene prompt
//
// To add a style: copy one entry in STYLES and change the words. Nothing else needs editing.

export type PromptMode = "edit" | "scene";

export const ROOM_TYPES = [
  "living room",
  "bedroom",
  "kitchen",
  "dining room",
  "home office",
  "bathroom",
  "entryway",
  "kids room",
] as const;

const ANCHORS = `STRUCTURAL ANCHORS - keep every one of these exactly as in the original photo:
- Camera: same position, height, angle, lens look, perspective and framing. No zoom, no crop, no rotation.
- Room shell: wall positions, corners, ceiling height, floor area, room proportions.
- Openings: every window and door keeps its exact size, position, frame shape and the view outside.
- Fixed features: fireplaces, built-ins, beams, stairs, archways, radiators, vents, outlets, switches, baseboards.
- Light: same direction, color and brightness of daylight; same time of day.
- Image: same aspect ratio and same level of sharpness as the original.`;

const CHANGEABLE = `ONLY CHANGE these surface items: wall paint or wallpaper color, flooring finish, furniture, rugs, curtains, light fixtures, wall art, decor objects, plants and textiles.
Place the new furniture in the same zones where the old furniture stands (sofa area stays the sofa area, bed wall stays the bed wall), sized realistically for the room, resting naturally on the floor with soft believable shadows. Never block a window or door with furniture.`;

const AVOID = `AVOID: moved, added, removed or resized windows or doors; changed ceiling height; warped or leaning walls; fisheye or exaggerated wide-angle; cropped or zoomed view; floating, melted or duplicated furniture; people, pets, text, logos, watermarks; blur, plastic-looking surfaces, over-saturated colors.`;

export interface StyleDef {
  label: string;
  description: string; // shown in the app under the style name
  palette: string;
  materials: string;
  furniture: string;
  lighting: string;
  decor: string;
  mood: string;
}

export const STYLES: Record<string, StyleDef> = {
  modern: {
    label: "Modern",
    description: "Clean lines, neutral base, bold simple accents",
    palette: "warm white or soft greige walls, charcoal and cream upholstery, one bold accent such as deep cobalt or burnt orange",
    materials: "matte black metal, smoked glass, light oak flooring, smooth plaster, wool",
    furniture: "a low-profile sofa with straight clean lines, a sleek glass or matte-black coffee table, slim-legged side tables, a simple media console",
    lighting: "a sculptural arc floor lamp, recessed-look soft white light, one geometric pendant",
    decor: "one large abstract canvas, a single statement plant, a simple geometric rug, very few objects on surfaces",
    mood: "uncluttered, crisp, sophisticated",
  },
  traditional: {
    label: "Traditional",
    description: "Classic, elegant, rich wood and layered comfort",
    palette: "warm cream or soft muted blue walls, burgundy, navy, gold, rich wood brown",
    materials: "mahogany or cherry wood, damask and tailored fabrics, silk, brass, porcelain",
    furniture: "a rolled-arm sofa, a pair of wingback chairs, a dark wood coffee table, a console with a mirror above",
    lighting: "table lamps with fabric shades, a classic chandelier, warm even light",
    decor: "an Oriental-style area rug, tailored drapes, framed landscape paintings, fresh flowers, a symmetrical layout",
    mood: "elegant, timeless, warm",
  },
  boho: {
    label: "Boho",
    description: "Layered textiles, plants and warm earthy color",
    palette: "warm cream walls, terracotta, mustard, rust, deep teal, dusty pink",
    materials: "rattan, cane, jute, macrame, woven cotton, aged wood, brass",
    furniture: "a relaxed low sofa with mixed-pattern cushions, a rattan chair, floor cushions, a carved wood side table",
    lighting: "warm string lights, a woven rattan pendant, a brass lamp",
    decor: "layered patterned rugs, a macrame wall hanging, woven baskets, many trailing and potted plants",
    mood: "eclectic, collected, relaxed, inviting",
  },
  mediterranean: {
    label: "Mediterranean",
    description: "Sun-warmed plaster, terracotta and sea blue",
    palette: "warm white or sun-bleached plaster walls, terracotta, cobalt and azure blue, olive green, sandy ochre",
    materials: "textured lime-wash plaster, terracotta tile flooring, rough-hewn wood, wrought iron, handmade ceramic tile, linen",
    furniture: "a cream linen slipcovered sofa, a sturdy rustic wood coffee or dining table, a wrought-iron chair with a woven seat, a carved wood console",
    lighting: "wrought-iron lantern pendants, a ceramic table lamp, warm sunlit glow",
    decor: "hand-painted blue-and-white and terracotta ceramics, woven baskets, olive branches in a clay pot, a potted citrus or olive tree, a striped cotton rug, light linen curtains",
    mood: "sun-warmed, relaxed, rustic and breezy",
  },
};

export interface PromptOptions {
  roomType?: string; // one of ROOM_TYPES; defaults to "room"
  mode?: PromptMode; // "edit" (default) or "scene"
}

function styleBlock(s: StyleDef): string {
  return `Palette: ${s.palette}.
Materials: ${s.materials}.
Furniture: ${s.furniture}.
Lighting: ${s.lighting}.
Decor: ${s.decor}.
Mood: ${s.mood}.`;
}

export function buildPrompt(styleKey: string, opts: PromptOptions = {}): string {
  const s = STYLES[styleKey];
  if (!s) throw new Error(`Unknown style: ${styleKey}`);
  const room = opts.roomType && (ROOM_TYPES as readonly string[]).includes(opts.roomType) ? opts.roomType : "room";

  if (opts.mode === "scene") {
    // For depth/ControlNet models: the structure comes from the depth map, the prompt only describes the look.
    return `Professional interior design magazine photograph of a ${room} in ${s.label} style. ${styleBlock(s)}
Architectural photography at eye level, straight vertical lines, natural daylight coming through the windows, sharp focus, realistic materials, photorealistic, high detail, no people, no text.`;
  }

  return `Restyle this photograph of a real ${room} into ${s.label} interior design style. This is a makeover of the existing photo, not a new picture. Change the decor and finishes while keeping the room's structure exactly the same.

${ANCHORS}

${CHANGEABLE}

STYLE TO APPLY (${s.label}):
${styleBlock(s)}

${AVOID}

The result must look like a real, sharp, professionally shot interior photograph taken from the exact same spot as the original.`;
}
