# LuxScaler v41.0 - SQL Prompt Builder Service
# Consulta tablas de Supabase para ensamblar prompts dinámicamente

from typing import Dict, List, Optional, Any
from services.supabase_service import supabase_db


class SQLPromptBuilderService:
    """
    Servicio que construye prompts desde las 3 tablas de Supabase:
    - photoscaler_prompt_rules
    - lightscaler_prompt_rules  
    - stylescaler_prompt_rules
    
    En vez de hardcodear prompts en el código, los lee de la base de datos.
    """
    
    def __init__(self):
        self.version = "41.0"
    
    async def get_photoscaler_rules(self, slider_name: str, slider_value: int) -> Optional[Dict]:
        """
        Obtiene las reglas de photoscaler para un slider y valor específico.
        
        Args:
            slider_name: Nombre del slider (ej: 'limpieza_artefactos')
            slider_value: Valor del slider (0-10)
        
        Returns:
            Dict con las reglas o None
        """
        try:
            response = supabase_db.client.table("photoscaler_prompt_rules")\
                .select("*")\
                .eq("slider_name", slider_name)\
                .lte("slider_value_min", slider_value)\
                .gte("slider_value_max", slider_value)\
                .eq("on_off", True)\
                .order("priority_weight", desc=True)\
                .limit(1)\
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"[SQLPromptBuilder] Error fetching photoscaler rules: {e}")
            return None
    
    async def get_lightscaler_rules(
        self, 
        slider_name: str, 
        slider_value: Optional[int] = None,
        style_slug: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Obtiene las reglas de lightscaler.
        Soporta tanto sliders numéricos como presets de estilo.
        """
        try:
            query = supabase_db.client.table("lightscaler_prompt_rules")\
                .select("*")\
                .eq("slider_name", slider_name)\
                .eq("on_off", True)
            
            # Si es un style slug (preset)
            if style_slug:
                query = query.eq("style_slug", style_slug)
            # Si es un slider numérico
            elif slider_value is not None:
                query = query.lte("slider_value_min", slider_value)\
                             .gte("slider_value_max", slider_value)
            
            response = query.order("priority_weight", desc=True).limit(1).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"[SQLPromptBuilder] Error fetching lightscaler rules: {e}")
            return None
    
    async def get_stylescaler_rules(self, slider_name: str, slider_value: int) -> Optional[Dict]:
        """Obtiene las reglas de stylescaler para un slider y valor específico."""
        try:
            response = supabase_db.client.table("stylescaler_prompt_rules")\
                .select("*")\
                .eq("slider_name", slider_name)\
                .lte("slider_value_min", slider_value)\
                .gte("slider_value_max", slider_value)\
                .eq("on_off", True)\
                .order("priority_weight", desc=True)\
                .limit(1)\
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"[SQLPromptBuilder] Error fetching stylescaler rules: {e}")
            return None
    
    def _assemble_photoscaler_block(self, rule: Dict) -> str:
        """
        Ensambla el bloque de photoscaler desde las columnas de la regla.
        Orden específico para maximizar adherencia del modelo.
        """
        parts = []
        
        # Orden de concatenación según documento
        if rule.get('protocol_header'):
            parts.append(rule['protocol_header'])
        
        if rule.get('mission_statement'):
            parts.append(rule['mission_statement'])
        
        if rule.get('quality_assessment_logic'):
            parts.append(rule['quality_assessment_logic'])
        
        if rule.get('damage_restoration_protocol'):
            parts.append(rule['damage_restoration_protocol'])
        
        if rule.get('virtual_camera_specs'):
            parts.append(rule['virtual_camera_specs'])
        
        if rule.get('geometric_projection_logic'):
            parts.append(rule['geometric_projection_logic'])
        
        if rule.get('lens_physics_correction'):
            parts.append(rule['lens_physics_correction'])
        
        if rule.get('detail_synthesis_logic'):
            parts.append(rule['detail_synthesis_logic'])
        
        if rule.get('signal_processing_pipeline'):
            parts.append(rule['signal_processing_pipeline'])
        
        return '\n\n'.join(parts)
    
    def _assemble_lightscaler_block(self, rule: Dict) -> str:
        """Ensambla el bloque de lightscaler."""
        parts = []
        
        if rule.get('protocol_header'):
            parts.append(rule['protocol_header'])
        
        if rule.get('zone_system_logic'):
            parts.append(rule['zone_system_logic'])
        
        if rule.get('dynamic_range_strategy'):
            parts.append(rule['dynamic_range_strategy'])
        
        if rule.get('color_science_grading'):
            parts.append(rule['color_science_grading'])
        
        if rule.get('light_source_physics'):
            parts.append(rule['light_source_physics'])
        
        if rule.get('volumetric_atmosphere'):
            parts.append(rule['volumetric_atmosphere'])
        
        if rule.get('white_balance_logic'):
            parts.append(rule['white_balance_logic'])
        
        return '\n\n'.join(parts)
    
    def _assemble_stylescaler_block(self, rule: Dict) -> str:
        """Ensambla el bloque de stylescaler."""
        parts = []
        
        if rule.get('art_direction_header'):
            parts.append(rule['art_direction_header'])
        
        if rule.get('texture_quality_prompt'):
            parts.append(rule['texture_quality_prompt'])
        
        if rule.get('anamorphic_optics_prompt'):
            parts.append(rule['anamorphic_optics_prompt'])
        
        if rule.get('environment_prompt'):
            parts.append(rule['environment_prompt'])
        
        if rule.get('styling_prompt'):
            parts.append(rule['styling_prompt'])
        
        if rule.get('style_negative_constraints'):
            parts.append(rule['style_negative_constraints'])
        
        return '\n\n'.join(parts)
    
    async def build_prompt_from_sliders(
        self, 
        slider_config: Dict[str, Dict[str, int]],
        has_person: bool = False,
        lighting_style: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Construye el prompt completo consultando las tablas de Supabase.
        
        Args:
            slider_config: {
                'photoscaler': {'limpieza_artefactos': 8, 'geometria': 5, ...},
                'stylescaler': {'styling_piel': 7, ...},
                'lightscaler': {'key_light': 9, ...}
            }
            has_person: Si la imagen tiene rostro humano
            lighting_style: Preset de iluminación opcional ('rembrandt_v32', etc.)
        
        Returns:
            {
                'photoscaler_block': str,
                'stylescaler_block': str,
                'lightscaler_block': str,
                'guidance_scale': float,
                'hallucination_density': float,
                'metadata': {...}
            }
        """
        photoscaler_blocks = []
        lightscaler_blocks = []
        stylescaler_blocks = []
        
        max_guidance = 7.5
        max_hallucination = 0.0
        
        # ========================================
        # PHOTOSCALER
        # ========================================
        photoscaler_sliders = slider_config.get('photoscaler', {})
        for slider_name, value in photoscaler_sliders.items():
            if value > 0:
                rule = await self.get_photoscaler_rules(slider_name, value)
                if rule:
                    block = self._assemble_photoscaler_block(rule)
                    if block:
                        photoscaler_blocks.append(f"[{slider_name.upper()} = {value}]\n{block}")
        
        # ========================================
        # LIGHTSCALER
        # ========================================
        lightscaler_sliders = slider_config.get('lightscaler', {})
        
        # Primero, procesar lighting_style si existe
        if lighting_style:
            rule = await self.get_lightscaler_rules('lighting_style', style_slug=lighting_style)
            if rule:
                block = self._assemble_lightscaler_block(rule)
                if block:
                    lightscaler_blocks.append(f"[LIGHTING_STYLE: {lighting_style}]\n{block}")
        
        # Luego, procesar sliders numéricos
        for slider_name, value in lightscaler_sliders.items():
            if value > 0:
                rule = await self.get_lightscaler_rules(slider_name, slider_value=value)
                if rule:
                    block = self._assemble_lightscaler_block(rule)
                    if block:
                        lightscaler_blocks.append(f"[{slider_name.upper()} = {value}]\n{block}")
        
        # ========================================
        # STYLESCALER
        # ========================================
        stylescaler_sliders = slider_config.get('stylescaler', {})
        for slider_name, value in stylescaler_sliders.items():
            if value > 0:
                rule = await self.get_stylescaler_rules(slider_name, value)
                if rule:
                    block = self._assemble_stylescaler_block(rule)
                    if block:
                        stylescaler_blocks.append(f"[{slider_name.upper()} = {value}]\n{block}")
                    
                    # Actualizar guidance y hallucination según la regla
                    if rule.get('guidance_scale'):
                        max_guidance = max(max_guidance, rule['guidance_scale'])
                    if rule.get('hallucination_density'):
                        max_hallucination = max(max_hallucination, rule['hallucination_density'])
        
        return {
            'photoscaler_block': '\n\n---\n\n'.join(photoscaler_blocks) if photoscaler_blocks else '[No photoscaler operations]',
            'lightscaler_block': '\n\n---\n\n'.join(lightscaler_blocks) if lightscaler_blocks else '[No lightscaler operations]',
            'stylescaler_block': '\n\n---\n\n'.join(stylescaler_blocks) if stylescaler_blocks else '[No stylescaler operations]',
            'guidance_scale': max_guidance,
            'hallucination_density': max_hallucination,
            'metadata': {
                'photoscaler_rules_count': len(photoscaler_blocks),
                'lightscaler_rules_count': len(lightscaler_blocks),
                'stylescaler_rules_count': len(stylescaler_blocks),
                'has_person': has_person,
                'lighting_style': lighting_style,
                'version': self.version
            }
        }


# Singleton
sql_prompt_builder = SQLPromptBuilderService()
