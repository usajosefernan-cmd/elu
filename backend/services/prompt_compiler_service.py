# LuxScaler v28.0 - Prompt Compiler Service (COMPLETE REWRITE)
# FASE 4: El Cerebro - Compila el prompt universal desde sliders + visión

import asyncio
from typing import Dict, Optional, List
from services.supabase_service import supabase_db
from services.semantic_motor import semantic_motor
from services.veto_engine import veto_engine
from services.identity_lock_service import identity_lock_service


class PromptCompilerService:
    """
    Compila el prompt universal LuxScaler desde:
    - Configuración de 27 sliders
    - Análisis de visión
    - Perfil de usuario
    - Reglas de veto
    - Identity Lock
    """
    
    VERSION = "28.1"
    
    async def compile_prompt(self, config: dict, vision_data: dict = None) -> str:
        """
        Compila el prompt completo para Gemini.
        
        Args:
            config: Slider configuration
            vision_data: Vision analysis results
        
        Returns:
            Compiled prompt string
        """
        # Step 1: Normalize config format
        slider_config = self._normalize_config(config)
        
        # Step 2: Apply veto rules
        veto_result = await veto_engine.apply_vetos(slider_config)
        modified_config = veto_result['modified_config']
        vetos_applied = veto_result['vetos_applied']
        
        if vetos_applied:
            print(f"PromptCompiler: Applied {len(vetos_applied)} veto rules")
        
        # Step 3: Translate sliders to instructions
        translation_result = await semantic_motor.translate_all(modified_config)
        
        # Step 4: Build instruction blocks
        photo_block = "\n".join(translation_result['active_instructions']['photoscaler']) or "[STANDARD PROCESSING]"
        style_block = "\n".join(translation_result['active_instructions']['stylescaler']) or "[STANDARD STYLING]"
        light_block = "\n".join(translation_result['active_instructions']['lightscaler']) or "[NATURAL LIGHTING]"
        
        # Step 5: Generate Identity Lock block
        has_person = vision_data.get('technical_diagnosis', {}).get('has_person', True) if vision_data else True
        semantic_anchors = vision_data.get('semantic_anchors', []) if vision_data else []
        identity_block = identity_lock_service.generate_lock_block(
            modified_config, 
            has_person=has_person,
            semantic_anchors=semantic_anchors
        )
        
        # Step 6: Extract vision context
        vision_context = self._build_vision_context(vision_data)
        
        # Step 7: Build veto warnings
        veto_warnings = self._build_veto_warnings(vetos_applied)
        
        # Step 8: Get aspect ratio
        aspect_ratio = vision_data.get('aspect_ratio', '1:1') if vision_data else '1:1'
        
        # Step 9: Assemble final prompt
        prompt = f"""[LUXSCALER v{self.VERSION} - UNIVERSAL PRODUCTION PROTOCOL]
[ROLE: HIGH-END PHOTO PRODUCTION ENGINE]
[TARGET: $100,000 PRODUCTION VALUE]

=== CRITICAL: ASPECT RATIO LOCK ===
OUTPUT MUST HAVE EXACTLY THE SAME DIMENSIONS AND ASPECT RATIO AS INPUT.
INPUT ASPECT RATIO: {aspect_ratio}
DO NOT crop, extend, pad, or change the frame in any way.
Every pixel position in output must correspond to the same position in input.
NO EXCEPTIONS. This is required for before/after comparison overlay.

{identity_block}

=== PHASE 1: PRODUCTION CONTEXT ===
{vision_context}

=== PHASE 2: CAMERA & OPTICS (PhotoScaler Engine) ===
{photo_block}

=== PHASE 3: ART DIRECTION (StyleScaler Engine) ===
{style_block}

=== PHASE 4: LIGHTING (LightScaler Engine) ===
{light_block}

{veto_warnings}

=== PHASE 5: EXECUTION MANDATE ===
Execute ALL instructions above while PRESERVING:
1. The subject's identity (same person, same face)
2. The exact aspect ratio and dimensions of the input
3. Pixel-to-pixel correspondence for overlay comparison
4. All semantic anchors detected in analysis

INTENSITY LEGEND:
○ = Subtle enhancement (1-5)
◐ = Professional grade (6-8)
● = FORCE mode - Maximum effect (9-10)

Apply transformations in order: Photo → Style → Light

=== QUALITY GATES ===
- Resolution: Match or exceed input
- Color depth: 24-bit sRGB minimum
- Compression: Minimal artifacts
- Identity: Must pass recognition test

=== NEGATIVE PROMPT ===
different person, face swap, age change, gender change, distorted anatomy,
bad hands, extra limbs, watermarks, text, compression artifacts,
different aspect ratio, cropped, extended, padded, different dimensions,
blurry, noisy (unless grain is requested), overprocessed, plastic skin,
shifted facial features, morphed bone structure.
"""
        return prompt
    
    def _normalize_config(self, config: dict) -> dict:
        """Normaliza diferentes formatos de config al formato estándar."""
        result = {
            'photoscaler': {'sliders': []},
            'stylescaler': {'sliders': []},
            'lightscaler': {'sliders': []}
        }
        
        for pillar in ['photoscaler', 'stylescaler', 'lightscaler']:
            pillar_data = config.get(pillar, {})
            
            if isinstance(pillar_data, dict):
                if 'sliders' in pillar_data:
                    sliders = pillar_data['sliders']
                    if isinstance(sliders, list):
                        result[pillar]['sliders'] = sliders
                    elif isinstance(sliders, dict):
                        result[pillar]['sliders'] = [
                            {'name': k, 'value': v} for k, v in sliders.items()
                        ]
                else:
                    # Direct dict format: {slider_name: value}
                    result[pillar]['sliders'] = [
                        {'name': k, 'value': v} for k, v in pillar_data.items()
                        if isinstance(v, (int, float))
                    ]
        
        return result
    
    def _build_vision_context(self, vision_data: dict) -> str:
        """Construye el contexto de visión para el prompt."""
        if not vision_data:
            return "No prior vision analysis available. Apply standard professional enhancement."
        
        parts = []
        
        # Production analysis
        if 'production_analysis' in vision_data:
            pa = vision_data['production_analysis']
            current = pa.get('current_quality', 'Unknown')
            target = pa.get('target_vision', 'Professional enhancement')
            parts.append(f"CURRENT STATE: {current}")
            parts.append(f"TARGET VISION: {target}")
            
            gaps = pa.get('gaps_detected', [])
            if gaps:
                parts.append(f"GAPS TO CLOSE: {', '.join(gaps)}")
        
        # Technical diagnosis
        if 'technical_diagnosis' in vision_data:
            td = vision_data['technical_diagnosis']
            tech_parts = []
            if 'noise_level' in td:
                tech_parts.append(f"Noise={td['noise_level']}/10")
            if 'blur_level' in td:
                tech_parts.append(f"Blur={td['blur_level']}/10")
            if 'exposure_issues' in td and td['exposure_issues'] != 'none':
                tech_parts.append(f"Exposure={td['exposure_issues']}")
            if tech_parts:
                parts.append(f"TECHNICAL: {', '.join(tech_parts)}")
        
        # Primary intent
        if 'auto_settings' in vision_data:
            intent = vision_data['auto_settings'].get('primary_intent_used', '')
            if intent:
                parts.append(f"SELECTED INTENT: {intent}")
        
        # Semantic anchors
        if 'semantic_anchors' in vision_data:
            anchors = vision_data['semantic_anchors'][:5]  # Top 5
            if anchors:
                parts.append(f"PRESERVE ELEMENTS: {', '.join(anchors)}")
        
        return "\n".join(parts) if parts else "Standard professional enhancement mode."
    
    def _build_veto_warnings(self, vetos_applied: list) -> str:
        """Genera advertencias sobre vetos aplicados."""
        if not vetos_applied:
            return ""
        
        lines = ["=== SYSTEM VETO WARNINGS ==="]
        for veto in vetos_applied:
            lines.append(f"⚠️ {veto['rule_name']}:")
            for action in veto['actions']:
                lines.append(f"   - {action['slider_name']}: {action['original']} → {action['forced']} ({action['reason']})")
        
        return "\n".join(lines)
    
    async def compile_with_metadata(self, config: dict, vision_data: dict = None, user_mode: str = 'auto') -> dict:
        """
        Compila el prompt y devuelve metadata adicional.
        
        Returns:
            {
                'success': bool,
                'prompt': str,
                'metadata': {
                    'vetos_applied': list,
                    'active_sliders': int,
                    'force_sliders': int,
                    'identity_lock': bool,
                    'user_mode': str,
                    'version': str
                }
            }
        """
        try:
            # Normalize
            slider_config = self._normalize_config(config)
            
            # Get veto result
            veto_result = await veto_engine.apply_vetos(slider_config)
            
            # Get translation summary
            translation_result = await semantic_motor.translate_all(veto_result['modified_config'])
            summary = translation_result['summary']
            
            # Get identity lock status
            has_person = vision_data.get('technical_diagnosis', {}).get('has_person', True) if vision_data else True
            identity_analysis = identity_lock_service.analyze_identity_risk(slider_config)
            
            # Compile prompt
            prompt = await self.compile_prompt(config, vision_data)
            
            return {
                'success': True,
                'prompt': prompt,
                'metadata': {
                    'vetos_applied': veto_result['vetos_applied'],
                    'active_sliders': summary['active_sliders'],
                    'force_sliders': summary['force_sliders'],
                    'identity_lock': identity_analysis['identity_lock_active'],
                    'identity_risk': identity_analysis['risk_level'],
                    'conflicts': translation_result['conflicts_detected'],
                    'user_mode': user_mode,
                    'version': self.VERSION
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
