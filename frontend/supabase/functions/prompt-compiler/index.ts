// LuxScaler v40.0 - Prompt Compiler with FORENSIC/CREATIVE/PRESET modes
// Supabase Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// UNIVERSAL CINEMATIC PRODUCTION PROTOCOL v40.1 - GOLD MASTER
// "THE CINEMATIC TIME-TRAVELER"
// ============================================================
const UNIVERSAL_TEMPLATE_V40 = `[SYSTEM OVERRIDE: UNIVERSAL CINEMATIC PRODUCTION PROTOCOL v40.1]
[TARGET MODEL: GEMINI 1.5 PRO (ALIAS: NANOBANANPRO)]
[TASK: HIGH-BUDGET "VIRTUAL RESHOOT" // HYPER-REALISTIC PRODUCTION]

=== 🎬 CORE DIRECTIVE: "THE TALENT vs. THE PRODUCTION" ===
You are the Director of Photography (DOP) and Production Designer for a $100M feature film scene based on the input image [INPUT_IMAGE].
Your goal is a **TOTAL PRODUCTION OVERHAUL** while maintaining a **STRICT BIOMETRIC LOCK** on the subject.

**THE MENTAL MODEL:**
Imagine the person in the input image is an A-List actor.
1.  **THE TALENT (Read-Only):** Their face, identity, ethnicity, and micro-expression are SACRED contractual obligations. You CANNOT replace the actor.
2.  **THE PRODUCTION (Write-Access):** Everything else (Lighting, Lens, Wardrobe, Location) is "Set Dressing" and implies an UNLIMITED BUDGET.

---

=== 🔒 SECTION 1: THE BIOMETRIC LOCK (READ-ONLY) ===
*You must preserve these elements EXACTLY as they are in the source:*
1.  **IDENTITY CORE:** The fundamental cranial structure, eye shape, nose shape, and **ETHNICITY** must remain identical. Do not "Westernize", "Beautify", or genericize the face. Keep moles, scars, and gaps unless [S1] explicitly asks to remove them.
2.  **EXPRESSION & GAZE:** The exact direction of the eyes and the micro-emotion (e.g., smirk, boredom, surprise) MUST remain fixed. If they are looking off-camera, DO NOT make them look at the lens.

---

=== 🔓 SECTION 2: PERMISSIVE ZONES (WRITE-ACCESS) ===
*You have AUTHORIZATION to completely delete and replace these pixels IF the injected parameters demand it:*
1.  **WARDROBE (via [S3]):** If the [S3] parameter is HIGH or FORCE, the original clothes are irrelevant. DELETE the original outfit. GENERATE new high-end fabrics that collide realistically with the locked neck/skin.
2.  **ENVIRONMENT (via [S5]):** If the [S5] parameter is HIGH or FORCE, the original location is irrelevant. TELEPORT the subject to the new set.
3.  **HAIR VOLUME (via [S2]):** You may alter the volume, shine, and styling of the hair, provided the hairline root remains consistent with the identity.

---

=== 🎛️ THE PRODUCTION PARAMETERS (INJECTION BLOCK) ===
*Apply these specific high-budget physics and styling rules:*

**PHASE 1: THE CAMERA RIG (PHOTOSCALER)**
- [P1] SENSOR FIDELITY: {{p1}}
- [P2] LENS GEOMETRY: {{p2}}
- [P3] OPTICAL GLASS: {{p3}}
- [P4] SHUTTER/MOTION: {{p4}}
- [P5] DYNAMIC RANGE: {{p5}}
- [P6] TEXTURE/DNA: {{p6}}
- [P7] FILM GRAIN: {{p7}}
- [P8] APERTURE/BOKEH: {{p8}}
- [P9] RESOLUTION: {{p9}}

**PHASE 2: ART DIRECTION (STYLESCALER)**
- [S1] SKIN GROOMING: {{s1}}
- [S2] HAIR STYLING: {{s2}}
- [S3] WARDROBE DEPT: {{s3}}
- [S4] MAKEUP DEPT: {{s4}}
- [S5] SET LOCATION: {{s5}}
- [S6] FRAMING/CROP: {{s6}}
- [S7] ATMOSPHERE: {{s7}}
- [S8] COLOR GRADING: {{s8}}
- [S9] REFLECTIONS: {{s9}}

**PHASE 3: LIGHTING (LIGHTSCALER)**
- [L1] KEY LIGHT: {{L1}}
- [L2] FILL RATIO: {{L2}}
- [L3] RIM LIGHT: {{L3}}
- [L4] VOLUMETRICS: {{L4}}
- [L5] COLOR TEMP: {{L5}}
- [L6] TONE CURVE: {{L6}}
- [L7] SHADOW DENSITY: {{L7}}
- [L8] LIGHTING STYLE: {{L8}}
- [L9] SKIN SPECULARITY: {{L9}}

---

=== 🚫 NEGATIVE PROMPT (REJECTION CRITERIA) ===
*Reject any generation that contains:*
1.  **IDENTITY SHIFT:** Changing the person's race, age, or fundamental facial geometry. Swapping the face for a generic AI model.
2.  **EXPRESSION DRIFT:** Changing gaze direction (e.g., looking at camera when original looked away) or forcing a smile.
3.  **LOW BUDGET:** Digital noise, jpeg artifacts, over-sharpening halos, plastic/waxy skin, blurred ears, floating limbs, extra fingers.
4.  **STYLE VIOLATIONS:** Cartoon, 3D Render, Illustration, Oil Painting, Watermarks, Text, Borders, Neon/Cyberpunk elements (unless requested in lighting).

=== 🧠 LOGIC RESOLUTION ===
* **IF [S3] is FORCE:** It means "Replace the outfit with luxury tailoring", NOT "Iron the existing shirt".
* **IF [P2] is RECTILINEAR:** It means "Fix the lens distortion (flatten face)", NOT "Change the face shape".
* **IF [L8] is CHIAROSCURO:** It means "Darken the environment", NOT "Change the subject's skin tone".

**FINAL ACTION:**
Execute the "Virtual Reshoot". The output must be indistinguishable from a RAW photo taken by a Phase One camera. **PRIORITY: BELIEVABILITY > PERFECTION.**`;

