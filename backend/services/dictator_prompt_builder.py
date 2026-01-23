"""
LuxScaler v40.1 - Dictator Prompt Builder
Construye el "Style Lock Prompt" que FUERZA la consistencia estilística en presets.
"""

from typing import Dict, List, Tuple

# Mapeo de sliders a sus "Lock Statements" agresivos
SLIDER_LOCK_STATEMENTS = {
    # STYLESCALER - Los más creativos
    "styling_ropa": {
        "name": "WARDROBE",
        "lock": "WARDROBE LOCK: FORCE complete clothing replacement. IGNORE original fabric, style, and fit. IMPOSE the preset's fashion directive regardless of input image clothing.",
        "destroy": "DESTROY original garment data. Replace 100%."
    },
    "limpieza_entorno": {
        "name": "LOCATION", 
        "lock": "LOCATION LOCK: FORCE environment teleportation. IGNORE original background completely. IMPOSE the preset's set design as if the subject was photographed there.",
        "destroy": "DESTROY original background pixels. Full replacement."
    },
    "styling_pelo": {
        "name": "HAIR",
        "lock": "HAIR LOCK: FORCE hair transformation. IGNORE original hairstyle, color, and texture. IMPOSE the preset's hair directive.",
        "destroy": "Override original hair completely."
    },
    "look_cine": {
        "name": "COLOR GRADE",
        "lock": "COLOR GRADING LOCK: FORCE cinematic color palette. IGNORE original color temperature and tones. IMPOSE the preset's color science.",
        "destroy": "Override original color data. Apply preset LUT."
    },
    "atmosfera": {
        "name": "ATMOSPHERE",
        "lock": "ATMOSPHERE LOCK: FORCE atmospheric density and fog. IGNORE original air clarity. IMPOSE volumetric haze as defined by preset.",
        "destroy": "Add atmospheric particles regardless of original."
    },
    "reencuadre_ia": {
        "name": "FRAMING",
        "lock": "FRAMING LOCK: FORCE compositional crop. IGNORE original framing decisions. IMPOSE cinematic aspect ratio and rule-of-thirds alignment.",
        "destroy": "Recompose aggressively."
    },
    
    # LIGHTSCALER - Iluminación dramática
    "key_light": {
        "name": "KEY LIGHT",
        "lock": "KEY LIGHT LOCK: FORCE dramatic main light source. IGNORE original ambient lighting direction. IMPOSE Rembrandt/butterfly/split lighting as defined.",
        "destroy": "Override original light direction completely."
    },
    "estilo_autor": {
        "name": "LIGHTING STYLE",
        "lock": "AUTEUR LIGHTING LOCK: FORCE signature cinematographer style. IGNORE original lighting mood. IMPOSE dramatic fall-off and contrast ratio.",
        "destroy": "Replace lighting scheme entirely."
    },
    "rim_light": {
        "name": "RIM LIGHT",
        "lock": "RIM LIGHT LOCK: FORCE edge separation lighting. ADD strong backlight regardless of original. Create heroic subject isolation.",
        "destroy": "Add rim light even if not present."
    },
    "volumetria": {
        "name": "VOLUMETRIC",
        "lock": "VOLUMETRIC LOCK: FORCE visible light rays and god beams. IGNORE original light scattering. IMPOSE dramatic Tyndall effect.",
        "destroy": "Add volumetric rays regardless of original."
    },
    "temperatura": {
        "name": "COLOR TEMP",
        "lock": "COLOR TEMPERATURE LOCK: FORCE specific Kelvin value. IGNORE original white balance. IMPOSE golden hour/blue hour as defined.",
        "destroy": "Override white balance completely."
    },
    "contraste": {
        "name": "CONTRAST",
        "lock": "CONTRAST LOCK: FORCE specific tonal curve. IGNORE original dynamic range distribution. IMPOSE cinematic S-curve or crushed blacks.",
        "destroy": "Remap histogram to preset curve."
    },
    
    # PHOTOSCALER - Técnicos (menos agresivos pero incluidos)
    "grano_filmico": {
        "name": "FILM GRAIN",
        "lock": "FILM GRAIN LOCK: FORCE organic grain texture. ADD film emulation regardless of original digital cleanliness.",
        "destroy": "Add grain even to clean digital images."
    },
    "apertura_bokeh": {
        "name": "BOKEH",
        "lock": "DEPTH OF FIELD LOCK: FORCE specific bokeh intensity. IGNORE original aperture/focus. IMPOSE shallow DOF blur.",
        "destroy": "Blur background regardless of original sharpness."
    }
}


