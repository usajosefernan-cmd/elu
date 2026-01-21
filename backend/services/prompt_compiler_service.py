import asyncio
from typing import Dict, Optional, List
from services.supabase_service import supabase_db

class PromptCompilerService:
    def __init__(self):
        self._mappings_cache = None
        self._last_fetch = 0
        
    async def _ensure_mappings_loaded(self):
        if self._mappings_cache:
            return

        print("PromptCompiler: Loading semantic mappings from Supabase...")
        try:
            response = supabase_db.client.table("slider_semantic_mappings").select("*").execute()
            data = response.data
            
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
            self._mappings_cache = {}

    def _get_instruction(self, pillar: str, slider: str, value: int) -> str:
        """
        Maps slider value (1-10) to instruction text.
        1-2: LOW, 3-5: MED, 6-8: HIGH, 9-10: FORCE
        Value 0 or missing = OFF
        """
        if not self._mappings_cache:
            return ""
            
        mapping = self._mappings_cache.get(pillar, {}).get(slider)
        if not mapping:
            return ""

        # New scale: 1-10 (0 = off)
        if value <= 0: return mapping.get('instruction_off', "")
        if value <= 2: return mapping.get('instruction_low', "")
        if value <= 5: return mapping.get('instruction_med', "")
        if value <= 8: return mapping.get('instruction_high', "")
        if value >= 9: return mapping.get('instruction_force', "")
        
        return ""

    async def compile_prompt(self, config: dict, vision_data: dict = None) -> str:
        """
        Compiles Universal Prompt from slider config and vision data.
        Now accepts the new vision format with intents and auto_settings.
        """
        await self._ensure_mappings_loaded()

        # Extract settings - support both old and new format
        if config.get('photoscaler') and isinstance(config['photoscaler'], dict):
            if 'sliders' in config['photoscaler']:
                # Old format: { photoscaler: { sliders: [{name, value}] } }
                slider_config = config
            else:
                # New format: { photoscaler: { slider_name: value } }
                slider_config = self._convert_new_format(config)
        else:
            slider_config = self._convert_new_format(config.get('auto_settings', {}))

        # Identity Lock - only disable if reencuadre_ia > 5
        reframe_val = 0
        if 'stylescaler' in slider_config and 'sliders' in slider_config['stylescaler']:
            for s in slider_config['stylescaler']['sliders']:
                if s['name'] == 'reencuadre_ia': 
                    reframe_val = s['value']
        
        identity_lock = reframe_val <= 5

        identity_block = """CRITICAL: IDENTITY LOCK ACTIVE - ABSOLUTE FACE PRESERVATION.
DO NOT change facial structure, bone structure, eye shape, nose shape, lip shape.
DO NOT change face proportions or skin tone significantly.
The person in OUTPUT must be IDENTICAL to INPUT.
Texture/color/lighting changes allowed. Background geometry changes allowed.
FACIAL GEOMETRY MUST BE PIXEL-PERFECT TO SOURCE."""
        
        if not identity_lock:
            identity_block = """REFRAME MODE: Limited structural changes for recomposition.
Facial identity must remain recognizable. Position may change."""

        # Vision context
        vision_context = "No prior analysis."
        intent_context = ""
        if vision_data:
            if 'production_analysis' in vision_data:
                pa = vision_data['production_analysis']
                vision_context = f"""
CURRENT: {pa.get('current_quality', 'Unknown')}
TARGET: {pa.get('target_vision', 'Professional enhancement')}"""
            
            if 'auto_settings' in vision_data:
                intent_context = f"SELECTED INTENT: {vision_data['auto_settings'].get('primary_intent_used', 'Auto')}"
            
            if 'technical_diagnosis' in vision_data:
                td = vision_data['technical_diagnosis']
                vision_context += f"""
TECH: Noise={td.get('noise_level', 'N/A')}/10, Blur={td.get('blur_level', 'N/A')}/10"""

        # Build instruction blocks
        def get_block(pillar_name):
            p_data = slider_config.get(pillar_name)
            if not p_data:
                return "[STANDARD]"
            
            block = ""
            sliders = p_data.get('sliders', [])
            for slider in sliders:
                val = slider.get('value', 0)
                if val <= 0: continue
                
                instruction = self._get_instruction(pillar_name, slider['name'], val)
                if instruction:
                    # Add intensity indicator
                    intensity = "●" if val >= 9 else "◐" if val >= 6 else "○"
                    block += f"[{intensity}{val}] {instruction}\n"
            return block if block else "[STANDARD]"

        photoscaler_block = get_block('photoscaler')
        stylescaler_block = get_block('stylescaler')
        lightscaler_block = get_block('lightscaler')

        # Assemble final prompt
        prompt = f"""
[LUXSCALER v28.1 - UNIVERSAL PRODUCTION PROTOCOL]
[ROLE: HIGH-END PHOTO PRODUCTION ENGINE]
{intent_context}

=== CRITICAL: ASPECT RATIO LOCK ===
OUTPUT MUST HAVE EXACTLY THE SAME DIMENSIONS AND ASPECT RATIO AS INPUT.
DO NOT crop, extend, pad, or change the frame in any way.
Every pixel position in output must correspond to the same position in input.
If input is 1080x1920 (9:16), output MUST be 1080x1920 (9:16).
If input is 4:3, output MUST be 4:3.
NO EXCEPTIONS. This is required for before/after comparison overlay.

=== PHASE 0: IDENTITY LOCK ===
{identity_block}

=== PHASE 1: PRODUCTION CONTEXT ===
{vision_context}

=== PHASE 2: CAMERA & OPTICS (PhotoScaler) ===
{photoscaler_block}

=== PHASE 3: ART DIRECTION (StyleScaler) ===
{stylescaler_block}

=== PHASE 4: LIGHTING (LightScaler) ===
{lightscaler_block}

=== PHASE 5: EXECUTION ===
Execute all instructions while PRESERVING:
1. The subject's identity (same person)
2. The exact aspect ratio and dimensions of the input
3. The pixel-to-pixel correspondence for overlay comparison

Output should look like a $100,000 professional production.
Maintain natural appearance unless FORCE instructions are present.

=== NEGATIVE ===
different person, face swap, age change, gender change, distorted anatomy, 
bad hands, extra limbs, watermarks, text, compression artifacts,
different aspect ratio, cropped, extended, padded, different dimensions.
"""
        return prompt

    def _convert_new_format(self, settings: dict) -> dict:
        """
        Converts new format { pillar: { slider: value } } 
        to old format { pillar: { sliders: [{name, value}] } }
        """
        result = {}
        for pillar in ['photoscaler', 'stylescaler', 'lightscaler']:
            pillar_data = settings.get(pillar, {})
            if isinstance(pillar_data, dict) and 'sliders' not in pillar_data:
                # New format - convert
                result[pillar] = {
                    'sliders': [
                        {'name': k, 'value': v} 
                        for k, v in pillar_data.items()
                        if isinstance(v, (int, float))
                    ]
                }
            else:
                result[pillar] = pillar_data
        return result

prompt_compiler = PromptCompilerService()
