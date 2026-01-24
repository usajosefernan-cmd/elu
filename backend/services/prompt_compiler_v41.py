# LuxScaler v41 - Prompt Compiler desde Supabase
# Ensambla prompts consultando slider_definitions

from typing import Dict, List, Optional, Any
from services.supabase_service import supabase_db


class PromptCompilerV41:
    """
    Compilador de prompts v41 DATA-DRIVEN.
    Lee slider_definitions desde Supabase y ensambla instrucciones.
    
    NO hardcodea comportamientos - todo viene de la DB.
    """
    
    def __init__(self):
        self.version = "41.0"
        self.slider_cache = None
    
    async def load_slider_definitions(self) -> Dict[str, Any]:
        """Carga todas las definiciones de sliders desde Supabase"""
        
        if self.slider_cache:
            return self.slider_cache
        
        try:
            response = supabase_db.client.table('slider_definitions')\
                .select('*')\
                .execute()
            
            # Crear mapa para acceso rápido
            slider_map = {}
            for slider in response.data or []:
                slider_map[slider['slider_key']] = slider
            
            self.slider_cache = slider_map
            
            print(f"[PromptCompiler v41] Loaded {len(slider_map)} slider definitions from Supabase")
            
            return slider_map
            
        except Exception as e:
            print(f"[PromptCompiler v41] Error loading sliders: {e}")
            return {}
    
    def resolve_level(self, value: Any) -> str:
        """Convierte valor numérico o string a nivel"""
        
        if isinstance(value, str):
            upper = value.upper()
            if upper in ['OFF', 'LOW', 'MED', 'HIGH', 'FORCE']:
                return upper
        
        v = int(value) if isinstance(value, (int, float)) else 5
        
        if v <= 0:
            return 'OFF'
        elif v <= 3:
            return 'LOW'
        elif v <= 6:
            return 'MED'
        elif v <= 9:
            return 'HIGH'
        else:
            return 'FORCE'
    
    async def compile_from_sliders(
        self,
        slider_config: Dict[str, Any],
        vision_result: Optional[Dict] = None,
        has_person: bool = False
    ) -> Dict[str, Any]:
        """
        Compila el prompt desde slider_config consultando Supabase.
        
        Args:
            slider_config: {p1: 5, p3: 9, s1: 7, ...}
            vision_result: Resultado del vision orchestrator
            has_person: Si la imagen tiene rostro
        
        Returns:
            {
                'compiled_prompt': str,
                'instructions': list,
                'metadata': {...}
            }
        """
        
        # Cargar definiciones
        slider_map = await self.load_slider_definitions()
        
        if not slider_map:
            return {"error": "No slider definitions available"}
        
        # Ensamblar instrucciones
        instructions = []
        
        for slider_key, value in slider_config.items():
            if slider_key in ['force_reimagine', 'ocr_lock']:
                continue  # Metadata, no slider real
            
            slider_def = slider_map.get(slider_key)
            if not slider_def:
                continue
            
            level = self.resolve_level(value)
            
            # Obtener instrucción según nivel
            instruction_text = None
            if level == 'OFF':
                instruction_text = slider_def.get('instruction_off')
            elif level == 'LOW':
                instruction_text = slider_def.get('instruction_low')
            elif level == 'MED':
                instruction_text = slider_def.get('instruction_med')
            elif level == 'HIGH':
                instruction_text = slider_def.get('instruction_high')
            elif level == 'FORCE':
                instruction_text = slider_def.get('instruction_force')
            
            if instruction_text and instruction_text.strip():
                instructions.append({
                    'slider': slider_key.upper(),
                    'level': level,
                    'pillar': slider_def['pillar'],
                    'text': instruction_text.strip()
                })
        
        # Agrupar por pilar
        photo_instructions = [i for i in instructions if i['pillar'] == 'PHOTOSCALER']
        style_instructions = [i for i in instructions if i['pillar'] == 'STYLESCALER']
        light_instructions = [i for i in instructions if i['pillar'] == 'LIGHTSCALER']
        
        # Ensamblar prompt
        base_subject = vision_result.get('visual_summary', 'Professional image enhancement') if vision_result else 'Professional image enhancement'
        
        diagnostics_summary = vision_result.get('reasoning', '') if vision_result else ''
        
        # Construir bloques
        photo_block = '\n'.join([f"- [{i['slider']} - {i['level']}] {i['text']}" for i in photo_instructions])
        style_block = '\n'.join([f"- [{i['slider']} - {i['level']}] {i['text']}" for i in style_instructions])
        light_block = '\n'.join([f"- [{i['slider']} - {i['level']}] {i['text']}" for i in light_instructions])
        
        # BIOMETRIC LOCK si hay persona
        identity_lock = ""
        if has_person:
            identity_lock = """
=== 🔒 BIOMETRIC LOCK ACTIVE ===
CRITICAL: This image contains a HUMAN FACE.

ABSOLUTE RULES:
- Facial bone structure is IMMUTABLE
- Facial proportions are FIXED  
- Expression is FROZEN
- Gaze direction is LOCKED
- Distinctive marks (moles, scars, freckles) are PRESERVED

When reframing or outpainting:
- NEVER move or distort facial structures
- Generate new content logically around the person
- Match existing lighting and perspective
"""
        
        compiled_prompt = f"""You are LuxScaler's advanced image enhancement engine (Gemini 3 Pro Image Preview).
Your mission: Transform imperfect photos into high-end productions.

SUBJECT SUMMARY:
{base_subject}

TECHNICAL DIAGNOSTICS:
{diagnostics_summary}
{identity_lock}

=== RECONSTRUCTION DIRECTIVES ===

PHOTOSCALER OPERATIONS (Optical & Sensor):
{photo_block if photo_block else '[No photoscaler adjustments]'}

STYLESCALER OPERATIONS (Styling & Artistic):
{style_block if style_block else '[No stylescaler adjustments]'}

LIGHTSCALER OPERATIONS (Lighting & Tone):
{light_block if light_block else '[No lightscaler adjustments]'}

=== CRITICAL CONSTRAINTS ===
- Preserve subject identity and composition
- Follow slider directives precisely
- Do NOT invent elements not requested
- Maintain structural integrity (especially faces)

OUTPUT SPECS:
- Resolution: 4K (4800x4200px)
- Format: JPEG quality 95
- Color: 24-bit sRGB"""
        
        return {
            'success': True,
            'compiled_prompt': compiled_prompt,
            'instructions_count': len(instructions),
            'metadata': {
                'photoscaler_count': len(photo_instructions),
                'stylescaler_count': len(style_instructions),
                'lightscaler_count': len(light_instructions),
                'has_biometric_lock': has_person,
                'version': self.version
            }
        }


# Singleton
prompt_compiler_v41 = PromptCompilerV41()
