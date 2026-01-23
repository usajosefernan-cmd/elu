// LuxScaler v40.0 - Universal Cinematic Production Protocol
// Supabase Edge Function: prompt-compiler

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// UNIVERSAL CINEMATIC PRODUCTION PROTOCOL v40.0
// ============================================================
const UNIVERSAL_TEMPLATE_V40 = `[SYSTEM OVERRIDE: UNIVERSAL CINEMATIC PRODUCTION PROTOCOL v40.0]
[TASK: HIGH-BUDGET "VIRTUAL RESHOOT" // HYPER-REALISTIC PRODUCTION]

=== 🎬 THE NEW DIRECTIVE: "THE TALENT vs. THE PRODUCTION" ===
You are no longer just restoring a photo. You are the Director of Photography (DOP) and Production Designer for a $100M blockbuster movie scene based on the input image.

Your goal is a **TOTAL PRODUCTION OVERHAUL** while maintaining a **STRICT BIOMETRIC LOCK** on the subject.

**THE MENTAL MODEL:**
Imagine the person(s) in the [INPUT_IMAGE] are A-List actors booked for a high-end shoot.
* **THE TALENT (Read-Only):** Their face, unique features, bone structure, and specific facial expression (gaze, smirk, emotion) are SACRED contracts. You cannot replace the actor.
* **THE PRODUCTION (Write-Access):** Everything else around them—their hair, clothing, location, time of day, and the camera lens—is "Set Dressing" and can be completely reimagined based on the injection parameters below.

---

=== 🔒 SECTION 1: THE SACRED BIOMETRIC LOCK (READ-ONLY) ===
*You must preserve these elements exactly as they are in the source:*

1.  **IDENTITY CORE:** The fundamental cranial structure, eye shape, nose, and unique identifiers (moles, scars) must remain identical. Do not generate a generic "perfect" face.
2.  **EXPRESSION & GAZE:** The exact micro-expression and direction of the eyes MUST remain fixed. If they are looking off-camera slightly, do not make them look at the lens. The "acting performance" is locked.

---

=== 🔓 SECTION 2: AUTHORIZED PRODUCTION CHANGES (WRITE-ACCESS) ===
*You have an unlimited budget to upgrade these elements IF the injected parameters demand it:*

1.  **WARDROBE & STYLING (via [S2], [S3]):** You may completely replace clothing with high-end designer alternatives. You may restyle hair into luxurious, professional looks, changing volume and texture as requested.
2.  **ENVIRONMENT & TIME (via [S5], [L5], [S7]):** You may transport the subject to a idealized version of the location, or a completely new "set" if requested. You may shift time from noon to "Golden Hour" or "Blue Hour".
3.  **CAMERA & LENS (via [P2], [P3], [P8], [S6]):** You may radically change the framing (e.g., ultra-wide cinematic crop) and depth of field (e.g., f/0.95 Noctilux bokeh) to create drama.

---

=== 🎛️ THE PRODUCTION PARAMETERS (INJECTION BLOCK) ===
*Apply these specific high-budget physics and styling rules:*

**PHASE 1: THE CAMERA RIG (PHOTOSCALER)**
- [P1] SIGNAL/SENSOR QUALITY: {{p1}}
- [P2] LENS GEOMETRY/PROJECTION: {{p2}}
- [P3] OPTICAL GLASS QUALITY: {{p3}}
- [P4] SHUTTER SPEED/MOTION: {{p4}}
- [P5] DYNAMIC RANGE (RAW): {{p5}}
- [P6] TEXTURE RESOLUTION (MTF): {{p6}}
- [P7] FILM STOCK EMULSION: {{p7}}
- [P8] APERTURE & BOKEH: {{p8}}
- [P9] PIXEL DENSITY: {{p9}}

**PHASE 2: ART DIRECTION & STYLING (STYLESCALER)**
- [S1] SKIN GROOMING: {{s1}}
- [S2] HAIR STYLING: {{s2}}
- [S3] WARDROBE DEPT: {{s3}}
- [S4] MAKEUP DEPT: {{s4}}
- [S5] SET DRESSING/LOCATION: {{s5}}
- [S6] CINEMATIC FRAMING: {{s6}}
- [S7] ATMOSPHERE/SMOKE: {{s7}}
- [S8] COLOR GRADING SUITE: {{s8}}
- [S9] SURFACE REFLECTIONS: {{s9}}

**PHASE 3: THE GAFFER & LIGHTING (LIGHTSCALER)**
- [L1] KEY LIGHT SOURCE: {{L1}}
- [L2] FILL LIGHT RATIO: {{L2}}
- [L3] RIM/KICKER LIGHT: {{L3}}
- [L4] VOLUMETRIC RAYS: {{L4}}
- [L5] COLOR TEMPERATURE (TIME): {{L5}}
- [L6] CONTRAST CURVE: {{L6}}
- [L7] SHADOW DENSITY: {{L7}}
- [L8] DRAMATIC LIGHTING SCHEME: {{L8}}
- [L9] SKIN SPECULARITY: {{L9}}

---

=== 🚫 NEGATIVE PROMPT (PRODUCTION FAILURES) ===
*Reject any output that looks like:*
1.  **IDENTITY SWAP:** Changing the fundamental facial structure or ethnicity of the subject.
2.  **EXPRESSION DRIFT:** Changing the gaze direction or emotion (e.g., forcing a smile).
3.  **LOW BUDGET:** Cheap digital noise, bad lighting, flat colors, smartphone camera look.
4.  **PHYSICS FAILURES:** Plastic skin, waxy hair, impossible lighting, "Uncanny Valley" AI artifacts.
5.  **STYLE VIOLATIONS:** Neon, Cyberpunk, Fantasy, 3D Render look, Cartoon, Illustration.

=== 🧠 PRODUCTION NOTES FOR NANOBANANPRO ===
* **IF [S3] (Wardrobe) is FORCE:** It means "Replace the outfit entirely with a luxury tailor-made version of a similar style", NOT "Just iron the existing shirt".
* **IF [S5] (Set) is FORCE:** It means "Rebuild the location as a pristine movie set", removing all ugliness and clutter.
* **IF [L5] (Temp) changes time:** Ensure the background sky and practical lights match the new time (e.g., sunset light requires a sunset sky).

**FINAL ACTION:**
Execute the "Virtual Reshoot" with maximum production value. Make it look like a magazine cover or a movie still, but ensure the subject's mother would still recognize them instantly.`;

