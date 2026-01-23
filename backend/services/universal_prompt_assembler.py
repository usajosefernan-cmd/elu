"""
Universal Prompt Assembler v37.0
Assembles the final system prompt using the slider definitions and the Universal Template.
"""
import json
import os
from typing import Dict, Optional
from services.slider_definitions_service import (
    get_slider_by_key,
    get_level_from_value,
    get_prompt_snippet_for_slider
)

# The Universal Template v37.0
UNIVERSAL_TEMPLATE = """[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v37.0]
[TARGET MODEL: GEMINI 1.5 PRO (ALIAS: NANOBANANPRO)]
[ROLE: REALITY RECONSTRUCTION ENGINE & WORLD-CLASS DIRECTOR OF PHOTOGRAPHY]

=== CORE DIRECTIVE: THE "VIRTUAL RESHOOT" PARADOX ===
You are NOT an image editor. You are a Time-Traveling Photographer with a $100,000 Phase One Camera System.
Your Goal: Travel back to the exact moment [INPUT_IMAGE] was taken and RE-SHOOT the scene using perfect optical physics, lighting, and composition.

THE PARADOX YOU MUST SOLVE:
1.  **PRESERVE THE TRUTH (Subject/Context):** You must not change *who* is in the photo, *what* they are doing, or *where* they are (unless told to remove clutter). The moment is sacred.
2.  **UPGRADE THE CAPTURE (Physics/Quality):** You must eliminate the limitations of the original camera (phone sensor, bad lens, noise, poor light) and replace them with high-end production values.

=== 🔒 THE HIERARCHY OF TRUTH (STRICT CONSTRAINTS) ===
1.  **BIOMETRIC LOCK (CRITICAL):** Facial identity, bone structure, gaze direction, and micro-expressions are READ-ONLY. Do not "beautify" a face into a generic AI model. Preserve unique features (moles, scars, tooth gaps) unless the "Grooming" slider explicitly requests removal.
    * *Failure State:* If the output looks like a different person, you have failed.
2.  **SEMANTIC ANCHOR:** Do not hallucinate objects that aren't there. Do not remove key objects unless they are "clutter."
3.  **GEOMETRY EXCEPTION:** You are ONLY allowed to move pixels for:
    * **Lens Correction:** Flattening a "fish-eye" selfie nose to look natural (50mm).
    * **Re-Framing:** Expanding the canvas or fixing a crooked horizon.

---

=== 🎛️ DYNAMIC INJECTION BLOCK (THE 3 PILLARS) ===
*The following instructions define the physics of your virtual camera.
*NOTE: If a parameter is set to "OFF" or "PROTECT", it means you must strictly PRESERVE the original flaw (e.g., keep the grain, keep the wrinkles).*

### PHASE 1: PHOTOSCALER (The Physics Engine)
*Define the Sensor, Lens, and Signal quality.*
- [P1] SIGNAL INTEGRITY (Noise/Cleanliness): {{p1}}
- [P2] LENS GEOMETRY (Distortion/Perspective): {{p2}}
- [P3] OPTICAL DEFINITION (Glass Quality/MTF): {{p3}}
- [P4] CHRONOS (Motion/Shutter Speed): {{p4}}
- [P5] DYNAMIC RANGE (Sensor Latitude): {{p5}}
- [P6] DNA SYNTHESIS (Micro-Texture/Resolution): {{p6}}
- [P7] FILM GRAIN (Emulsion Structure): {{p7}}
- [P8] APERTURE (Depth of Field/Bokeh): {{p8}}
- [P9] PIXEL DENSITY (Resolution/Print Size): {{p9}}

### PHASE 2: STYLESCALER (The Art Director)
*Define the Content, Grooming, and Aesthetics.*
- [S1] SKIN GROOMING (Surface Quality): {{s1}}
- [S2] HAIR STYLING (Volume/Physics): {{s2}}
- [S3] WARDROBE (Fabric/Tailoring): {{s3}}
- [S4] MAKEUP (MUA Application): {{s4}}
- [S5] SET DRESSING (Environment/Clutter): {{s5}}
- [S6] FRAMING (Crop/Composition): {{s6}}
- [S7] ATMOSPHERE (Volumetrics/Haze): {{s7}}
- [S8] COLOR SCIENCE (Grading/LUT): {{s8}}
- [S9] MATERIAL PHYSICS (PBR/Reflections): {{s9}}

### PHASE 3: LIGHTSCALER (The Gaffer)
*Define the Photons and Volume.*
- [L1] KEY LIGHT (Main Source): {{L1}}
- [L2] FILL LIGHT (Contrast Ratio): {{L2}}
- [L3] RIM LIGHT (Separation): {{L3}}
- [L4] VOLUMETRICS (Light Shafts): {{L4}}
- [L5] TEMPERATURE (White Balance/Kelvin): {{L5}}
- [L6] CONTRASTE (Tone Curve): {{L6}}
- [L7] SHADOWS (Black Point Density): {{L7}}
- [L8] DRAMATIC SCHEME (Artistic Intent): {{L8}}
- [L9] SPECULARITY (Skin Shine): {{L9}}

---

=== 🛡️ NEGATIVE PROMPT (QUALITY GATES) ===
*The following elements are STRICTLY FORBIDDEN in the output. Use this to filter out "Digital Rot" and "Bad Photography".*

**1. PHOTOGRAPHIC DEFECTS:**
(Reject these unless [P1] or [P7] explicitly asks to keep them)
> Digital noise, chroma noise, jpeg artifacts, compression blocking, banding, chromatic aberration, purple fringing, lens flare (unless requested), dirty sensor spots, motion blur (unless requested), camera shake, trepidation, out of focus eyes, hazy lens, washed out colors, flat histogram.

**2. LIGHTING & COLOR ERRORS:**
> Crushed blacks (loss of detail in shadows), blown highlights (pure white clipping), nuclear neon colors, oversaturated skin, orange skin tone, grey/muddy blacks, flat lighting, on-camera flash look, inconsistent shadows.

**3. AI HALLUCINATIONS & BIOLOGY:**
> Morphing, changing facial features, changing identity, extra fingers, missing limbs, floating objects, asymmetric eyes, crossed eyes, plastic skin, wax texture, blur-to-sharp transition artifacts, cartoon effect, semi-realistic painting look, 3D render look, uncanny valley.

**4. STYLE VIOLATIONS:**
> Cyberpunk, neon lights, fantasy elements, sci-fi glowing parts, anime style, illustration, oil painting, watermarks, text overlays, borders, frames.

---

=== 🧠 LOGIC CONFLICT RESOLUTION (SCHIZOPHRENIA PREVENTION) ===
*Gemini, use your advanced reasoning to resolve these common contradictions:*
1.  **FOG vs. SHARPNESS:** If [S7] asks for "Heavy Fog" but [P3] asks for "Crystal Sharpness," apply the Sharpness ONLY to the foreground subject and the Fog ONLY to the background depth map.
2.  **GEOMETRY vs. IDENTITY:** If [P2] asks for "Perfect Geometry" but the subject has a naturally crooked smile, PRESERVE THE SMILE. Identity trumps Geometry.
3.  **DARKNESS vs. VISIBILITY:** If [L8] is "Chiaroscuro" (Dark) but [P5] is "High Dynamic Range," keep the *mood* dark but ensure texture is visible in the shadows (don't clip to pure black).

=== FINAL OUTPUT ===
Render the result as a **Photorealistic RAW Export**.
Priority: **Believability > Perfection**."""


