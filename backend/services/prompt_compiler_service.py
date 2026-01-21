import asyncio
from typing import Dict, Optional, List
from services.supabase_service import supabase_db
from services.hierarchy_resolver import resolve_conflicts

class PromptCompilerService:
    def __init__(self):
        self._mappings_cache = None
        self._last_fetch = 0
        
    async def _ensure_mappings_loaded(self):
        # Simple cache - could add TTL if needed
        if self._mappings_cache:
            return

        print("PromptCompiler: Loading semantic mappings from Supabase...")
        try:
            # Fetch all mappings
            response = supabase_db.client.table("slider_semantic_mappings").select("*").execute()
            data = response.data
            
            # Organize by pillar -> slider
            self._mappings_cache = {}
            for item in data:
                p = item['pillar_name']
                s = item['slider_name']
                if p not in self._mappings_cache:
                    self._mappings_cache[p] = {}
                self._mappings_cache[p][s] = item
                
            print(f"PromptCompiler: Loaded {len(data)} mappings.")
        except Exception as e:
            print(f"PromptCompiler: Error loading mappings: {e}")
            self._mappings_cache = {} # Avoid infinite retries/errors

    def _get_instruction(self, pillar: str, slider: str, value: int) -> str:
        if not self._mappings_cache:
            return ""
            
        mapping = self._mappings_cache.get(pillar, {}).get(slider)
        if not mapping:
            return ""

        if value == 0: return mapping.get('instruction_off', "")
        if 1 <= value <= 3: return mapping.get('instruction_low', "")
        if 4 <= value <= 6: return mapping.get('instruction_med', "")
        if 7 <= value <= 9: return mapping.get('instruction_high', "")
        if value >= 10: return mapping.get('instruction_force', "")
        
        return ""

    async def compile_prompt(self, config: dict, vision_summary: dict = None) -> str:
        """
        Compiles the Universal Prompt using Supabase mappings and v28 logic.
        """
        await self._ensure_mappings_loaded()
        
        # 1. Logic Layer: Resolve Conflicts
        config = resolve_conflicts(config)

        # 2. Identity Lock Logic - SIEMPRE ACTIVO excepto cuando reencuadre_ia > 5
        geom_val = 0
        reframe_val = 0
        # Safe access to sliders
        if 'photoscaler' in config and 'sliders' in config['photoscaler']:
            for s in config['photoscaler']['sliders']:
                if s['name'] == 'geometria': geom_val = s['value']
        
        if 'stylescaler' in config and 'sliders' in config['stylescaler']:
            for s in config['stylescaler']['sliders']:
                if s['name'] == 'reencuadre_ia': reframe_val = s['value']
        
        # Solo desactivar Identity Lock si reencuadre_ia está muy alto
        # Geometria NO debería afectar la identidad facial
        reframe_active = reframe_val > 5
        
        identity_block = """CRITICAL: IDENTITY LOCK ACTIVE - ABSOLUTE FACE PRESERVATION.
DO NOT change facial structure, bone structure, eye shape, nose shape, lip shape, or ear shape.
DO NOT change face proportions, face width, or face length.
DO NOT change skin tone significantly or add/remove facial features.
The person in the OUTPUT must be IDENTICAL to the person in the INPUT.
Texture/color/lighting changes are allowed. Geometry changes to the BACKGROUND are allowed.
FACIAL GEOMETRY MUST BE PIXEL-PERFECT TO SOURCE."""
        
        if reframe_active:
            identity_block = """REFRAME MODE ACTIVE: Limited structural changes allowed for recomposition.
PRESERVE facial identity but allow background/composition changes.
Face structure must remain recognizable - only position may change."""

        # 3. Vision Summary
        vision_text = "No prior vision analysis."
        if vision_summary:
            anchors = ", ".join(vision_summary.get("semantic_anchors", []))
            tech = vision_summary.get("technical_assessment", {})
            vision_text = f"""
            NARRATIVE ANCHORS: {anchors}
            TECHNICAL SPECS: Noise={tech.get('noise_level', 'N/A')}, Blur={tech.get('blur_level', 'N/A')}, Damage={tech.get('damage_level', 'N/A')}
            """

        # 4. Build Pillar Blocks
        def get_block(pillar_name):
            p_data = config.get(pillar_name)
            if not p_data or p_data.get('mode') == 'off':
                return "[INACTIVE]"
            
            block = ""
            if 'sliders' in p_data:
                for slider in p_data['sliders']:
                    val = slider['value']
                    if val == 0: continue # Skip OFF
                    
                    instruction = self._get_instruction(pillar_name, slider['name'], val)
                    if instruction:
                        block += f"- {instruction}\n"
            return block

        photoscaler_block = get_block('photoscaler')
        stylescaler_block = get_block('stylescaler')
        lightscaler_block = get_block('lightscaler')

        # 5. Assemble Template
        prompt = f"""
[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v28.0]
[ROLE: REALITY RECONSTRUCTION ENGINE]
[SOURCE: SUPABASE SEMANTIC MAPPINGS]

INPUT CONTEXT: {vision_text}

=== PHASE 0: STRUCTURAL INTEGRITY (IDENTITY LOCK) ===
{identity_block}

=== PHASE 1: CORE DIAGNOSIS & RE-SYNTHESIS STRATEGY ===
IF INPUT IS BLURRY/NOISY/DAMAGED -> ACTIVATE "COMPLETE RE-SYNTHESIS".
IGNORE source artifacts. HALLUCINATE high-frequency details.
VIRTUAL RE-SHOOT: Simulate 1/8000s shutter (zero blur).
CRITICAL: All enhancements must preserve the EXACT SAME PERSON.

=== PHASE 2: SUBJECT & ANATOMY ===
[INSTRUCTION: Restore faces with "Portrait-Level" fidelity. SAME PERSON.]
{stylescaler_block}

=== PHASE 3: OPTICS, PHYSICS & LIGHTING ===
GEOMETRY & RESTORATION (BACKGROUND ONLY - DO NOT MODIFY FACE GEOMETRY):
{photoscaler_block}

LIGHTING & TONE:
{lightscaler_block}

=== NEGATIVE PROMPT ===
damaged, blurry, noisy, distorted faces, bad anatomy, text, watermarks, jpeg artifacts, shifting eyes, changing facial features, morphing bone structure, different pose, different person, face swap, age change, gender change, ethnicity change, different identity.
"""
        return prompt

prompt_compiler = PromptCompilerService()