// ============================================================
// SLIDER DEFINITIONS v29 - Complete table with all 27 sliders
// ============================================================
const SLIDER_DEFINITIONS: Record<string, {
  id: string;
  pilar: string;
  ui_title: string;
  levels: Record<string, string>;
}> = {
  // PHOTOSCALER (P1-P9)
  "limpieza_artefactos": {
    id: "p1", pilar: "PHOTOSCALER", ui_title: "Limpieza de Señal",
    levels: {
      OFF: 'PRESERVE PATINA. Treat sensor noise and grain as essential texture. Do not denoise. Maintain organic "film" feel.',
      LOW: "CHROMA DENOISE. Remove only color noise (purple/green blotches). Keep Luminance grain to prevent waxy skin.",
      MED: "SIGNAL POLISH. Standard ISO reduction. Clean smooth surfaces (walls, sky) but protect high-frequency texture areas.",
      HIGH: "COMMERCIAL CLEANUP. High-end editorial denoising. Remove all dust spots and sensor dirt. Smooth gradients.",
      FORCE: "PRISTINE SIGNAL PROCESSING. HIGH-END FREQUENCY SEPARATION CLEANUP. ZERO ARTIFACTS. PERFECT SENSOR READOUT."
    }
  },
  "geometria": {
    id: "p2", pilar: "PHOTOSCALER", ui_title: "Corrección Técnica",
    levels: {
      OFF: "OPTICAL LOCK. Preserve original lens character (including barrel/pincushion distortion). Do not crop.",
      LOW: "LENS PROFILE FIX. Correct vignetting (dark corners) and chromatic aberration (color fringing). Keep perspective.",
      MED: "PERSPECTIVE ALIGN. Straighten horizon line. Fix minor vertical keystoning. Center the subject visually.",
      HIGH: "RECTILINEAR MODE. Remove all lens distortion. Straighten architectural lines. Re-compose edges.",
      FORCE: "TECHNICAL CAMERA PRECISION. ZERO DISTORTION. TILT-SHIFT LENS ALIGNMENT. PERFECT GRID. FLATTEN FACIAL DISTORTION."
    }
  },
  "optica_nitidez": {
    id: "p3", pilar: "PHOTOSCALER", ui_title: "Definición Cristalina",
    levels: {
      OFF: 'VINTAGE OPTICS. Maintain lens softness, spherical aberration, and "dreamy" lack of contrast. Preserve bloom.',
      LOW: "KIT LENS SHARP. Remove diffraction softness. Apply subtle Unsharp Mask (Radius 0.5px) to define edges.",
      MED: "PRO ZOOM (24-70mm). High micro-contrast. Clear texture separation. Modern lens coating look (no glare).",
      HIGH: "PRIME LENS (85mm). Razor sharp eyelashes and iris texture. High Acutance. Zero chromatic aberration.",
      FORCE: "MASTER LENS SIMULATION (ZEISS/LEICA). DIFFRACTION-LIMITED SHARPNESS. MAXIMUM MTF CURVE PERFORMANCE. CRYSTALLINE CLARITY."
    }
  },
  "chronos": {
    id: "p4", pilar: "PHOTOSCALER", ui_title: "Congelar Acción",
    levels: {
      OFF: "NATURAL DRAG. Preserve motion blur in moving objects to convey speed/action. Cinematic shutter (1/50s).",
      LOW: "STABILIZATION (IS). Remove handheld camera shake (trepidation). Keep motion blur only on very fast objects.",
      MED: "ACTION FREEZE. Sport mode shutter (1/500s). Freeze walking/talking subjects. Sharp edges on moving parts.",
      HIGH: "HIGH SPEED SYNC. Freeze splashes and hair movement. 1/2000s shutter simulation. Crisp frozen details.",
      FORCE: "1/8000s SHUTTER SPEED. FROZEN MOTION. ZERO TREPIDATION. STROBOSCOPIC CLARITY. PERFECTLY FROZEN PARTICLES."
    }
  },
  "senal_raw": {
    id: "p5", pilar: "PHOTOSCALER", ui_title: "Rango Dinámico",
    levels: {
      OFF: "ORIGINAL EXPOSURE. Keep crushed blacks (Zone 0) and blown highlights (Zone 10) as mood/style choice.",
      LOW: 'HISTOGRAM SAFE. Stretch contrast to ensure data exists in shadows. Fix "grey" blacks. Normalized exposure.',
      MED: 'SHADOW RECOVERY. Lift Zone 2-3 details. Soften highlight clipping. Balanced "Commercial" exposure.',
      HIGH: "HDR TONE MAP. Compress dynamic range for maximum visibility. Reveal details in dark corners and bright windows.",
      FORCE: "16-BIT TIFF DYNAMIC RANGE. FULL HISTOGRAM RECOVERY. ANSEL ADAMS ZONE SYSTEM OPTIMIZATION. NO CLIPPING."
    }
  },
  "sintesis_adn": {
    id: "p6", pilar: "PHOTOSCALER", ui_title: "Textura Táctil",
    levels: {
      OFF: "SOFT FOCUS. Maintain low-frequency details only. Smooth/plastic look is acceptable if source dictates.",
      LOW: "TEXTURE ENHANCE. Sharpen existing surface details (fabric, skin) without adding new information.",
      MED: "DETAIL RESTORE. Reconstruct lost texture in slightly blurry areas. Recover fabric weave definition.",
      HIGH: "HIGH-FREQ SYNTHESIS. Generate missing pores and fine lines based on context. 4K texture density.",
      FORCE: "MACRO-FIDELITY RESTORATION. ORGANIC HIGH-FREQUENCY DETAIL. TACTILE SURFACE REALISM. 100MP SENSOR DETAIL."
    }
  },
  "grano_filmico": {
    id: "p7", pilar: "PHOTOSCALER", ui_title: "Emulsión Fílmica",
    levels: {
      OFF: "DIGITAL CLEAN. Modern sensor look. Zero grain. Clinical perfection.",
      LOW: "ISO 100 GRAIN. Very fine, almost invisible structure. Adds subtle cohesion to digital pixels.",
      MED: "KODAK PORTRA 400. Distinct organic grain structure. Pleasing texture. Warm analog feel.",
      HIGH: "ILFORD HP5 (1600). Heavy, gritty grain. Documentary aesthetic. High texture perceptibility.",
      FORCE: "CINEMA FILM STOCK EMULSION. ORGANIC GRAIN STRUCTURE. ANALOG AESTHETIC INTEGRATION. NO DIGITAL NOISE."
    }
  },
  "apertura_bokeh": {
    id: "p8", pilar: "PHOTOSCALER", ui_title: "Profundidad de Campo",
    levels: {
      OFF: "HYPERFOCAL (f/16). EVERYTHING IN FOCUS. From foreground to infinity. Maximum context visibility. Landscape standard.",
      LOW: "COMMERCIAL (f/8). DEEP DEPTH OF FIELD. Subject clearly sharp, background distinct but slightly softer. Group photo standard.",
      MED: "ENVIRONMENTAL (f/4). NATURAL SEPARATION. Subject pops, background is blurry but recognizable (Contextual).",
      HIGH: "PORTRAIT (f/1.8). CREAMY BOKEH. Background is washed out. Strong subject separation. Soft highlight circles.",
      FORCE: "NOCTILUX DREAM (f/0.95). EXTREME BOKEH. RAZOR-THIN FOCAL PLANE. BACKGROUND OBLITERATED INTO CREAMY AESTHETIC."
    }
  },
  "resolucion": {
    id: "p9", pilar: "PHOTOSCALER", ui_title: "Densidad de Píxel",
    levels: {
      OFF: "NATIVE RES. Keep original pixel count. Upscale via simple bicubic if needed.",
      LOW: "SMART UPSCALE (2x). Maintain edge integrity. Smooth out jaggies/pixelation.",
      MED: "SUPER-RES (4x). AI-based detail refinement. Density suitable for 4K displays.",
      HIGH: "PRINT DENSITY. 300 DPI simulation. Fine detail robustness for large format printing.",
      FORCE: "PHASE ONE IQ4 QUALITY. 150MP SENSOR SIMULATION. PRINT-READY DENSITY. REMOVE PIXEL GRID."
    }
  },
  // STYLESCALER (S1-S9)
  "styling_piel": {
    id: "s1", pilar: "STYLESCALER", ui_title: "Grooming Pro",
    levels: {
      OFF: "BIOMETRIC LOCK. Preserve all acne, scars, redness, and oil. Documentary skin reality.",
      LOW: "HEALTHY GLOW. Remove temporary redness/blotchiness. Even out skin tone. Keep moles/freckles.",
      MED: "STUDIO MATTE. Commercial retouch. Soften pores. Remove shine/oil. Brighten under-eyes.",
      HIGH: "HIGH-END EDITORIAL. Frequency Separation. Flawless texture. Defined features. Porcelain finish.",
      FORCE: "HIGH-END RETOUCHING. FLAWLESS COMPLEXION. RETAIN NATURAL PORES & VELLUS HAIR. EVEN SKIN TONE. VOGUE COVER STANDARD."
    }
  },
  "styling_pelo": {
    id: "s2", pilar: "STYLESCALER", ui_title: "Estilismo Capilar",
    levels: {
      OFF: 'NATURAL MESS. Keep flyaways, frizz, and messy hairline. Authentic "bed head".',
      LOW: "FRIZZ CONTROL. Smooth out humidity frizz. Tame stray hairs. Healthy shine.",
      MED: "SALON BLOWOUT. Defined volume. Clean hairline. Product-styled finish.",
      HIGH: "LIQUID HAIR. High gloss. Perfect strand definition. Keratin treatment look.",
      FORCE: "SESSION STYLIST FINISH. HEALTHY CUTICLE SHINE. CONTROLLED VOLUME. DEFINED STRANDS. NO FLYAWAYS."
    }
  },
  "styling_ropa": {
    id: "s3", pilar: "STYLESCALER", ui_title: "Sastrería Digital",
    levels: {
      OFF: "FABRIC LOCK. Keep wrinkles, stains, lint, and wear. Authentic clothing state.",
      LOW: "STEAM IRON. Remove accidental fold lines and lint. Refresh fabric appearance.",
      MED: "TEXTURE POP. Sharpen weave pattern. Deepen blacks. Define stitching.",
      HIGH: "TAILOR FIT. Re-drape fabric to remove bunching. Fix collar alignment. Visual ironing.",
      FORCE: "SARTORIAL PERFECTION. IMMACULATE TEXTILE DEFINITION. HIGH-THREAD COUNT VISIBILITY. PERFECT DRAPE."
    }
  },
  "maquillaje": {
    id: "s4", pilar: "STYLESCALER", ui_title: "MUA Profesional",
    levels: {
      OFF: "BARE FACE. No makeup. Visible capillaries and natural pallor.",
      LOW: '"No-makeup" look. Subtle lip tint. Mascara definition.',
      MED: "RED CARPET. Full foundation. Contouring. Defined brows. Lipstick.",
      HIGH: "EDITORIAL GLAM. High-fashion application. Strobing (Highlight). Graphic liner.",
      FORCE: "PROFESSIONAL MUA APPLICATION. CONTOUR & HIGHLIGHT SCULPTING. PHOTOGENIC DEFINITION. FLAWLESS APPLICATION."
    }
  },
  "limpieza_entorno": {
    id: "s5", pilar: "STYLESCALER", ui_title: "Set Design",
    levels: {
      OFF: "JOURNALISTIC. Do not touch anything. Keep trash, cables, and clutter.",
      LOW: "TIDY UP. Remove obvious trash (papers, cups) from floor/tables.",
      MED: "SET DRESSING. Organize the mess. Align chairs/curtains. Balanced composition.",
      HIGH: "MINIMALIST. Remove non-essential furniture/objects. Clean surfaces.",
      FORCE: "EDITORIAL SET DESIGN. DISTRACTION REMOVAL. CLEAN COMPOSITION. CURATED PROPS. ARCHITECTURAL DIGEST STYLE."
    }
  },
  "reencuadre_ia": {
    id: "s6", pilar: "STYLESCALER", ui_title: "Composición Pro",
    levels: {
      OFF: "ORIGINAL FRAME. Do not crop. Respect user's framing errors.",
      LOW: "RULE OF THIRDS. Subtle crop to align eyes/horizon to grid.",
      MED: "CINEMATIC CROP. 2.35:1 Aspect Ratio. Cut headroom/bottom to focus on action.",
      HIGH: "TIGHT FRAMING. Aggressive crop to face/subject. Eliminate background.",
      FORCE: "GOLDEN RATIO COMPOSITION. PROFESSIONAL CROPPING. BALANCED NEGATIVE SPACE. CINEMATOGRAPHER EYE."
    }
  },
  "atmosfera": {
    id: "s7", pilar: "STYLESCALER", ui_title: "Profundidad Aérea",
    levels: {
      OFF: "VACUUM CLARITY. Zero haze. Transparent air. Maximum distance visibility.",
      LOW: "DEPTH HINT. Subtle aerial perspective (blueish distance). Separate planes.",
      MED: '"Pro-Mist" filter effect. Bloom on highlights. Airy feel.',
      HIGH: "VOLUMETRIC FOG. Visible density. Light shafts (God Rays). Moody.",
      FORCE: "ATMOSPHERIC DEPTH. SPATIAL SEPARATION. CINEMATIC HAZE. VOLUMETRIC DENSITY. REALISTIC FOG."
    }
  },
  "look_cine": {
    id: "s8", pilar: "STYLESCALER", ui_title: "Etalonaje (Color)",
    levels: {
      OFF: "REC.709 STD. Standard broadcast color. Neutral and accurate.",
      LOW: "WHITE BALANCE. Correct color casts (remove green/orange tints). Neutral greys.",
      MED: "ANALOG WARMTH. Subtle film simulation. Rich skin tones. Gold bias.",
      HIGH: "BLOCKBUSTER. Teal & Orange split toning. High color contrast.",
      FORCE: "MASTER COLOR GRADING. CINEMATIC COLOR HARMONY. PRECISE SKIN TONES. FILM PRINT EMULATION."
    }
  },
  "materiales_pbr": {
    id: "s9", pilar: "STYLESCALER", ui_title: "Reflejos Físicos",
    levels: {
      OFF: "MATTE FINISH. Diffuse reflection. No specular highlights. Flat look.",
      LOW: "NATURAL SHINE. Standard gloss on plastic/metal. Accurate physics.",
      MED: "POLARIZED. Cut glare. Deepen color saturation on reflective surfaces.",
      HIGH: "WET LOOK. Enhance gloss map. Make surfaces look moist/polished.",
      FORCE: "PERFECT SPECULARITY. CONTROLLED REFLECTIONS. HIGH-GLOSS FINISH. SURFACE POLARIZATION."
    }
  },
  // LIGHTSCALER (L1-L9)
  "key_light": {
    id: "L1", pilar: "LIGHTSCALER", ui_title: "Luz Principal",
    levels: {
      OFF: "AMBIENT ONLY. Use available light. Flat or chaotic natural lighting.",
      LOW: "REFLECTOR FILL. Bounce light back to face. Reduce dark shadows under eyes.",
      MED: "SOFTBOX (OCTA). Commercial beauty light. Large source. Wrapping soft light.",
      HIGH: "FRESNEL (HARD). Hollywood spotlight. Defined shadows. High drama.",
      FORCE: "PROFOTO STUDIO STROBE. DIRECTIONAL MODIFIERS. SCULPTING LIGHT QUALITY. 3-POINT LIGHTING."
    }
  },
  "fill_light": {
    id: "L2", pilar: "LIGHTSCALER", ui_title: "Luz de Relleno",
    levels: {
      OFF: "NATURAL RATIO. Keep original contrast between light and dark side.",
      LOW: "NEGATIVE FILL. Block light (Black Flag) to deepen shadow side.",
      MED: "COMMERCIAL FILL. 2:1 Ratio. Shadow side is visible but darker.",
      HIGH: "HIGH KEY. 1:1 Ratio. Shadows are fully illuminated. Bright & Airy.",
      FORCE: "COMMERCIAL LIGHTING RATIO. OPEN SHADOWS. BROAD SOURCE FILL. SOFT WRAP. BEAUTY DISH."
    }
  },
  "rim_light": {
    id: "L3", pilar: "LIGHTSCALER", ui_title: "Luz de Recorte",
    levels: {
      OFF: "NO BACKLIGHT. Subject blends into background. 2D look.",
      LOW: "SUBTLE KICKER. Edge light on hair/shoulders to separate form.",
      MED: "HAIR LIGHT. Dedicated top/back light. Halo effect on hair.",
      HIGH: "SILHOUETTE. Strong backlight. Rim defines the shape.",
      FORCE: "DISTINCT EDGE SEPARATION. HAIR LIGHT / KICKER. SUBJECT ISOLATION. RIM LIGHTING."
    }
  },
  "volumetria": {
    id: "L4", pilar: "LIGHTSCALER", ui_title: "Haces de Luz",
    levels: {
      OFF: "INVISIBLE AIR. Light travels invisibly. No scattering.",
      LOW: "SOFT BLOOM. Light sources glow slightly (Halation).",
      MED: "LIGHT SHAFTS. Visible God Rays coming from windows/sun.",
      HIGH: "DENSE PARTICLES. Dusty air catching light. Texture in the beams.",
      FORCE: "FOCUSED LIGHT BEAMS. ATMOSPHERIC SCATTERING. VISIBLE LIGHT PATH. TYNDALL EFFECT."
    }
  },
  "temperatura": {
    id: "L5", pilar: "LIGHTSCALER", ui_title: "Balance de Blancos",
    levels: {
      OFF: "NEUTRAL. 5500K Daylight. White is White.",
      LOW: "WARM / COOL. Subtle shift (+/- 500K) for mood.",
      MED: "GOLDEN / BLUE. Golden Hour (3200K) or Blue Hour (7000K).",
      HIGH: "COLOR GELS. Creative lighting (Red/Blue lights).",
      FORCE: "PRECISE KELVIN ADJUSTMENT. MIXED LIGHTING BALANCE. CTO/CTB GEL SIMULATION."
    }
  },
  "contraste": {
    id: "L6", pilar: "LIGHTSCALER", ui_title: "Curva de Tonos",
    levels: {
      OFF: "LINEAR. Flat profile. Low contrast. Maximum data preservation.",
      LOW: "S-CURVE. Standard photography contrast. Correct blacks.",
      MED: "PUNCHY. Commercial pop. Vivid blacks and bright whites.",
      HIGH: "FILMIC. Deep shadows, soft highlight roll-off. Analog feel.",
      FORCE: "HIGH DYNAMIC CONTRAST. RICH TONALITY. DEEP BLACK POINT. PUNCHY HIGHLIGHTS."
    }
  },
  "sombras": {
    id: "L7", pilar: "LIGHTSCALER", ui_title: "Densidad de Negros",
    levels: {
      OFF: "STANDARD. Black point at 0. Details visible in darks.",
      LOW: "MATTE BLACK. Lifted blacks (faded vintage look).",
      MED: "DENSE BLACK. Add weight to shadows. Rich darkness.",
      HIGH: "CRUSHED. Zone 0 clipping. No detail in shadows. Noir style.",
      FORCE: "NEGATIVE FILL. HIGH DENSITY BLACKS. LOW KEY MOOD. LIGHT ABSORPTION."
    }
  },
  "estilo_autor": {
    id: "L8", pilar: "LIGHTSCALER", ui_title: "Esquema Dramático",
    levels: {
      OFF: "SNAPSHOT. Random, uncurated lighting. Reality.",
      LOW: "COMMERCIAL. Clean, even, safe lighting. Stock photo look.",
      MED: "CINEMATIC. Moody, intentional shadows. Roger Deakins style.",
      HIGH: "CHIAROSCURO. Heavy contrast. Caravaggio painting style.",
      FORCE: "PAINTERLY LIGHTING. DRAMATIC FALL-OFF. MASTER CINEMATOGRAPHY AESTHETIC."
    }
  },
  "reflejos": {
    id: "L9", pilar: "LIGHTSCALER", ui_title: "Brillo de Piel",
    levels: {
      OFF: "MATTE / POWDER. Dry skin. No shine. Flat finish.",
      LOW: "HEALTHY SHEEN. Natural oil hydration. Subtle highlights on nose/forehead.",
      MED: "DEWY. Moist, hydrated skin care look. Glow.",
      HIGH: "WET / SWEAT. Gym look. High gloss on skin.",
      FORCE: "DEWY COMPLEXION. CONTROLLED SPECULAR HIGHLIGHTS. HYDRATED SKIN SHEEN."
    }
  }
};