# Mapping from slider key_id to template placeholder
SLIDER_KEY_TO_PLACEHOLDER = {
    # PHOTOSCALER
    "limpieza_artefactos": "p1",
    "geometria": "p2",
    "optica_nitidez": "p3",
    "chronos": "p4",
    "senal_raw": "p5",
    "sintesis_adn": "p6",
    "grano_filmico": "p7",
    "apertura_bokeh": "p8",
    "resolucion": "p9",
    # STYLESCALER
    "styling_piel": "s1",
    "styling_pelo": "s2",
    "styling_ropa": "s3",
    "maquillaje": "s4",
    "limpieza_entorno": "s5",
    "reencuadre_ia": "s6",
    "atmosfera": "s7",
    "look_cine": "s8",
    "materiales_pbr": "s9",
    # LIGHTSCALER
    "key_light": "L1",
    "fill_light": "L2",
    "rim_light": "L3",
    "volumetria": "L4",
    "temperatura": "L5",
    "contraste": "L6",
    "sombras": "L7",
    "estilo_autor": "L8",
    "reflejos": "L9",
}

# Reverse mapping: placeholder -> key_id
PLACEHOLDER_TO_KEY = {v: k for k, v in SLIDER_KEY_TO_PLACEHOLDER.items()}


def get_slider_instruction(key_id: str, value: int) -> str:
    """
    Get the instruction text for a slider at a specific value.
    
    Args:
        key_id: The slider key (e.g., 'limpieza_artefactos')
        value: The slider value (0-10)
    
    Returns:
        The instruction string from slider_definitions
    """
    instruction = get_prompt_snippet_for_slider(key_id, value)
    if instruction:
        return instruction
    
    # Fallback if not found
    level = get_level_from_value(value)
    return f"[{level}] No instruction defined for {key_id}"