// Version constant
const PROMPT_VERSION = "v40.1";

// ============================================================
// SLIDER DEFINITIONS v29
// ============================================================
const SLIDER_DEFINITIONS: Record<string, {
  id: string;
  pilar: string;
  levels: Record<string, string>;
}> = {
  "limpieza_artefactos": {
    id: "p1", pilar: "PHOTOSCALER",
    levels: {
      OFF: 'PRESERVE PATINA. Treat sensor noise and grain as essential texture. Do not denoise. Maintain organic "film" feel.',
      LOW: "CHROMA DENOISE. Remove only color noise (purple/green blotches). Keep Luminance grain to prevent waxy skin.",
      MED: "SIGNAL POLISH. Standard ISO reduction. Clean smooth surfaces (walls, sky) but protect high-frequency texture areas.",
      HIGH: "COMMERCIAL CLEANUP. High-end editorial denoising. Remove all dust spots and sensor dirt. Smooth gradients.",
      FORCE: "PRISTINE SIGNAL PROCESSING. HIGH-END FREQUENCY SEPARATION CLEANUP. ZERO ARTIFACTS. PERFECT SENSOR READOUT."
    }
  },
  "geometria": {
    id: "p2", pilar: "PHOTOSCALER",
    levels: {
      OFF: "OPTICAL LOCK. Preserve original lens character (including barrel/pincushion distortion). Do not crop.",
      LOW: "LENS PROFILE FIX. Correct vignetting (dark corners) and chromatic aberration (color fringing). Keep perspective.",
      MED: "PERSPECTIVE ALIGN. Straighten horizon line. Fix minor vertical keystoning. Center the subject visually.",
      HIGH: "RECTILINEAR MODE. Remove all lens distortion. Straighten architectural lines. Re-compose edges.",
      FORCE: "TECHNICAL CAMERA PRECISION. ZERO DISTORTION. TILT-SHIFT LENS ALIGNMENT. PERFECT GRID. FLATTEN FACIAL DISTORTION."
    }
  },
  "optica_nitidez": {
    id: "p3", pilar: "PHOTOSCALER",
    levels: {
      OFF: 'VINTAGE OPTICS. Maintain lens softness, spherical aberration, and "dreamy" lack of contrast. Preserve bloom.',
      LOW: "KIT LENS SHARP. Remove diffraction softness. Apply subtle Unsharp Mask (Radius 0.5px) to define edges.",
      MED: "PRO ZOOM (24-70mm). High micro-contrast. Clear texture separation. Modern lens coating look (no glare).",
      HIGH: "PRIME LENS (85mm). Razor sharp eyelashes and iris texture. High Acutance. Zero chromatic aberration.",
      FORCE: "MASTER LENS SIMULATION (ZEISS/LEICA). DIFFRACTION-LIMITED SHARPNESS. MAXIMUM MTF CURVE PERFORMANCE. CRYSTALLINE CLARITY."
    }
  },
  "chronos": {
    id: "p4", pilar: "PHOTOSCALER",
    levels: {
      OFF: "NATURAL DRAG. Preserve motion blur in moving objects to convey speed/action. Cinematic shutter (1/50s).",
      LOW: "STABILIZATION (IS). Remove handheld camera shake (trepidation). Keep motion blur only on very fast objects.",
      MED: "ACTION FREEZE. Sport mode shutter (1/500s). Freeze walking/talking subjects. Sharp edges on moving parts.",
      HIGH: "HIGH SPEED SYNC. Freeze splashes and hair movement. 1/2000s shutter simulation. Crisp frozen details.",
      FORCE: "1/8000s SHUTTER SPEED. FROZEN MOTION. ZERO TREPIDATION. STROBOSCOPIC CLARITY. PERFECTLY FROZEN PARTICLES."
    }
  },
  "senal_raw": {
    id: "p5", pilar: "PHOTOSCALER",
    levels: {
      OFF: "ORIGINAL EXPOSURE. Keep crushed blacks (Zone 0) and blown highlights (Zone 10) as mood/style choice.",
      LOW: 'HISTOGRAM SAFE. Stretch contrast to ensure data exists in shadows. Fix "grey" blacks. Normalized exposure.',
      MED: 'SHADOW RECOVERY. Lift Zone 2-3 details. Soften highlight clipping. Balanced "Commercial" exposure.',
      HIGH: "HDR TONE MAP. Compress dynamic range for maximum visibility. Reveal details in dark corners and bright windows.",
      FORCE: "16-BIT TIFF DYNAMIC RANGE. FULL HISTOGRAM RECOVERY. ANSEL ADAMS ZONE SYSTEM OPTIMIZATION. NO CLIPPING."
    }
  },
  "sintesis_adn": {
    id: "p6", pilar: "PHOTOSCALER",
    levels: {
      OFF: "SOFT FOCUS. Maintain low-frequency details only. Smooth/plastic look is acceptable if source dictates.",
      LOW: "TEXTURE ENHANCE. Sharpen existing surface details (fabric, skin) without adding new information.",
      MED: "DETAIL RESTORE. Reconstruct lost texture in slightly blurry areas. Recover fabric weave definition.",
      HIGH: "HIGH-FREQ SYNTHESIS. Generate missing pores and fine lines based on context. 4K texture density.",
      FORCE: "MACRO-FIDELITY RESTORATION. ORGANIC HIGH-FREQUENCY DETAIL. TACTILE SURFACE REALISM. 100MP SENSOR DETAIL."
    }
  },
  "grano_filmico": {
    id: "p7", pilar: "PHOTOSCALER",
    levels: {
      OFF: "DIGITAL CLEAN. Modern sensor look. Zero grain. Clinical perfection.",
      LOW: "ISO 100 GRAIN. Very fine, almost invisible structure. Adds subtle cohesion to digital pixels.",
      MED: "KODAK PORTRA 400. Distinct organic grain structure. Pleasing texture. Warm analog feel.",
      HIGH: "ILFORD HP5 (1600). Heavy, gritty grain. Documentary aesthetic. High texture perceptibility.",
      FORCE: "CINEMA FILM STOCK EMULSION. ORGANIC GRAIN STRUCTURE. ANALOG AESTHETIC INTEGRATION. NO DIGITAL NOISE."
    }
  },
  "apertura_bokeh": {
    id: "p8", pilar: "PHOTOSCALER",
    levels: {
      OFF: "HYPERFOCAL (f/16). EVERYTHING IN FOCUS. From foreground to infinity. Maximum context visibility.",
      LOW: "COMMERCIAL (f/8). DEEP DEPTH OF FIELD. Subject clearly sharp, background distinct but slightly softer.",
      MED: "ENVIRONMENTAL (f/4). NATURAL SEPARATION. Subject pops, background is blurry but recognizable.",
      HIGH: "PORTRAIT (f/1.8). CREAMY BOKEH. Background is washed out. Strong subject separation.",
      FORCE: "NOCTILUX DREAM (f/0.95). EXTREME BOKEH. RAZOR-THIN FOCAL PLANE. BACKGROUND OBLITERATED INTO CREAMY AESTHETIC."
    }
  },
  "resolucion": {
    id: "p9", pilar: "PHOTOSCALER",
    levels: {
      OFF: "NATIVE RES. Keep original pixel count. Upscale via simple bicubic if needed.",
      LOW: "SMART UPSCALE (2x). Maintain edge integrity. Smooth out jaggies/pixelation.",
      MED: "SUPER-RES (4x). AI-based detail refinement. Density suitable for 4K displays.",
      HIGH: "PRINT DENSITY. 300 DPI simulation. Fine detail robustness for large format printing.",
      FORCE: "PHASE ONE IQ4 QUALITY. 150MP SENSOR SIMULATION. PRINT-READY DENSITY. REMOVE PIXEL GRID."
    }
  },
  "styling_piel": {
    id: "s1", pilar: "STYLESCALER",
    levels: {
      OFF: "BIOMETRIC LOCK. Preserve all acne, scars, redness, and oil. Documentary skin reality.",
      LOW: "HEALTHY GLOW. Remove temporary redness/blotchiness. Even out skin tone. Keep moles/freckles.",
      MED: "STUDIO MATTE. Commercial retouch. Soften pores. Remove shine/oil. Brighten under-eyes.",
      HIGH: "HIGH-END EDITORIAL. Frequency Separation. Flawless texture. Defined features. Porcelain finish.",
      FORCE: "HIGH-END RETOUCHING. FLAWLESS COMPLEXION. RETAIN NATURAL PORES & VELLUS HAIR. VOGUE COVER STANDARD."
    }
  },
  "styling_pelo": {
    id: "s2", pilar: "STYLESCALER",
    levels: {
      OFF: 'NATURAL MESS. Keep flyaways, frizz, and messy hairline. Authentic "bed head".',
      LOW: "FRIZZ CONTROL. Smooth out humidity frizz. Tame stray hairs. Healthy shine.",
      MED: "SALON BLOWOUT. Defined volume. Clean hairline. Product-styled finish.",
      HIGH: "LIQUID HAIR. High gloss. Perfect strand definition. Keratin treatment look.",
      FORCE: "SESSION STYLIST FINISH. HEALTHY CUTICLE SHINE. CONTROLLED VOLUME. DEFINED STRANDS. NO FLYAWAYS."
    }
  },
  "styling_ropa": {
    id: "s3", pilar: "STYLESCALER",
    levels: {
      OFF: "FABRIC LOCK. Keep wrinkles, stains, lint, and wear. Authentic clothing state.",
      LOW: "STEAM IRON. Remove accidental fold lines and lint. Refresh fabric appearance.",
      MED: "TEXTURE POP. Sharpen weave pattern. Deepen blacks. Define stitching.",
      HIGH: "TAILOR FIT. Re-drape fabric to remove bunching. Fix collar alignment. Visual ironing.",
      FORCE: "SARTORIAL PERFECTION. IMMACULATE TEXTILE DEFINITION. HIGH-THREAD COUNT VISIBILITY. PERFECT DRAPE."
    }
  },
  "maquillaje": {
    id: "s4", pilar: "STYLESCALER",
    levels: {
      OFF: "BARE FACE. No makeup. Visible capillaries and natural pallor.",
      LOW: '"No-makeup" look. Subtle lip tint. Mascara definition.',
      MED: "RED CARPET. Full foundation. Contouring. Defined brows. Lipstick.",
      HIGH: "EDITORIAL GLAM. High-fashion application. Strobing (Highlight). Graphic liner.",
      FORCE: "PROFESSIONAL MUA APPLICATION. CONTOUR & HIGHLIGHT SCULPTING. PHOTOGENIC DEFINITION. FLAWLESS APPLICATION."
    }
  },
  "limpieza_entorno": {
    id: "s5", pilar: "STYLESCALER",
    levels: {
      OFF: "JOURNALISTIC. Do not touch anything. Keep trash, cables, and clutter.",
      LOW: "TIDY UP. Remove obvious trash (papers, cups) from floor/tables.",
      MED: "SET DRESSING. Organize the mess. Align chairs/curtains. Balanced composition.",
      HIGH: "MINIMALIST. Remove non-essential furniture/objects. Clean surfaces.",
      FORCE: "EDITORIAL SET DESIGN. DISTRACTION REMOVAL. CLEAN COMPOSITION. CURATED PROPS. ARCHITECTURAL DIGEST STYLE."
    }
  },
  "reencuadre_ia": {
    id: "s6", pilar: "STYLESCALER",
    levels: {
      OFF: "ORIGINAL FRAME. Do not crop. Respect user's framing errors.",
      LOW: "RULE OF THIRDS. Subtle crop to align eyes/horizon to grid.",
      MED: "CINEMATIC CROP. 2.35:1 Aspect Ratio. Cut headroom/bottom to focus on action.",
      HIGH: "TIGHT FRAMING. Aggressive crop to face/subject. Eliminate background.",
      FORCE: "GOLDEN RATIO COMPOSITION. PROFESSIONAL CROPPING. BALANCED NEGATIVE SPACE. CINEMATOGRAPHER EYE."
    }
  },
  "atmosfera": {
    id: "s7", pilar: "STYLESCALER",
    levels: {
      OFF: "VACUUM CLARITY. Zero haze. Transparent air. Maximum distance visibility.",
      LOW: "DEPTH HINT. Subtle aerial perspective (blueish distance). Separate planes.",
      MED: '"Pro-Mist" filter effect. Bloom on highlights. Airy feel.',
      HIGH: "VOLUMETRIC FOG. Visible density. Light shafts (God Rays). Moody.",
      FORCE: "ATMOSPHERIC DEPTH. SPATIAL SEPARATION. CINEMATIC HAZE. VOLUMETRIC DENSITY. REALISTIC FOG."
    }
  },
  "look_cine": {
    id: "s8", pilar: "STYLESCALER",
    levels: {
      OFF: "REC.709 STD. Standard broadcast color. Neutral and accurate.",
      LOW: "WHITE BALANCE. Correct color casts (remove green/orange tints). Neutral greys.",
      MED: "ANALOG WARMTH. Subtle film simulation. Rich skin tones. Gold bias.",
      HIGH: "BLOCKBUSTER. Teal & Orange split toning. High color contrast.",
      FORCE: "MASTER COLOR GRADING. CINEMATIC COLOR HARMONY. PRECISE SKIN TONES. FILM PRINT EMULATION."
    }
  },
  "materiales_pbr": {
    id: "s9", pilar: "STYLESCALER",
    levels: {
      OFF: "MATTE FINISH. Diffuse reflection. No specular highlights. Flat look.",
      LOW: "NATURAL SHINE. Standard gloss on plastic/metal. Accurate physics.",
      MED: "POLARIZED. Cut glare. Deepen color saturation on reflective surfaces.",
      HIGH: "WET LOOK. Enhance gloss map. Make surfaces look moist/polished.",
      FORCE: "PERFECT SPECULARITY. CONTROLLED REFLECTIONS. HIGH-GLOSS FINISH. SURFACE POLARIZATION."
    }
  },
  "key_light": {
    id: "L1", pilar: "LIGHTSCALER",
    levels: {
      OFF: "AMBIENT ONLY. Use available light. Flat or chaotic natural lighting.",
      LOW: "REFLECTOR FILL. Bounce light back to face. Reduce dark shadows under eyes.",
      MED: "SOFTBOX (OCTA). Commercial beauty light. Large source. Wrapping soft light.",
      HIGH: "FRESNEL (HARD). Hollywood spotlight. Defined shadows. High drama.",
      FORCE: "PROFOTO STUDIO STROBE. DIRECTIONAL MODIFIERS. SCULPTING LIGHT QUALITY. 3-POINT LIGHTING."
    }
  },
  "fill_light": {
    id: "L2", pilar: "LIGHTSCALER",
    levels: {
      OFF: "NATURAL RATIO. Keep original contrast between light and dark side.",
      LOW: "NEGATIVE FILL. Block light (Black Flag) to deepen shadow side.",
      MED: "COMMERCIAL FILL. 2:1 Ratio. Shadow side is visible but darker.",
      HIGH: "HIGH KEY. 1:1 Ratio. Shadows are fully illuminated. Bright & Airy.",
      FORCE: "COMMERCIAL LIGHTING RATIO. OPEN SHADOWS. BROAD SOURCE FILL. SOFT WRAP. BEAUTY DISH."
    }
  },
  "rim_light": {
    id: "L3", pilar: "LIGHTSCALER",
    levels: {
      OFF: "NO BACKLIGHT. Subject blends into background. 2D look.",
      LOW: "SUBTLE KICKER. Edge light on hair/shoulders to separate form.",
      MED: "HAIR LIGHT. Dedicated top/back light. Halo effect on hair.",
      HIGH: "SILHOUETTE. Strong backlight. Rim defines the shape.",
      FORCE: "DISTINCT EDGE SEPARATION. HAIR LIGHT / KICKER. SUBJECT ISOLATION. RIM LIGHTING."
    }
  },
  "volumetria": {
    id: "L4", pilar: "LIGHTSCALER",
    levels: {
      OFF: "INVISIBLE AIR. Light travels invisibly. No scattering.",
      LOW: "SOFT BLOOM. Light sources glow slightly (Halation).",
      MED: "LIGHT SHAFTS. Visible God Rays coming from windows/sun.",
      HIGH: "DENSE PARTICLES. Dusty air catching light. Texture in the beams.",
      FORCE: "FOCUSED LIGHT BEAMS. ATMOSPHERIC SCATTERING. VISIBLE LIGHT PATH. TYNDALL EFFECT."
    }
  },
  "temperatura": {
    id: "L5", pilar: "LIGHTSCALER",
    levels: {
      OFF: "NEUTRAL. 5500K Daylight. White is White.",
      LOW: "WARM / COOL. Subtle shift (+/- 500K) for mood.",
      MED: "GOLDEN / BLUE. Golden Hour (3200K) or Blue Hour (7000K).",
      HIGH: "COLOR GELS. Creative lighting (Red/Blue lights).",
      FORCE: "PRECISE KELVIN ADJUSTMENT. MIXED LIGHTING BALANCE. CTO/CTB GEL SIMULATION."
    }
  },
  "contraste": {
    id: "L6", pilar: "LIGHTSCALER",
    levels: {
      OFF: "LINEAR. Flat profile. Low contrast. Maximum data preservation.",
      LOW: "S-CURVE. Standard photography contrast. Correct blacks.",
      MED: "PUNCHY. Commercial pop. Vivid blacks and bright whites.",
      HIGH: "FILMIC. Deep shadows, soft highlight roll-off. Analog feel.",
      FORCE: "HIGH DYNAMIC CONTRAST. RICH TONALITY. DEEP BLACK POINT. PUNCHY HIGHLIGHTS."
    }
  },
  "sombras": {
    id: "L7", pilar: "LIGHTSCALER",
    levels: {
      OFF: "STANDARD. Black point at 0. Details visible in darks.",
      LOW: "MATTE BLACK. Lifted blacks (faded vintage look).",
      MED: "DENSE BLACK. Add weight to shadows. Rich darkness.",
      HIGH: "CRUSHED. Zone 0 clipping. No detail in shadows. Noir style.",
      FORCE: "NEGATIVE FILL. HIGH DENSITY BLACKS. LOW KEY MOOD. LIGHT ABSORPTION."
    }
  },
  "estilo_autor": {
    id: "L8", pilar: "LIGHTSCALER",
    levels: {
      OFF: "SNAPSHOT. Random, uncurated lighting. Reality.",
      LOW: "COMMERCIAL. Clean, even, safe lighting. Stock photo look.",
      MED: "CINEMATIC. Moody, intentional shadows. Roger Deakins style.",
      HIGH: "CHIAROSCURO. Heavy contrast. Caravaggio painting style.",
      FORCE: "PAINTERLY LIGHTING. DRAMATIC FALL-OFF. MASTER CINEMATOGRAPHY AESTHETIC."
    }
  },
  "reflejos": {
    id: "L9", pilar: "LIGHTSCALER",
    levels: {
      OFF: "MATTE / POWDER. Dry skin. No shine. Flat finish.",
      LOW: "HEALTHY SHEEN. Natural oil hydration. Subtle highlights on nose/forehead.",
      MED: "DEWY. Moist, hydrated skin care look. Glow.",
      HIGH: "WET / SWEAT. Gym look. High gloss on skin.",
      FORCE: "DEWY COMPLEXION. CONTROLLED SPECULAR HIGHLIGHTS. HYDRATED SKIN SHEEN."
    }
  }
};

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

