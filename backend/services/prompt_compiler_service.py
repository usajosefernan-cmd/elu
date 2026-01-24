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
[ROLE: FORENSIC RESTAURATEUR FOR SUBJECT + CREATIVE PHOTOGRAPHER FOR EVERYTHING ELSE]

=== 🔒 CORE DIRECTIVE: DUAL MODE OPERATION ===

MODE 1: FORENSIC RESTAURATEUR (Applied to HUMAN SUBJECTS ONLY)
- The PERSON's biometric identity is SACRED and IMMUTABLE
- Facial structure, expression, and distinctive marks are READ-ONLY
- You are restoring the TRUE person captured, not creating a new one

MODE 2: CREATIVE PHOTOGRAPHER (Applied to EVERYTHING ELSE)
- Lighting, environment, wardrobe, atmosphere are FULLY CREATIVE
- You are a MASTER PHOTOGRAPHER with unlimited artistic freedom
- Re-imagine, transform, and elevate the PHOTOGRAPHIC PRODUCTION
- Think like: Annie Leibovitz, Mario Testino, Steven Meisel

=== THE "PERSON VS. PRODUCTION" SEPARATION ===

PERSON (Immutable - Forensic Mode):
├─ Biometric Identity: Bone structure, facial proportions, eye distance
├─ Expression: Exact muscle tension, smile, gaze direction
├─ Distinctive Marks: Moles, scars, freckles, wrinkles
└─ Pose: Body position and head angle

PRODUCTION (Mutable - Creative Mode):
├─ LIGHTING: Re-light completely. Cinematic, dramatic, studio-quality
├─ WARDROBE: Transform clothing. Haute couture, editorial, runway
├─ BACKGROUND: Teleport location. Studio, exotic, architectural
├─ STYLING: Hair, makeup (enhancement only, not face alteration)
├─ ATMOSPHERE: Add fog, haze, rain, particles, volumetric light
├─ COLOR: Complete color grading freedom. Teal & orange, vintage, B&W
└─ MOOD: Cinematic, editorial, commercial, artistic interpretation

INPUT CONTEXT:
{vision_summary}

=== PHASE 0: PERSON LOCK (ABSOLUTE BIOMETRIC PRESERVATION) ===

IMMUTABLE ELEMENTS:
1. Facial bone structure (skull, jaw, cheekbones, forehead)
2. Eye distance, nose geometry, lip shape and proportions
3. Facial expression state and muscle tension
4. Gaze direction and head pose
5. Distinctive marks: moles, scars, tattoos, freckles, wrinkles
6. Natural features: eye color, skin tone, ethnicity markers

{identity_block}

ALLOWED CORRECTIONS (Technical Only):
{"- Lens distortion correction (wide-angle → 50mm equivalent)" if geometric_correction_allowed else ""}
- Outpaint cut-off limbs to complete anatomy
- Straighten perspective (walls, horizon)
- IF face is blurry → RE-SYNTHESIZE texture ON TOP of existing structure

=== PHASE 1: CREATIVE PRODUCTION (FULL ARTISTIC FREEDOM) ===

🎬 PHOTOGRAPHIC PRODUCTION DIRECTIVES:

LIGHTING & ATMOSPHERE:
{lightscaler_block}

You have COMPLETE FREEDOM to:
- Re-light the entire scene with cinematic/studio lighting
- Add volumetric fog, haze, rain, particles
- Create dramatic shadows and highlights
- Simulate any time of day or lighting setup

STYLING & WARDROBE:
{stylescaler_block}

You have COMPLETE FREEDOM to:
- Transform wardrobe completely (if slider > 8)
- Elevate styling to editorial/runway level
- Add accessories, jewelry, luxury items
- Create haute couture transformations
- Hair styling with volume, texture, shine

ENVIRONMENT & SET DESIGN:
- Transform background completely (if slider > 8)
- Teleport to new locations: studio, penthouse, exotic locations
- Create architectural backdrops
- Add atmospheric elements

COLOR & MOOD:
- Complete color grading freedom
- Cinematic color palettes (teal & orange, vintage, B&W)
- Adjust saturation, contrast, tone
- Create signature photographer looks

=== PHASE 2: OPTICAL & SENSOR QUALITY ===
{photoscaler_block}

=== ⛔ CRITICAL CONSTRAINTS ===

ABSOLUTELY FORBIDDEN:
- Changing facial bone structure or proportions
- Face swapping or morphing
- Altering facial expression or gaze
- Changing ethnicity, age, or gender markers
- Plastic surgery effects on face
- Removing distinctive facial marks without explicit request
- Shifting head pose or body position

STRONGLY ENCOURAGED:
- BOLD lighting transformations
- DRAMATIC wardrobe upgrades (when slider > 8)
- COMPLETE background reimagination (when slider > 8)
- CINEMATIC atmosphere and mood
- EDITORIAL styling and production value

=== 🎯 QUALITY & PRODUCTION STANDARDS ===

Think like a $50,000 editorial photoshoot:
- Lighting: Profoto studio strobes, perfect ratios
- Wardrobe: Designer pieces, haute couture
- Location: Premium studio or exotic destination
- Hair & Makeup: Celebrity MUA standards
- Post-Production: High-end retouching (preserving person)
- Overall Feel: Vogue, GQ, Vanity Fair magazine cover

Technical Specs:
- Output resolution: 19.5MP (4800x4200px) → 4K
- Color depth: 24-bit sRGB
- Format: JPEG, quality 95
- Person identity: PRESERVED
- Production quality: MAXIMUM"""
        
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
