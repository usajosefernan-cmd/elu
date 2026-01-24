# LuxScaler v41.0 - PROMPT COMPILER SERVICE
# Usa SQL Prompt Builder para consultar tablas de Supabase

from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Importar SQL Prompt Builder
from services.sql_prompt_builder import sql_prompt_builder
from services.conflict_veto_engine import conflict_veto_engine
from services.semantic_sanitizer import semantic_sanitizer
from services.identity_lock import identity_lock_service, IdentityLockContext
from services.dna_anchor_generator import dna_anchor_generator, DNAAnchor
from services.multimodal_prompt_injector import multimodal_prompt_injector
from services.context_cache_manager import context_cache_manager


@dataclass
class CompilerInput:
    """Input del compilador de prompts."""
    slider_values: Dict[str, int]
    vision_analysis: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    profile_type: str = "AUTO"  # AUTO | USER | PRO | PROLUX
    image_input: Optional[str] = None  # Para DNA Anchor


@dataclass
class CompilerOutput:
    """Output del compilador de prompts."""
    compiled_prompt: str
    system_prompt: str
    tokens_estimate: Dict[str, int]
    debug_info: Dict[str, Any]
    dna_anchor: Optional[DNAAnchor] = None
    multimodal_parts: Optional[List[Dict]] = None


