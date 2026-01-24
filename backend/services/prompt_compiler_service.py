# LuxScaler v28.0 - PROMPT COMPILER SERVICE (Rewrite Completo)
# FASE 4: EL CEREBRO - Orquesta Veto Engine, Block Injector, Sanitizer
# FASE 5: EL ALMA - Identity Lock + Multimodal DNA Anchor
# Según documento maestro del usuario

from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Importar servicios
from services.conflict_veto_engine import conflict_veto_engine
from services.block_injector import block_injector, CompilerBlockOutput
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
        Construye el System Prompt dinámico con BIOMETRIC LOCK PROTOCOL.
        
        Incluye:
        - UNIVERSAL BIOMETRIC LOCK (siempre activo)
        - Camera vs Subject separation
        - Bloques de los 3 pilares
        - Negative prompt estricto
        - Quality gates
        """
        # Formatear análisis de visión
        vision_summary = ""
        if input_data.vision_analysis:
            va = input_data.vision_analysis
            vision_summary = f"""Category: {va.get('category', 'UNKNOWN')}
Technical Score: Noise={va.get('technical_diagnosis', {}).get('noise_level', 'N/A')}, Blur={va.get('technical_diagnosis', {}).get('blur_level', 'N/A')}
Target Vision: {va.get('production_analysis', {}).get('target_vision', 'Professional enhancement')}"""
        
        # Determinar si hay cambios geométricos permitidos
        geometric_correction_allowed = (
            modified_sliders.get('geometria', 0) > 0 or
            modified_sliders.get('reencuadre_ia', 0) > 0
        )
        
        # Construir bloques con fallback
        photoscaler_block = blocks.PHOTOSCALER_BLOCK or '[Standard optical processing]'
        stylescaler_block = blocks.STYLESCALER_BLOCK or '[Standard styling]'
        lightscaler_block = blocks.LIGHTSCALER_BLOCK or '[Natural lighting preservation]'
        
        system_prompt = f"""[SYSTEM OVERRIDE: UNIVERSAL STRUCTURE & BIOMETRIC LOCK PROTOCOL v{self.version}]
[ROLE: FORENSIC RESTAURATEUR - NOT A CREATIVE ARTIST]

=== 🔒 CORE DIRECTIVE: THE "CAMERA VS. SUBJECT" SEPARATION ===
You must distinguish between the SUBJECT (Immutable Truth) and the CAPTURE (Correctable Error).

INPUT CONTEXT:
{vision_summary}

=== PHASE 0: SUBJECT CONSTANTS (READ-ONLY - DO NOT TOUCH) ===

1. BIOMETRIC IDENTITY (SACRED):
   - Bone structure, eye distance, nose shape, and jawline are IMMUTABLE
   - Expression micro-geometry: exact tension of lips, squint of eyes, muscle state of face must be preserved 100%
   - Distinctive marks: Moles, scars, tattoos, dental irregularities are VALID DATA. Do not "clean" them unless explicitly told
   - Pose & Gaze: Direction of eyes and tilt of head must remain EXACTLY as input

2. IDENTITY LOCK:
{identity_block}

=== PHASE 1: CAPTURE VARIABLES (WRITE-ACCESS - YOU MAY CORRECT) ===

Lens Distortion Correction: {"ENABLED" if geometric_correction_allowed else "DISABLED"}
{"- If input has 'Selfie Arm' or 'Fish-Eye' distortion (big nose, receding ears), project face onto flat 50mm-85mm focal plane" if geometric_correction_allowed else "- Preserve original lens perspective"}
{"- This changes PIXELS to restore TRUE face shape, NOT the identity" if geometric_correction_allowed else ""}

Framing & Composition:
- If a limb (arm, shoulder, top of head) is cut off by frame edge, you have permission to OUTPAINT/HALLUCINATE the missing anatomy to complete the figure naturally
- You may straighten vertical lines (walls) and horizon lines without tilting the subject unnaturally

[LOGIC GATE FOR RE-IMAGINATION]
- IF limb is cut off → GENERATE the rest of the limb logically
{"- IF nose is distorted by wide lens → COMPRESS geometry to restore natural proportions (50mm)" if geometric_correction_allowed else ""}
- IF face is blurry → RE-SYNTHESIZE texture ON TOP of existing topography. DO NOT invent a new face

=== PHASE 2: OPTICAL & SENSOR CORRECTIONS ===
{photoscaler_block}

=== PHASE 3: STYLING & GROOMING (PRESERVING IDENTITY) ===
{stylescaler_block}

=== PHASE 4: LIGHTING & TONE ===
{lightscaler_block}

=== ⛔ NEGATIVE CONSTRAINT (STRICTLY FORBIDDEN) ===
changing face, face swap, changing expression, changing ethnicity, plastic surgery effect, changing age, shifting gaze, makeup alteration (unless requested), removing glasses, morphing bone structure, different pose, AI hallucinations, shifting eyes, changing facial features.