// Mapping from slider key_id to template placeholder
const SLIDER_KEY_TO_PLACEHOLDER: Record<string, string> = {
  "limpieza_artefactos": "p1", "geometria": "p2", "optica_nitidez": "p3",
  "chronos": "p4", "senal_raw": "p5", "sintesis_adn": "p6",
  "grano_filmico": "p7", "apertura_bokeh": "p8", "resolucion": "p9",
  "styling_piel": "s1", "styling_pelo": "s2", "styling_ropa": "s3",
  "maquillaje": "s4", "limpieza_entorno": "s5", "reencuadre_ia": "s6",
  "atmosfera": "s7", "look_cine": "s8", "materiales_pbr": "s9",
  "key_light": "L1", "fill_light": "L2", "rim_light": "L3",
  "volumetria": "L4", "temperatura": "L5", "contraste": "L6",
  "sombras": "L7", "estilo_autor": "L8", "reflejos": "L9"
};

// Convert value (0-10) to level name
function getLevelFromValue(value: number): string {
  if (value === 0) return "OFF";
  if (value >= 1 && value <= 3) return "LOW";
  if (value >= 4 && value <= 6) return "MED";
  if (value >= 7 && value <= 9) return "HIGH";
  return "FORCE"; // 10
}

// Get instruction for a slider at a specific value
function getSliderInstruction(keyId: string, value: number): string {
  const slider = SLIDER_DEFINITIONS[keyId];
  if (!slider) return `[UNKNOWN SLIDER: ${keyId}]`;
  
  const level = getLevelFromValue(value);
  return slider.levels[level] || `[NO INSTRUCTION FOR ${level}]`;
}