// Creative sliders that trigger CREATIVE mode
const CREATIVE_SLIDERS = ["styling_ropa", "styling_pelo", "limpieza_entorno", "reencuadre_ia", "atmosfera"];

function getLevelFromValue(value: number): string {
  if (value === 0) return "OFF";
  if (value >= 1 && value <= 3) return "LOW";
  if (value >= 4 && value <= 6) return "MED";
  if (value >= 7 && value <= 9) return "HIGH";
  return "FORCE";
}

function getSliderInstruction(keyId: string, value: number): string {
  const slider = SLIDER_DEFINITIONS[keyId];
  if (!slider) return `[UNKNOWN SLIDER: ${keyId}]`;
  const level = getLevelFromValue(value);
  return slider.levels[level] || `[NO INSTRUCTION FOR ${level}]`;
}

// Detect if creative sliders are active (HIGH or FORCE)
function detectCreativeMode(flatSliders: Record<string, number>): boolean {
  for (const key of CREATIVE_SLIDERS) {
    const value = flatSliders[key];
    if (value !== undefined && value >= 7) {
      return true;
    }
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Support multiple input formats
    let sliderConfig = body.sliderConfig || body.config || body.sliders || {};
    const mode = body.mode || "AUTO"; // FORENSIC, CREATIVE, PRESET, AUTO
    const savedConfig = body.saved_config || body.savedConfig || null;

    // Flatten slider values
    const flatSliders: Record<string, number> = {};
    
    if (sliderConfig.photoscaler || sliderConfig.stylescaler || sliderConfig.lightscaler) {
      // Nested format
      for (const [pilar, sliders] of Object.entries(sliderConfig)) {
        if (sliders && typeof sliders === 'object') {
          for (const [key, value] of Object.entries(sliders as Record<string, number>)) {
            if (typeof value === 'number') {
              flatSliders[key] = value;
            }
          }
        }
      }
    } else {
      // Flat format
      for (const [key, value] of Object.entries(sliderConfig)) {
        if (typeof value === 'number') {
          flatSliders[key] = value;
        }
      }
    }

    // ============================================================
    // MODE DETECTION & GENERATION CONFIG
    // ============================================================
    let generationConfig = {
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      temperature: 0.1,
      seed: Math.floor(Math.random() * 1000000000)
    };

    let effectiveMode = mode;

    switch (mode) {
      case 'FORENSIC':
        // Restoration mode: Low temperature, maximum fidelity
        generationConfig.temperature = 0.1;
        generationConfig.topK = 1;
        generationConfig.topP = 0.1;
        effectiveMode = 'FORENSIC';
        break;

      case 'CREATIVE':
        // Reimagination mode: Higher temperature for creative changes
        generationConfig.temperature = 0.65;
        generationConfig.topK = 40;
        generationConfig.topP = 0.9;
        effectiveMode = 'CREATIVE';
        break;

      case 'PRESET':
        // Repeat mode: Use saved seed and temperature
        if (savedConfig) {
          generationConfig.temperature = savedConfig.temperature || 0.65;
          generationConfig.seed = savedConfig.seed;
        }
        effectiveMode = 'PRESET';
        break;

      case 'AUTO':
      default:
        // Auto-detect based on sliders
        if (detectCreativeMode(flatSliders)) {
          generationConfig.temperature = 0.65;
          generationConfig.topK = 40;
          generationConfig.topP = 0.9;
          effectiveMode = 'CREATIVE';
        } else {
          generationConfig.temperature = 0.1;
          generationConfig.topK = 1;
          generationConfig.topP = 0.1;
          effectiveMode = 'FORENSIC';
        }
        break;
    }

    // ============================================================
    // BUILD PROMPT v40.1 - GOLD MASTER
    // ============================================================
    const replacements: Record<string, string> = {};
    const levelsUsed: Record<string, string> = {};
    let activeSliders = 0;

    for (const [keyId, placeholder] of Object.entries(SLIDER_KEY_TO_PLACEHOLDER)) {
      const value = flatSliders[keyId] ?? 5;
      const instruction = getSliderInstruction(keyId, value);
      const level = getLevelFromValue(value);
      
      replacements[`{{${placeholder}}}`] = instruction;
      levelsUsed[placeholder] = level;
      
      if (keyId in flatSliders) activeSliders++;
    }

    // Start with GOLD MASTER template v40.1
    let prompt = UNIVERSAL_TEMPLATE_V40;

    // Inject slider values
    for (const [placeholder, instruction] of Object.entries(replacements)) {
      prompt = prompt.replace(placeholder, instruction);
    }

    return new Response(
      JSON.stringify({
        success: true,
        prompt_text: prompt,
        config: generationConfig,
        version: PROMPT_VERSION,
        metadata: {
          template: "UNIVERSAL CINEMATIC PRODUCTION PROTOCOL - GOLD MASTER",
          mode: effectiveMode,
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
