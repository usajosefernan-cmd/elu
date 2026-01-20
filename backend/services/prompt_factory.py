from services.hierarchy_resolver import resolve_conflicts
from backend.data.snippets import SNIPPET_DICTIONARY, map_value_to_level

def build_universal_prompt(config: dict, vision_summary: dict = None) -> str:
    """
    Assembles the 'UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v27.1'
    incorporating logic layer, identity lock, and vision analysis.
    """
    
    # 1. Logic Layer: Resolve Conflicts
    config = resolve_conflicts(config)

    # 2. Dynamic Injection Logic (Identity Lock)
    # Check if geometry sliders are active
    geom_val = 0
    reframe_val = 0
    for s in config['photoscaler']['sliders']:
        if s['name'] == 'geometria': geom_val = s['value']
    for s in config['stylescaler']['sliders']:
        if s['name'] == 'reencuadre_ia': reframe_val = s['value']
        
    geometric_sliders_active = (geom_val > 0) or (reframe_val > 0)
    
    identity_block = "CRITICAL: IDENTITY LOCK ACTIVE. DO NOT MOVE PIXELS. Structure must match overlay 100%. Only change texture/lighting."
    if geometric_sliders_active:
        identity_block = "ALLOW structural changes for geometry correction."

    # 3. Format Vision Summary
    vision_text = "No prior vision analysis."
    if vision_summary:
        anchors = ", ".join(vision_summary.get("semantic_anchors", []))
        tech = vision_summary.get("technical_assessment", {})
        vision_text = f"""
        NARRATIVE ANCHORS: {anchors}
        TECHNICAL SPECS: Noise={tech.get('noise_level')}, Blur={tech.get('blur_level')}, Damage={tech.get('damage_level')}
        """

    # 4. Build Pillar Blocks
    def get_block(pillar_name):
        p_data = config.get(pillar_name)
        if not p_data or p_data['mode'] == 'off':
            return "[INACTIVE]"
        
        block = ""
        for slider in p_data['sliders']:
            val = slider['value']
            if val == 0: continue # Skip OFF to reduce noise
            
            # Re-fetch snippet in case hierarchy resolver changed value
            snippet = SNIPPET_DICTIONARY[pillar_name][slider['name']][val]
            block += f"- {snippet}\n"
        return block

    photoscaler_block = get_block('photoscaler')
    stylescaler_block = get_block('stylescaler')
    lightscaler_block = get_block('lightscaler')

    # 5. Assemble Template
    prompt = f"""
[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v27.1]
[ROLE: REALITY RECONSTRUCTION ENGINE]

INPUT CONTEXT: {vision_text}

=== PHASE 0: STRUCTURAL INTEGRITY (IDENTITY LOCK) ===
{identity_block}

=== PHASE 1: CORE DIAGNOSIS & RE-SYNTHESIS STRATEGY ===
IF INPUT IS BLURRY/NOISY/DAMAGED -> ACTIVATE "COMPLETE RE-SYNTHESIS".
IGNORE source artifacts. HALLUCINATE high-frequency details.
VIRTUAL RE-SHOOT: Simulate 1/8000s shutter (zero blur).

=== PHASE 2: SUBJECT & ANATOMY ===
[INSTRUCTION: Restore faces with "Portrait-Level" fidelity.]
{stylescaler_block}

=== PHASE 3: OPTICS, PHYSICS & LIGHTING ===
GEOMETRY & RESTORATION:
{photoscaler_block}

LIGHTING & TONE:
{lightscaler_block}

=== NEGATIVE PROMPT ===
damaged, blurry, noisy, distorted faces, bad anatomy, text, watermarks, jpeg artifacts, shifting eyes, changing facial features, morphing bone structure, different pose.
"""
    return prompt