// Assemble the complete prompt from slider values
function assemblePrompt(sliderConfig: Record<string, Record<string, number>>): {
  prompt: string;
  levelsUsed: Record<string, string>;
  activeSliders: number;
} {
  // Flatten slider values
  const flatSliders: Record<string, number> = {};
  for (const [pilar, sliders] of Object.entries(sliderConfig)) {
    if (sliders && typeof sliders === 'object') {
      for (const [key, value] of Object.entries(sliders)) {
        if (typeof value === 'number') {
          flatSliders[key] = value;
        }
      }
    }
  }

  // Build replacement dict
  const replacements: Record<string, string> = {};
  const levelsUsed: Record<string, string> = {};
  let activeSliders = 0;

  for (const [keyId, placeholder] of Object.entries(SLIDER_KEY_TO_PLACEHOLDER)) {
    const value = flatSliders[keyId] ?? 5; // Default to 5 (MED)
    const instruction = getSliderInstruction(keyId, value);
    const level = getLevelFromValue(value);
    
    replacements[`{{${placeholder}}}`] = instruction;
    levelsUsed[placeholder] = level;
    
    if (keyId in flatSliders) activeSliders++;
  }

  // Perform replacements
  let prompt = UNIVERSAL_TEMPLATE_V40;
  for (const [placeholder, instruction] of Object.entries(replacements)) {
    prompt = prompt.replace(placeholder, instruction);
  }

  return { prompt, levelsUsed, activeSliders };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Support both nested and flat slider configs
    let sliderConfig = body.sliderConfig || body.config || {};
    
    // If flat format (legacy), convert to nested
    if (!sliderConfig.photoscaler && !sliderConfig.stylescaler && !sliderConfig.lightscaler) {
      const nested: Record<string, Record<string, number>> = {
        photoscaler: {}, stylescaler: {}, lightscaler: {}
      };
      for (const [key, value] of Object.entries(sliderConfig)) {
        const slider = SLIDER_DEFINITIONS[key];
        if (slider && typeof value === 'number') {
          const pilar = slider.pilar.toLowerCase();
          if (pilar in nested) {
            nested[pilar][key] = value;
          }
        }
      }
      sliderConfig = nested;
    }

    const { prompt, levelsUsed, activeSliders } = assemblePrompt(sliderConfig);

    return new Response(
      JSON.stringify({
        success: true,
        prompt,
        version: "v40.0",
        metadata: {
          template: "UNIVERSAL CINEMATIC PRODUCTION PROTOCOL",
          active_sliders: activeSliders,
          levels_used: levelsUsed,
          identity_lock: true
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