=== QUALITY GATES ===
- Output resolution: 19.5MP (4800x4200px equivalent) → 4K
- Color depth: 24-bit sRGB
- Format: JPEG, quality 95
- Compression: Minimal (preserve fine details)
- Identity preservation: MAXIMUM"""
        
        return system_prompt
    
    async def compile_prompt_with_caching(
        self,
        input_data: CompilerInput
    ) -> CompilerOutput:
        """
        Compilador completo con todas las fases.
        
        Flujo:
        1. Aplica vetos (conflictos lógicos)
        2. Traduce sliders a instrucciones
        3. Inyecta bloques semánticos
        4. Construye system prompt con Identity Lock
        5. Genera DNA Anchor si hay imagen
        6. Sanitiza y optimiza
        7. Maneja Context Cache
        
        Args:
            input_data: CompilerInput con toda la configuración
        
        Returns:
            CompilerOutput con prompt compilado y metadata
        """
        # ============================================
        # PASO 1: Aplica reglas de veto
        # ============================================
        veto_result = await conflict_veto_engine.apply_veto_rules(input_data.slider_values)
        modified_sliders = veto_result['modified_sliders']
        vetos_applied = veto_result['vetos_applied']
        
        print(f"PromptCompiler: Applied {len(vetos_applied)} vetos")
        
        # ============================================
        # PASO 2: Traduce sliders a instrucciones
        # ============================================
        translations = await block_injector.translate_sliders_to_instructions(modified_sliders)
        active_info = await block_injector.get_active_instructions(modified_sliders)
        
        print(f"PromptCompiler: {active_info['total_active']} active sliders")
        
        # ============================================
        # PASO 3: Inyecta bloques semánticos
        # ============================================
        blocks = await block_injector.inject_semantic_blocks(modified_sliders, translations)
        
        # ============================================
        # PASO 4: Genera Identity Lock
        # ============================================
        has_face = True  # Default
        facial_marks = []
        
        if input_data.vision_analysis:
            tech = input_data.vision_analysis.get('technical_diagnosis', {})
            has_face = tech.get('has_person', True)
            facial_marks = tech.get('facial_marks', [])
        
        identity_block = identity_lock_service.generate_from_sliders(
            modified_sliders,
            has_face=has_face,
            facial_marks=facial_marks
        )
        
        # ============================================
        # PASO 5: Genera DNA Anchor (si hay imagen)
        # ============================================
        dna_anchor = None
        if input_data.image_input and has_face:
            dna_anchor = await dna_anchor_generator.generate_dna_anchor(
                input_data.image_input,
                job_id=input_data.user_id
            )
            
            if dna_anchor.face_detected:
                print(f"PromptCompiler: DNA Anchor generated with strength={dna_anchor.anchor_strength}")
                
                # Añadir referencia al identity block
                identity_block += f"""

[DNA ANCHOR ACTIVE - Strength: {dna_anchor.anchor_strength.upper()}]
A biometric face crop is provided as secondary reference.
Use it as ABSOLUTE GROUND TRUTH for facial structure."""
        
        # ============================================
        # PASO 6: Construye System Prompt
        # ============================================
        system_prompt = self._build_dynamic_system_prompt(
            input_data,
            blocks,
            modified_sliders,
            identity_block
        )
        
        # ============================================
        # PASO 7: Sanitiza el prompt
        # ============================================
        blocks_dict = {
            'PHOTOSCALER_BLOCK': blocks.PHOTOSCALER_BLOCK,
            'STYLESCALER_BLOCK': blocks.STYLESCALER_BLOCK,
            'LIGHTSCALER_BLOCK': blocks.LIGHTSCALER_BLOCK
        }
        
        sanitization_result = await semantic_sanitizer.sanitize_semantic_prompt(
            system_prompt,
            blocks_dict,
            input_data.vision_analysis
        )
        
        final_prompt = sanitization_result.prompt
        
        # Validar prompt
        validation = semantic_sanitizer.validate_prompt(final_prompt)
        
        # ============================================
        # PASO 8: Context Caching (si está disponible)
        # ============================================
        tokens_from_cache = 0
        cache_used = False
        
        if input_data.user_id and context_cache_manager.vertex_available:
            # Verificar si hay cache válido
            if context_cache_manager.is_cache_valid(input_data.user_id):
                tokens_from_cache = context_cache_manager.get_tokens_saved_estimate(input_data.user_id)
                cache_used = True
            else:
                # Inicializar nuevo cache
                await context_cache_manager.initialize_context_cache(
                    input_data.user_id,
                    system_prompt
                )
        
        # ============================================
        # Construir output final
        # ============================================
        
        # Preparar partes multimodales si hay DNA Anchor
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
                'active_sliders': active_info,
                'sanitization': {
                    'redundancies_removed': sanitization_result.redundancies_removed,
                    'empty_sections_removed': sanitization_result.empty_sections_removed,
                    'lines_before': sanitization_result.lines_before,
                    'lines_after': sanitization_result.lines_after
                },
                'validation': validation,
                'cache_used': cache_used,
                'identity_lock_level': identity_lock_service.get_constraint_level(modified_sliders),
                'version': self.version
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