class PromptCompilerService:
    """
    Compilador de Prompts v29.0 - "El Cerebro"
    
    Transforma los 27 valores numéricos de sliders en una instrucción
    coherente para Gemini 3 Pro, resolviendo conflictos y aplicando
    Context Caching.
    
    Algoritmo:
    1. PASO 1: Resolución de Jerarquías (Veto Engine)
    2. PASO 2: Inyección de Bloques (Block Injector)
    3. PASO 3: Sanitización Semántica (Sanitizer)
    4. PASO 4: Identity Lock Dinámico
    5. PASO 5: DNA Anchor Multimodal (opcional)
    6. PASO 6: Context Caching (opcional)
    """
    
    def __init__(self):
        self.version = "29.0"
    
    def _flatten_config(self, config: Dict) -> Dict[str, int]:
        """Convierte config estructurada a diccionario plano {slider_name: value}."""
        flat = {}
        
        # Formato 1: {pillar: {sliders: [{name, value}]}}
        for pillar_name in ['photoscaler', 'stylescaler', 'lightscaler']:
            pillar_data = config.get(pillar_name, {})
            sliders = pillar_data.get('sliders', [])
            
            if isinstance(sliders, list):
                for s in sliders:
                    name = s.get('name', '')
                    value = s.get('value', 0)
                    if name:
                        flat[name] = int(value)
            elif isinstance(sliders, dict):
                for k, v in sliders.items():
                    flat[k] = int(v)
        
        # Formato 2: {slider_name: value} directamente
        for key, value in config.items():
            if key not in ['photoscaler', 'stylescaler', 'lightscaler'] and isinstance(value, (int, float)):
                flat[key] = int(value)
        
        return flat
    
    def _build_dynamic_system_prompt(
        self,
        input_data: CompilerInput,
        blocks: CompilerBlockOutput,
        modified_sliders: Dict[str, int],
        identity_block: str
    ) -> str:
        """
        Construye el System Prompt dinámico controlado por SLIDERS.
        NO hardcodea comportamientos - los sliders controlan todo.
        """
        # Formatear análisis de visión
        vision_summary = ""
        has_person = False
        if input_data.vision_analysis:
            va = input_data.vision_analysis
            tech = va.get('technical_diagnosis', {})
            has_person = tech.get('has_person', False)
            
            vision_summary = f"""Category: {va.get('category', 'UNKNOWN')}
Technical Score: Noise={tech.get('noise_level', 'N/A')}, Blur={tech.get('blur_level', 'N/A')}
Has Person: {has_person}
Target Vision: {va.get('production_analysis', {}).get('target_vision', 'Professional enhancement')}"""
        
        # Construir bloques con fallback
        photoscaler_block = blocks.PHOTOSCALER_BLOCK or '[No photoscaler adjustments]'
        stylescaler_block = blocks.STYLESCALER_BLOCK or '[No stylescaler adjustments]'
        lightscaler_block = blocks.LIGHTSCALER_BLOCK or '[No lightscaler adjustments]'
        
        # Sistema base
        system_prompt = f"""[SYSTEM OVERRIDE: LUXSCALER UNIVERSAL IMAGE ENHANCEMENT PROTOCOL v{self.version}]
[ROLE: PROFESSIONAL IMAGE PROCESSOR - SLIDER-CONTROLLED OPERATIONS]

=== INPUT ANALYSIS ===
{vision_summary}

=== 🔒 CRITICAL RULE: STRUCTURAL PRESERVATION ===

IF the image contains a HUMAN FACE:
  → BIOMETRIC LOCK is ACTIVE
  → Facial bone structure, proportions, and expression are IMMUTABLE
  → Eye distance, nose shape, lip geometry, jaw line are READ-ONLY
  → Distinctive marks (moles, scars, freckles) are VALID DATA - preserve them
  → Facial expression and gaze direction MUST remain identical
  
{identity_block}

IF the image does NOT contain a face:
  → Process normally according to slider instructions
  → Preserve original subject matter unless explicitly instructed otherwise

=== OUTPAINT & REFRAME RULES ===

When filling missing areas or reframing:
1. NEVER distort or move existing structures (especially faces)
2. Generate new content that CONTINUES the existing scene logically
3. Match lighting, perspective, and style of original
4. If a face is partially visible, DO NOT complete it unless you can preserve exact proportions

=== SLIDER-CONTROLLED OPERATIONS ===

The following operations are controlled by sliders.
ONLY apply what the sliders indicate:

PHOTOSCALER OPERATIONS (Optical & Sensor):
{photoscaler_block}

STYLESCALER OPERATIONS (Subject & Styling):
{stylescaler_block}

LIGHTSCALER OPERATIONS (Lighting & Tone):
{lightscaler_block}

=== NEGATIVE CONSTRAINTS (ALWAYS FORBIDDEN) ===

When processing images with people:
- Changing facial bone structure or proportions
- Face swapping or morphing
- Altering facial expression or gaze direction
- Changing ethnicity, age, or gender markers
- Moving facial features during reframe/outpaint
- Plastic surgery effects
- Removing distinctive marks without explicit instruction

When processing any image:
- Adding elements not requested by sliders
- Changing subject matter without slider instruction
- Distorting structures during geometric corrections
- Inventing content beyond logical continuation

=== QUALITY STANDARDS ===
- Output resolution: 19.5MP (4800x4200px equivalent) → 4K
- Color depth: 24-bit sRGB
- Format: JPEG, quality 95
- Structural integrity: MAXIMUM
- Follow slider instructions: PRECISELY"""
        
        return system_prompt
    
    async def compile_prompt_with_caching(
        self,
        input_data: CompilerInput
    ) -> CompilerOutput:
        """
        Compilador v41.0 que usa SQL Prompt Builder para consultar Supabase.
        
        Flujo:
        1. Aplica vetos (conflictos lógicos)
        2. Consulta reglas desde Supabase (SQL Prompt Builder)
        3. Ensambla bloques desde DB
        4. Construye system prompt con Identity Lock
        5. Genera DNA Anchor si hay imagen
        6. Sanitiza y optimiza
        7. Maneja Context Cache
        """
        # ============================================
        # PASO 1: Aplica reglas de veto
        # ============================================
        veto_result = await conflict_veto_engine.apply_veto_rules(input_data.slider_values)
        modified_sliders = veto_result['modified_sliders']
        vetos_applied = veto_result['vetos_applied']
        
        print(f"PromptCompiler v41: Applied {len(vetos_applied)} vetos")
        
        # ============================================
        # PASO 2: Consultar Supabase para obtener bloques
        # ============================================
        # Detectar si hay persona en la imagen
        has_person = False
        if input_data.vision_analysis:
            tech = input_data.vision_analysis.get('technical_diagnosis', {})
            has_person = tech.get('has_person', False)
        
        # Preparar config para SQL Builder
        slider_config = {
            'photoscaler': {},
            'stylescaler': {},
            'lightscaler': {}
        }
        
        # Organizar sliders por pilar
        for slider_name, value in modified_sliders.items():
            # Determinar pilar según nombre del slider
            if any(s in slider_name for s in ['limpieza', 'geometria', 'optica', 'chronos', 'senal', 'sintesis', 'grano', 'apertura', 'resolucion', 'enfoque']):
                slider_config['photoscaler'][slider_name] = value
            elif any(s in slider_name for s in ['styling', 'maquillaje', 'limpieza_entorno', 'reencuadre', 'atmosfera', 'look_cine', 'materiales']):
                slider_config['stylescaler'][slider_name] = value
            elif any(s in slider_name for s in ['key_light', 'fill_light', 'rim_light', 'volumetria', 'temperatura', 'contraste', 'sombras', 'estilo_autor', 'reflejos']):
                slider_config['lightscaler'][slider_name] = value
        
        # Consultar Supabase y ensamblar bloques
        sql_blocks = await sql_prompt_builder.build_prompt_from_sliders(
            slider_config,
            has_person=has_person,
            lighting_style=None  # Puede ser 'rembrandt_v32', 'neon_noir_v32', etc.
        )
        
        print(f"PromptCompiler v41: Loaded {sql_blocks['metadata']['photoscaler_rules_count']} + {sql_blocks['metadata']['lightscaler_rules_count']} + {sql_blocks['metadata']['stylescaler_rules_count']} rules from Supabase")
        
        # ============================================
        # PASO 3: Genera Identity Lock
        # ============================================
        facial_marks = []
        
        if input_data.vision_analysis:
            tech = input_data.vision_analysis.get('technical_diagnosis', {})
            facial_marks = tech.get('facial_marks', [])
        
        geometric_changes_enabled = modified_sliders.get('geometria', 0) > 0 or modified_sliders.get('reencuadre_ia', 0) > 0
        
        identity_block = identity_lock_service.generate_from_sliders(
            modified_sliders,
            has_face=has_person,
            facial_marks=facial_marks
        )
        
        # ============================================
        # PASO 4: Genera DNA Anchor (si hay imagen)
        # ============================================
        dna_anchor = None
        if input_data.image_input and has_person:
            dna_anchor = await dna_anchor_generator.generate_dna_anchor(
                input_data.image_input,
                job_id=input_data.user_id
            )
            
            if dna_anchor and dna_anchor.face_detected:
                print(f"PromptCompiler v41: DNA Anchor generated with strength={dna_anchor.anchor_strength}")
        
        # ============================================
        # PASO 5: Construye System Prompt usando bloques de SQL
        # ============================================
        system_prompt = self._build_dynamic_system_prompt_v41(
            input_data,
            sql_blocks,
            modified_sliders,
            identity_block
        )
        
        # ============================================
        # PASO 6: Sanitiza el prompt
        # ============================================
        blocks_dict = {
            'PHOTOSCALER_BLOCK': sql_blocks['photoscaler_block'],
            'STYLESCALER_BLOCK': sql_blocks['stylescaler_block'],
            'LIGHTSCALER_BLOCK': sql_blocks['lightscaler_block']
        }
        
        sanitization_result = await semantic_sanitizer.sanitize_semantic_prompt(
            system_prompt,
            blocks_dict,
            input_data.vision_analysis
        )
        
        final_prompt = sanitization_result.prompt
        
        # ============================================
        # PASO 7: Context Caching (si está disponible)
        # ============================================
        tokens_from_cache = 0
        cache_used = False
        
        if input_data.user_id and context_cache_manager.vertex_available:
            if context_cache_manager.is_cache_valid(input_data.user_id):
                tokens_from_cache = context_cache_manager.get_tokens_saved_estimate(input_data.user_id)
                cache_used = True
            else:
                await context_cache_manager.initialize_context_cache(
                    input_data.user_id,
                    system_prompt
                )
        
        # ============================================
        # Construir output final
        # ============================================
        multimodal_parts = None
        if dna_anchor and dna_anchor.face_crop_base64 and input_data.image_input:
            mc = await multimodal_prompt_injector.build_multimodal_prompt_with_dna_anchor(
                final_prompt,
                input_data.image_input,
                dna_anchor.face_crop_base64
            )
            multimodal_parts = mc.to_gemini_format()
        
        # Calcular tokens
        text_tokens = len(final_prompt) // 4
        system_cached = tokens_from_cache if cache_used else 0
        
        return CompilerOutput(
            compiled_prompt=final_prompt,
            system_prompt=system_prompt,
            tokens_estimate={
                'system_cached': system_cached,
                'user_new': text_tokens - system_cached,
                'total_from_cache': system_cached,
                'total_estimated': text_tokens
            },
            debug_info={
                'vetos_applied': vetos_applied,
                'conflicts_detected': len(vetos_applied),
                'active_sliders': sql_blocks['metadata'],
                'guidance_scale': sql_blocks['guidance_scale'],
                'hallucination_density': sql_blocks['hallucination_density'],
                'sanitization': {
                    'redundancies_removed': sanitization_result.redundancies_removed,
                    'empty_sections_removed': sanitization_result.empty_sections_removed,
                    'lines_before': sanitization_result.lines_before,
                    'lines_after': sanitization_result.lines_after
                },
                'cache_used': cache_used,
                'identity_lock_level': 'ACTIVE' if has_person else 'DISABLED',
                'version': self.version,
                'sql_builder_version': '41.0'
            },
            dna_anchor=dna_anchor,
            multimodal_parts=multimodal_parts
        )
    
    async def compile_prompt(
        self,
        config: Dict,
        vision_analysis: Dict = None,
        profile_type: str = 'AUTO',
        image_input: str = None,
        user_id: str = None
    ) -> Dict:
        """
        Método simplificado para compilar prompt.
        
        Args:
            config: Configuración de sliders
            vision_analysis: Análisis de visión (opcional)
            profile_type: Tipo de perfil de usuario
            image_input: Imagen para DNA Anchor (opcional)
            user_id: ID del usuario (opcional)
        
        Returns:
            Dict con el resultado de la compilación
        """
        # Flatten config
        slider_values = self._flatten_config(config)
        
        # Crear input
        input_data = CompilerInput(
            slider_values=slider_values,
            vision_analysis=vision_analysis,
            user_id=user_id,
            profile_type=profile_type,
            image_input=image_input
        )
        
        # Compilar
        output = await self.compile_prompt_with_caching(input_data)
        
        # Formatear respuesta
        return {
            'success': True,
            'compiled_prompt': output.compiled_prompt,
            'system_prompt': output.system_prompt,
            'metadata': {
                'active_sliders': output.debug_info['active_sliders']['total_active'],
                'force_sliders': output.debug_info['active_sliders']['force_sliders'],
                'version': output.debug_info['version'],
                'cache_used': output.debug_info['cache_used'],
                'identity_lock_level': output.debug_info['identity_lock_level']
            },
            'debug_info': output.debug_info,
            'tokens_estimate': output.tokens_estimate,
            'dna_anchor': {
                'detected': output.dna_anchor.face_detected if output.dna_anchor else False,
                'strength': output.dna_anchor.anchor_strength if output.dna_anchor else 'none'
            } if output.dna_anchor else None
        }
    
    async def compile_with_metadata(
        self,
        config: Dict,
        vision_data: Dict = None
    ) -> Dict:
        """Wrapper para compatibilidad con código existente."""
        result = await self.compile_prompt(config, vision_data)
        return {
            'success': result['success'],
            'prompt': result['compiled_prompt'],
            'metadata': result['metadata']
        }


# Instancia singleton
prompt_compiler = PromptCompilerService()
