# LuxScaler v28.10 - Prompt Compiler Service
# Según documento maestro: PHASE 4 - PROMPT ASSEMBLY

import asyncio
from typing import Dict, Optional, List
from services.supabase_service import supabase_db

class PromptCompilerService:
    """
    Compila el prompt final según el documento maestro.
    
    Estructura del prompt:
    === PHOTOSCALER (Technical Imaging) ===
    [instrucciones...]
    
    === STYLESCALER (Aesthetic & Vibe) ===
    [instrucciones...]
    
    === LIGHTSCALER (Illumination) ===
    [instrucciones...]
    
    === FINAL DIRECTIVES ===
    Apply ALL instructions above seamlessly...
    """
    
    def __init__(self):
        self._mappings_cache: Dict = {}
        self._loaded = False
    
    async def _load_mappings(self):
        """Carga las instrucciones de sliders desde la BD."""
        if self._loaded:
            return
        
        try:
            response = supabase_db.client.table("slider_semantic_mappings").select("*").execute()
            
            self._mappings_cache = {}
            for item in response.data or []:
                pillar = item.get('pillar_name', '').upper()
                slider_name = item.get('slider_name', '')
                
                if pillar not in self._mappings_cache:
                    self._mappings_cache[pillar] = {}
                
                # Mapear niveles de instrucción
                self._mappings_cache[pillar][slider_name] = {
                    0: item.get('instruction_off', ''),
                    1: item.get('instruction_low', ''),
                    2: item.get('instruction_low', ''),
                    3: item.get('instruction_low', ''),
                    4: item.get('instruction_med', ''),
                    5: item.get('instruction_med', ''),
                    6: item.get('instruction_med', ''),
                    7: item.get('instruction_high', ''),
                    8: item.get('instruction_high', ''),
                    9: item.get('instruction_force', ''),
                    10: item.get('instruction_force', ''),
                    'display_name': item.get('display_name', slider_name)
                }
            
            self._loaded = True
            print(f"PromptCompiler: Loaded mappings for {len(self._mappings_cache)} pillars")
            
        except Exception as e:
            print(f"PromptCompiler: Error loading mappings: {e}")
    
    def _get_instruction(self, pillar: str, slider_name: str, value: int) -> str:
        """Obtiene la instrucción para un slider según su valor."""
        pillar_upper = pillar.upper()
        if pillar_upper not in self._mappings_cache:
            return ""
        
        slider_data = self._mappings_cache[pillar_upper].get(slider_name)
        if not slider_data:
            return ""
        
        # Clamp value to 0-10
        value = max(0, min(10, value))
        instruction = slider_data.get(value, '')
        
        return instruction if instruction else ""
    
    async def compile_prompt(
        self, 
        config: dict, 
        protocol_locks: dict = None,
        vision_data: dict = None
    ) -> str:
        """
        Compila el prompt final según el documento maestro.
        
        Args:
            config: Configuración de sliders {pillar: {sliders: [{name, value}]}}
            protocol_locks: Locks de protocolo (categoría detectada)
            vision_data: Datos del análisis de visión
        
        Returns:
            Prompt compilado
        """
        await self._load_mappings()
        
        prompt_parts = []
        
        # === PHOTOSCALER ===
        prompt_parts.append("=== PHOTOSCALER (Technical Imaging) ===")
        photo_instructions = self._assemble_pillar(
            'photoscaler', 
            config.get('photoscaler', {}),
            protocol_locks
        )
        prompt_parts.append(photo_instructions if photo_instructions else "[Standard processing]")
        
        # === STYLESCALER ===
        prompt_parts.append("\n=== STYLESCALER (Aesthetic & Vibe) ===")
        style_instructions = self._assemble_pillar(
            'stylescaler',
            config.get('stylescaler', {}),
            protocol_locks
        )
        prompt_parts.append(style_instructions if style_instructions else "[Standard styling]")
        
        # === LIGHTSCALER ===
        prompt_parts.append("\n=== LIGHTSCALER (Illumination) ===")
        light_instructions = self._assemble_pillar(
            'lightscaler',
            config.get('lightscaler', {}),
            protocol_locks
        )
        prompt_parts.append(light_instructions if light_instructions else "[Natural lighting]")
        
        # === FINAL DIRECTIVES ===
        prompt_parts.append("\n=== FINAL DIRECTIVES ===")
        prompt_parts.append(
            "Apply ALL instructions above seamlessly. "
            "TRANSFORM the image according to each instruction. "
            "The output MUST show visible changes from the input. "
            "Preserve image authenticity unless explicitly instructed otherwise. "
            "Generate the result at maximum quality."
        )
        
        return "\n".join(prompt_parts)
    
    def _assemble_pillar(
        self, 
        pillar: str, 
        pillar_config: dict,
        protocol_locks: dict = None
    ) -> str:
        """Ensambla las instrucciones de un pilar."""
        instructions = []
        
        # Get sliders - handle both formats
        sliders = pillar_config.get('sliders', [])
        
        # Convert to list format if dict
        if isinstance(sliders, dict):
            sliders = [{'name': k, 'value': v} for k, v in sliders.items()]
        
        # Check for protocol locks
        if protocol_locks:
            locked_sliders = []
            for slider_key, lock_data in protocol_locks.items():
                if isinstance(lock_data, dict) and lock_data.get('locked'):
                    hard_prompt = lock_data.get('hard_prompt', '')
                    if hard_prompt:
                        locked_sliders.append(f"[PROTOCOL LOCK] {slider_key}: {hard_prompt}")
            
            if locked_sliders:
                instructions.append("[PROTOCOL OVERRIDE ACTIVE]")
                instructions.extend(locked_sliders)
                instructions.append("")
        
        # Process each slider
        for slider in sliders:
            name = slider.get('name', '')
            value = int(slider.get('value', 0))
            
            if value <= 0:
                continue  # Skip disabled sliders
            
            instruction = self._get_instruction(pillar, name, value)
            
            if instruction:
                # Add intensity indicator
                if value >= 9:
                    prefix = f"[FORCE {value}]"
                elif value >= 7:
                    prefix = f"[HIGH {value}]"
                elif value >= 4:
                    prefix = f"[MED {value}]"
                else:
                    prefix = f"[LOW {value}]"
                
                display_name = self._mappings_cache.get(pillar.upper(), {}).get(name, {}).get('display_name', name)
                instructions.append(f"{prefix} {display_name}: {instruction}")
        
        return "\n".join(instructions)
    
    async def compile_with_metadata(self, config: dict, vision_data: dict = None) -> dict:
        """Compila el prompt y devuelve metadata."""
        try:
            await self._load_mappings()
            
            # Count active and force sliders
            active = 0
            force = 0
            
            for pillar in ['photoscaler', 'stylescaler', 'lightscaler']:
                sliders = config.get(pillar, {}).get('sliders', [])
                if isinstance(sliders, dict):
                    sliders = [{'name': k, 'value': v} for k, v in sliders.items()]
                
                for s in sliders:
                    val = int(s.get('value', 0))
                    if val > 0:
                        active += 1
                    if val >= 9:
                        force += 1
            
            prompt = await self.compile_prompt(config, None, vision_data)
            
            return {
                'success': True,
                'prompt': prompt,
                'metadata': {
                    'active_sliders': active,
                    'force_sliders': force,
                    'version': '28.10'
                }
            }
        except Exception as e:
            print(f"PromptCompiler Error: {e}")
            return {
                'success': False,
                'error': str(e),
                'prompt': '',
                'metadata': {}
            }


prompt_compiler = PromptCompilerService()
