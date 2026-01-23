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

# The Universal Template v40.0 - CINEMATIC PRODUCTION PROTOCOL
UNIVERSAL_TEMPLATE = """[SYSTEM OVERRIDE: UNIVERSAL CINEMATIC PRODUCTION PROTOCOL v40.0]
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
Execute the "Virtual Reshoot" with maximum production value. Make it look like a magazine cover or a movie still, but ensure the subject's mother would still recognize them instantly."""


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
        "version": "v40.0",
        "template": "UNIVERSAL CINEMATIC PRODUCTION PROTOCOL"
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
