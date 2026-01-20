from data.snippets import SNIPPET_DICTIONARY

def build_universal_prompt(config: dict, vision_summary: dict = None) -> str:
    """
    Assembles the 'UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v27.0'
    incorporating the vision analysis summary and the active pillar snippets.
    """
    
    # 1. Format Vision Summary
    vision_text = "No prior vision analysis."
    if vision_summary:
        anchors = ", ".join(vision_summary.get("semantic_anchors", []))
        tech = vision_summary.get("technical_assessment", {})
        vision_text = f"""
        NARRATIVE ANCHORS: {anchors}
        TECHNICAL SPECS: Noise={tech.get('noise_level')}, Blur={tech.get('blur_level')}, Damage={tech.get('damage_level')}
        """

    # 2. Build Pillar Blocks
    def get_block(pillar_name):
        p_data = config.get(pillar_name)
        if not p_data or p_data['mode'] == 'off':
            return "[INACTIVE]"
        
        block = ""
        for slider in p_data['sliders']:
            # Only include if value > 0 for cleanliness, or include all?
            # PRD says "Recopila TODOS los valores".
            block += f"- {slider['name'].upper()}: {slider['snippet']} (Value: {slider['value']}/10)\n"
        return block

    photoscaler_block = get_block('photoscaler')
    stylescaler_block = get_block('stylescaler')
    lightscaler_block = get_block('lightscaler')

    # 3. Assemble Template
    prompt = f"""
[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v27.0]
[ROLE: REALITY RECONSTRUCTION ENGINE]

INPUT CONTEXT: {vision_text}

=== PHASE 1: CORE DIAGNOSIS & RE-SYNTHESIS STRATEGY ===
IF INPUT IS BLURRY/NOISY/DAMAGED -> ACTIVATE "COMPLETE RE-SYNTHESIS".

IGNORE source artifacts (noise, blur, jpeg blocks).
HALLUCINATE high-frequency details (pores, fabric weave, architectural ornaments).
VIRTUAL RE-SHOOT: Simulate 1/8000s shutter (zero blur) and Rectilinear Lens.
SEVERE DAMAGE: If areas are missing/white blobs, INFILL based on context.

=== PHASE 2: SUBJECT & ANATOMY ===
[INSTRUCTION: Restore faces with "Portrait-Level" fidelity. No melted features.]
{stylescaler_block}

=== PHASE 3: OPTICS, PHYSICS & LIGHTING ===
[SUB-PROTOCOL: SOLID SIGNAL MASTER]
GEOMETRY & RESTORATION:
{photoscaler_block}

LIGHTING & TONE:
{lightscaler_block}

[BASE OPTICAL RULES]:
LOW-LIGHT: Anchor Black Point at (0,0,0). Lift Zones 1-3 for texture.
DRAMA CLUB: Use Complementary Contrast (Teal/Orange) if appropriate.
ANAMORPHIC: Allow subtle oval bokeh and horizontal flares if "Cinematic" is requested.
WHITE BALANCE: Neutralize tint but PRESERVE atmospheric temp (Blue Hour/Golden Hour).

=== PHASE 4: TEXTURE & OUTPUT FIDELITY ===
BIT DEPTH: 32-bit Float Internal Processing.
OUTPUT: Native 4K/8K UHD. Zero Noise. Max Acutance.
COMPOSITIONAL LOCK: Prioritize geometric correctness over pixel loyalty.

=== NEGATIVE PROMPT (EXCLUSION LIST) ===
damaged photo, torn photo, white spots, chemical burns, missing pixels, scratched, dirty, changing aspect ratio, cropping subject, shifting position, misaligned comparison, faithful to bad source, preserving blur, motion blur, camera shake, trepidation, melted faces, smudged faces, faceless people, distorted eyes, merged teeth, plastic skin, wax skin, neon red skin, sunburned, oversaturated, crushed shadows, blocked blacks, underexposed foreground, silhouetted buildings, dark blobs, flat lighting, noisy, grainy, jpeg artifacts, bad anatomy, floating limbs, double vision, ghosting, blurry table, blurry crowd, clipped highlights, solarized sky, foggy lens, steam patch, dirty lens, light leak, unwanted lens flare, washed out colors, milky overlay, low contrast haze, barrel distortion, curved walls, fish-eye effect, chromatic aberration, purple fringing, wide angle distortion, big nose distortion, tilted horizon, crooked lines, leaning buildings, distorted perspective, flat histogram, grey blacks, banding, posterization.
"""
    return prompt
