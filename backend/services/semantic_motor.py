# LuxScaler v28.0 - Semantic Motor Service
# FASE 3: Motor Semántico - Traducción de Sliders a Instrucciones

from typing import Dict, List, Optional, Tuple
from services.supabase_service import supabase_db

class SemanticTranslation:
    def __init__(self, slider_name: str, slider_value: int, instruction: str, intensity_level: str, pillar: str):
        self.slider_name = slider_name
        self.slider_value = slider_value
        self.instruction = instruction
        self.intensity_level = intensity_level
        self.pillar = pillar


class SemanticMotor:
    """
    Traduce valores de sliders (1-10) a instrucciones semánticas para Gemini.
    Lee las instrucciones de la tabla `slider_semantic_mappings` en Supabase.
    """
    
    def __init__(self):
        self._mappings_cache: Dict = {}
        self._loaded = False
    
    async def _ensure_loaded(self):
        """Carga los mappings de la BD si no están en cache."""
        if self._loaded and self._mappings_cache:
            return
        
        try:
            response = supabase_db.client.table("slider_semantic_mappings").select("*").execute()
            
            self._mappings_cache = {}
            for item in response.data or []:
                pillar = item.get('pillar_name', '')
                slider = item.get('slider_name', '')
                
                if pillar not in self._mappings_cache:
                    self._mappings_cache[pillar] = {}
                
                self._mappings_cache[pillar][slider] = {
                    'instruction_off': item.get('instruction_off', ''),
                    'instruction_low': item.get('instruction_low', ''),
                    'instruction_med': item.get('instruction_med', ''),
                    'instruction_high': item.get('instruction_high', ''),
                    'instruction_force': item.get('instruction_force', ''),
                    'display_name': item.get('display_name', slider),
                    'requires_identity_lock': item.get('requires_identity_lock', True),
                    'conflicts_with': item.get('conflicts_with', [])
                }
            
            self._loaded = True
            print(f"SemanticMotor: Loaded {len(response.data or [])} mappings")
            
        except Exception as e:
            print(f"SemanticMotor: Error loading mappings: {e}")
            self._mappings_cache = {}
    
    def _get_intensity_level(self, value: int) -> str:
        """Mapea valor 1-10 a nivel de intensidad."""
        if value <= 0:
            return 'off'
        elif value <= 2:
            return 'low'
        elif value <= 5:
            return 'med'
        elif value <= 8:
            return 'high'
        else:  # 9-10
            return 'force'
    
    def _get_instruction(self, pillar: str, slider: str, value: int) -> Tuple[str, str]:
        """
        Obtiene la instrucción para un slider específico.
        Returns: (instruction_text, intensity_level)
        """
        mapping = self._mappings_cache.get(pillar, {}).get(slider)
        if not mapping:
            return ("", "off")
        
        level = self._get_intensity_level(value)
        instruction_key = f'instruction_{level}'
        instruction = mapping.get(instruction_key, '')
        
        return (instruction, level)
    
    async def translate_slider(self, pillar: str, slider_name: str, value: int) -> SemanticTranslation:
        """Traduce un slider individual a instrucción."""
        await self._ensure_loaded()
        
        instruction, level = self._get_instruction(pillar, slider_name, value)
        
        return SemanticTranslation(
            slider_name=slider_name,
            slider_value=value,
            instruction=instruction,
            intensity_level=level,
            pillar=pillar
        )
    
    async def translate_all(self, slider_config: Dict) -> Dict:
        """
        Traduce toda la configuración de sliders.
        
        Args:
            slider_config: {
                'photoscaler': {'sliders': [{'name': 'x', 'value': 7}, ...]},
                'stylescaler': {...},
                'lightscaler': {...}
            }
        
        Returns:
            {
                'translations': [SemanticTranslation, ...],
                'active_instructions': {'photoscaler': [...], 'stylescaler': [...], 'lightscaler': [...]},
                'conflicts_detected': [{'slider1': str, 'slider2': str, 'severity': str}],
                'summary': {
                    'total_sliders': int,
                    'active_sliders': int,
                    'force_sliders': int,
                    'identity_lock_risk': bool
                }
            }
        """
        await self._ensure_loaded()
        
        translations = []
        active_instructions = {
            'photoscaler': [],
            'stylescaler': [],
            'lightscaler': []
        }
        conflicts = []
        
        total = 0
        active = 0
        force_count = 0
        identity_risk = False
        
        active_slider_names = set()
        
        for pillar_name in ['photoscaler', 'stylescaler', 'lightscaler']:
            pillar_data = slider_config.get(pillar_name, {})
            sliders = pillar_data.get('sliders', [])
            
            # Handle both formats: [{name, value}] and {slider_name: value}
            if isinstance(sliders, list):
                slider_list = sliders
            elif isinstance(sliders, dict):
                slider_list = [{'name': k, 'value': v} for k, v in sliders.items()]
            else:
                slider_list = []
            
            for slider in slider_list:
                slider_name = slider.get('name', '')
                value = int(slider.get('value', 0))
                total += 1
                
                if value <= 0:
                    continue
                
                active += 1
                active_slider_names.add(slider_name)
                
                translation = await self.translate_slider(pillar_name, slider_name, value)
                translations.append(translation)
                
                if translation.instruction:
                    # Add intensity indicator
                    indicator = "●" if value >= 9 else "◐" if value >= 6 else "○"
                    formatted = f"[{indicator}{value}] {translation.instruction}"
                    active_instructions[pillar_name].append(formatted)
                
                if translation.intensity_level == 'force':
                    force_count += 1
                
                # Check identity lock risk
                if slider_name in ['reencuadre_ia', 'geometria'] and value > 5:
                    identity_risk = True
        
        # Detect conflicts
        for pillar_name in ['photoscaler', 'stylescaler', 'lightscaler']:
            pillar_mappings = self._mappings_cache.get(pillar_name, {})
            for slider_name, mapping in pillar_mappings.items():
                if slider_name not in active_slider_names:
                    continue
                
                conflicts_with = mapping.get('conflicts_with', []) or []
                for conflict_name in conflicts_with:
                    if conflict_name in active_slider_names:
                        # Get values for severity check
                        slider1_val = next((s.get('value', 0) for pillar in slider_config.values() 
                                           for s in pillar.get('sliders', []) if s.get('name') == slider_name), 0)
                        slider2_val = next((s.get('value', 0) for pillar in slider_config.values() 
                                           for s in pillar.get('sliders', []) if s.get('name') == conflict_name), 0)
                        
                        severity = 'error' if slider1_val > 7 and slider2_val > 7 else 'warning'
                        
                        # Avoid duplicates
                        existing = [c for c in conflicts if 
                                   (c['slider1'] == slider_name and c['slider2'] == conflict_name) or
                                   (c['slider1'] == conflict_name and c['slider2'] == slider_name)]
                        
                        if not existing:
                            conflicts.append({
                                'slider1': slider_name,
                                'slider2': conflict_name,
                                'severity': severity
                            })
        
        return {
            'translations': translations,
            'active_instructions': active_instructions,
            'conflicts_detected': conflicts,
            'summary': {
                'total_sliders': total,
                'active_sliders': active,
                'force_sliders': force_count,
                'identity_lock_risk': identity_risk
            }
        }


semantic_motor = SemanticMotor()