def assemble_prompt(slider_values: Dict[str, Dict[str, int]], include_debug: bool = False) -> Dict:
    """
    Assemble the complete system prompt from slider values.
    
    Args:
        slider_values: Dict with pillar names as keys:
            {
                "photoscaler": {"limpieza_artefactos": 8, "geometria": 5, ...},
                "stylescaler": {"styling_piel": 6, ...},
                "lightscaler": {"key_light": 7, ...}
            }
        include_debug: Whether to include debug information
    
    Returns:
        Dict with:
            - prompt: The assembled system prompt
            - debug: Optional debug information
    """
    # Flatten slider values
    flat_sliders = {}
    for pilar, sliders in slider_values.items():
        for key, value in sliders.items():
            flat_sliders[key] = int(value) if isinstance(value, (int, float)) else 5
    
    # Build replacement dict for template
    replacements = {}
    debug_info = {
        "slider_instructions": {},
        "missing_sliders": [],
        "levels_used": {}
    }
    
    for key_id, placeholder in SLIDER_KEY_TO_PLACEHOLDER.items():
        value = flat_sliders.get(key_id, 5)  # Default to 5 (MED) if not specified
        instruction = get_slider_instruction(key_id, value)
        level = get_level_from_value(value)
        
        replacements[f"{{{{{placeholder}}}}}"] = instruction
        
        if include_debug:
            debug_info["slider_instructions"][key_id] = {
                "placeholder": placeholder,
                "value": value,
                "level": level,
                "instruction": instruction[:100] + "..." if len(instruction) > 100 else instruction
            }
            debug_info["levels_used"][placeholder] = level
            
            if key_id not in flat_sliders:
                debug_info["missing_sliders"].append(key_id)
    
    # Perform replacements
    prompt = UNIVERSAL_TEMPLATE
    for placeholder, instruction in replacements.items():
        prompt = prompt.replace(placeholder, instruction)
    
    result = {
        "prompt": prompt,
        "version": "v37.0",
        "template": "UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL"
    }
    
    if include_debug:
        result["debug"] = debug_info
    
    return result


def assemble_prompt_from_flat(flat_sliders: Dict[str, int], include_debug: bool = False) -> Dict:
    """
    Assemble prompt from a flat dictionary of slider values.
    
    Args:
        flat_sliders: Dict with slider key_ids as keys and values (0-10):
            {"limpieza_artefactos": 8, "geometria": 5, ...}
        include_debug: Whether to include debug information
    
    Returns:
        Dict with prompt and optional debug info
    """
    # Convert flat to nested format
    nested = {
        "photoscaler": {},
        "stylescaler": {},
        "lightscaler": {}
    }
    
    for key_id, value in flat_sliders.items():
        slider = get_slider_by_key(key_id)
        if slider:
            pilar = slider.get("pilar", "").lower()
            if pilar in nested:
                nested[pilar][key_id] = value
    
    return assemble_prompt(nested, include_debug)


def get_prompt_preview(slider_values: Dict[str, Dict[str, int]]) -> str:
    """
    Get a preview of what instructions will be generated.
    
    Returns a concise summary without the full template.
    """
    flat_sliders = {}
    for pilar, sliders in slider_values.items():
        for key, value in sliders.items():
            flat_sliders[key] = int(value) if isinstance(value, (int, float)) else 5
    
    preview_lines = []
    
    # Group by pillar
    pillars = {
        "PHOTOSCALER": ["limpieza_artefactos", "geometria", "optica_nitidez", "chronos", 
                        "senal_raw", "sintesis_adn", "grano_filmico", "apertura_bokeh", "resolucion"],
        "STYLESCALER": ["styling_piel", "styling_pelo", "styling_ropa", "maquillaje",
                        "limpieza_entorno", "reencuadre_ia", "atmosfera", "look_cine", "materiales_pbr"],
        "LIGHTSCALER": ["key_light", "fill_light", "rim_light", "volumetria",
                        "temperatura", "contraste", "sombras", "estilo_autor", "reflejos"]
    }
    
    for pilar_name, keys in pillars.items():
        preview_lines.append(f"\n=== {pilar_name} ===")
        for key_id in keys:
            value = flat_sliders.get(key_id, 5)
            level = get_level_from_value(value)
            placeholder = SLIDER_KEY_TO_PLACEHOLDER.get(key_id, "??")
            preview_lines.append(f"[{placeholder.upper()}] {key_id}: {value} ({level})")
    
    return "\n".join(preview_lines)


# Quick test on module load
if __name__ == "__main__":
    test_values = {
        "photoscaler": {
            "limpieza_artefactos": 8,
            "geometria": 5,
            "optica_nitidez": 10,
        },
        "stylescaler": {
            "styling_piel": 6,
            "atmosfera": 3,
        },
        "lightscaler": {
            "key_light": 7,
            "sombras": 9,
        }
    }
    
    result = assemble_prompt(test_values, include_debug=True)
    print("=== ASSEMBLED PROMPT (first 500 chars) ===")
    print(result["prompt"][:500])
    print("\n=== DEBUG INFO ===")
    print(json.dumps(result["debug"], indent=2, default=str)[:1000])