def build_dictator_prompt(sliders_config: Dict, threshold: int = 8) -> Tuple[str, List[Dict]]:
    """
    Construye el "Dictator Prompt" basado en los sliders dominantes (> threshold).
    
    Args:
        sliders_config: Configuración de sliders {photoscaler: {}, stylescaler: {}, lightscaler: {}}
        threshold: Valor mínimo para considerar un slider como "dominante" (default: 8)
    
    Returns:
        Tuple[str, List[Dict]]: (style_lock_prompt, dominant_sliders_list)
    """
    dominant_sliders = []
    lock_statements = []
    
    # Recorrer todos los pilares
    for pilar, sliders in sliders_config.items():
        if not isinstance(sliders, dict):
            continue
        
        for slider_key, value in sliders.items():
            if not isinstance(value, (int, float)):
                continue
            
            if value > threshold and slider_key in SLIDER_LOCK_STATEMENTS:
                lock_info = SLIDER_LOCK_STATEMENTS[slider_key]
                dominant_sliders.append({
                    "key": slider_key,
                    "pilar": pilar,
                    "value": value,
                    "name": lock_info["name"]
                })
                lock_statements.append(f"- {lock_info['lock']}")
    
    # Si no hay sliders dominantes, no hay dictator prompt
    if not dominant_sliders:
        return None, []
    
    # Construir el prompt dictador
    dictator_prompt = """
=== ⚓ STYLE OVERRIDE PROTOCOL (PRIORITY 1 - ABSOLUTE) ===
[DIRECTIVE: THE DICTATOR PROMPT]
[PURPOSE: Ensure PERFECT style consistency across different input images]

**CRITICAL INSTRUCTION**: The following style locks OVERRIDE any characteristics 
detected in the input image. Do NOT negotiate with the source material.
Do NOT blend or compromise. IMPOSE the style directives below.

**LOCKED STYLE ELEMENTS:**
"""
    
    for statement in lock_statements:
        dictator_prompt += f"{statement}\n"
    
    dictator_prompt += """
**EXECUTION PRIORITY:**
1. FIRST: Apply all LOCK directives above (ignore conflicting source data)
2. THEN: Process remaining sliders normally
3. FINALLY: Verify locks were applied (do not soften or blend)

**IF THE INPUT IMAGE CONTRADICTS THESE LOCKS:**
→ DESTROY the original data in those areas
→ REPLACE with preset-defined style
→ The preset's vision is ABSOLUTE

=== END STYLE OVERRIDE PROTOCOL ===
"""
    
    return dictator_prompt.strip(), dominant_sliders


def get_preset_mode(sliders_config: Dict) -> str:
    """
    Determina el modo del preset basado en los sliders.
    """
    dominant_count = 0
    
    for pilar, sliders in sliders_config.items():
        if not isinstance(sliders, dict):
            continue
        for key, value in sliders.items():
            if isinstance(value, (int, float)) and value > 8:
                dominant_count += 1
    
    if dominant_count >= 3:
        return "DICTATOR"  # Muchos sliders forzados
    elif dominant_count >= 1:
        return "SHOWMAN"   # Algunos sliders creativos
    else:
        return "FORENSIC"  # Solo restauración
