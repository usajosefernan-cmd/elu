# LuxScaler v28.0 - PROMPT COMPILER SERVICE
# Según documento maestro FASE 4: EL CEREBRO

from typing import Dict, List, Any, Optional
from services.supabase_service import supabase_db

# =====================================================
# PASO 1: RESOLUCIÓN DE JERARQUÍAS (VETO RULES)
# =====================================================

VETO_RULES = [
    {
        "name": "La Paradoja Forense",
        "trigger": lambda s: s.get('limpieza_artefactos', 0) == 10,
        "actions": [
            {"slider": "grano_filmico", "force": 0, "reason": "Limpieza FORCE mata lo vintage. Grano OFF."},
            {"slider": "optica", "force": 10, "reason": "Limpieza FORCE fuerza máxima nitidez."}
        ]
    },
    {
        "name": "La Tiranía del Drama",
        "trigger": lambda s: s.get('contraste', 0) == 10,
        "actions": [
            {"slider": "fill_light", "force": 0, "reason": "Drama FORCE no permite fill light. Contraste absoluto."}
        ]
    },
    {
        "name": "Paradoja de Geometría",
        "trigger": lambda s: s.get('geometria', 0) == 10 and s.get('reencuadre_ia', 0) == 10,
        "actions": [
            {"slider": "reencuadre_ia", "force": 0, "reason": "No puedes corregir distorsión Y reencuadrar. Priority: Distorsión."}
        ]
    },
    {
        "name": "Claridad vs Atmósfera",
        "trigger": lambda s: s.get('optica', 0) >= 9 and s.get('atmosfera', 0) >= 9,
        "actions": [
            {"slider": "atmosfera", "force": 5, "reason": "Nitidez extrema requiere atmósfera reducida."}
        ]
    },
    {
        "name": "Piel Sintética vs Grano",
        "trigger": lambda s: s.get('styling_piel', 0) == 10,
        "actions": [
            {"slider": "grano_filmico", "force": 0, "reason": "Piel sintética FORCE requiere limpieza total de grano."}
        ]
    }
]


def apply_veto_rules(sliders: Dict[str, int]) -> tuple:
    """Aplica reglas de veto y retorna sliders modificados + vetos aplicados."""
    modified = sliders.copy()
    vetos_applied = []
    
    for rule in VETO_RULES:
        try:
            if rule["trigger"](modified):
                for action in rule["actions"]:
                    original = modified.get(action["slider"], 0)
                    modified[action["slider"]] = action["force"]
                    vetos_applied.append({
                        "rule": rule["name"],
                        "slider": action["slider"],
                        "original": original,
                        "forced": action["force"],
                        "reason": action["reason"]
                    })
        except:
            continue
    
    return modified, vetos_applied


# =====================================================
# PASO 2: INYECCIÓN DE BLOQUES (SEMANTIC TRANSLATION)
# =====================================================

class SemanticBlockInjector:
    def __init__(self):
        self._mappings = {}
        self._loaded = False
    
    async def _load_mappings(self):
        if self._loaded:
            return
        
        try:
            response = supabase_db.client.table("slider_semantic_mappings").select("*").execute()
            
            for item in response.data or []:
                pillar = item.get('pillar_name', '').upper()
                slider = item.get('slider_name', '')
                
                self._mappings[slider] = {
                    'pillar': pillar,
                    'display_name': item.get('display_name', slider),
                    'levels': {
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
                        10: item.get('instruction_force', '')
                    }
                }
            
            self._loaded = True
            print(f"SemanticBlockInjector: Loaded {len(self._mappings)} slider mappings")
        except Exception as e:
            print(f"SemanticBlockInjector Error: {e}")
    
    async def inject_blocks(self, sliders: Dict[str, int]) -> Dict[str, str]:
        """Traduce sliders a bloques de texto por pilar."""
        await self._load_mappings()
        
        blocks = {
            'PHOTOSCALER_BLOCK': [],
            'STYLESCALER_BLOCK': [],
            'LIGHTSCALER_BLOCK': []
        }
        
        for slider_name, value in sliders.items():
            if value <= 0:
                continue
            
            mapping = self._mappings.get(slider_name)
            if not mapping:
                continue
            
            instruction = mapping['levels'].get(value, '')
            if not instruction:
                continue
            
            pillar = mapping['pillar']
            block_key = f"{pillar}_BLOCK"
            
            if block_key in blocks:
                blocks[block_key].append(f"- {instruction}")
        
        return {
            'PHOTOSCALER_BLOCK': '\n'.join(blocks['PHOTOSCALER_BLOCK']) if blocks['PHOTOSCALER_BLOCK'] else '',
            'STYLESCALER_BLOCK': '\n'.join(blocks['STYLESCALER_BLOCK']) if blocks['STYLESCALER_BLOCK'] else '',
            'LIGHTSCALER_BLOCK': '\n'.join(blocks['LIGHTSCALER_BLOCK']) if blocks['LIGHTSCALER_BLOCK'] else ''
        }


# =====================================================
# PASO 3: SANITIZADOR SEMÁNTICO
# =====================================================

def sanitize_prompt(prompt: str) -> tuple:
    """Elimina redundancias y secciones vacías."""
    lines = prompt.split('\n')
    seen = set()
    unique_lines = []
    redundancies = 0
    
    for line in lines:
        normalized = line.strip()
        if not normalized:
            unique_lines.append(line)
        elif normalized not in seen:
            seen.add(normalized)
            unique_lines.append(line)
        else:
            redundancies += 1
    
    # Elimina secciones vacías
    result = '\n'.join(unique_lines)
    empty_patterns = [
        'GEOMETRY & RESTORATION:\n\n',
        'LIGHTING & TONE:\n\n',
    ]
    
    empty_removed = []
    for pattern in empty_patterns:
        if pattern in result:
            result = result.replace(pattern, '')
            empty_removed.append(pattern)
    
    return result, redundancies, empty_removed


# =====================================================
# IDENTITY LOCK DINÁMICO
# =====================================================

def generate_identity_lock_block(
    has_face: bool,
    geometric_changes_enabled: bool,
    facial_marks: List[str] = None
) -> str:
    """Genera el bloque de Identity Lock según contexto."""
    
    if not has_face:
        return "Standard processing. No identity constraints."
    
    if geometric_changes_enabled:
        base = """ALLOW structural changes for geometry correction (lens distortion, perspective).
HOWEVER: Facial identity must be preserved. Bone structure, proportions, character marks are sacred.
Changes allowed: Lens distortion correction, perspective fixing.
Changes FORBIDDEN: Changing face shape, proportions, identity markers."""
    else:
        base = """CRITICAL: IDENTITY LOCK ACTIVE - MAXIMUM CONSTRAINT.
DO NOT MOVE PIXELS related to face/body structure.
Structure must match overlay 100%.
Allowed changes: Color correction, tone mapping, lighting simulation.
Forbidden changes: Any structural pixel movement, facial morphing, identity alteration."""
    
    if facial_marks:
        base += f"\nFacial marks to preserve identically: {', '.join(facial_marks)}"
    
    return base


# =====================================================
# EL COMPILADOR COMPLETO
# =====================================================

class PromptCompilerService:
    """
    Compilador de prompts según documento maestro FASE 4.
    
    Flujo:
    1. Aplica vetos (conflictos lógicos)
    2. Traduce sliders a bloques semánticos
    3. Construye system prompt con Identity Lock
    4. Sanitiza y optimiza
    """
    
    def __init__(self):
        self.block_injector = SemanticBlockInjector()
    
    def _flatten_config(self, config: dict) -> Dict[str, int]:
        """Convierte config estructurada a diccionario plano."""
        flat = {}
        
        for pillar in ['photoscaler', 'stylescaler', 'lightscaler']:
            pillar_data = config.get(pillar, {})
            sliders = pillar_data.get('sliders', [])
            
            if isinstance(sliders, list):
                for s in sliders:
                    flat[s.get('name', '')] = int(s.get('value', 0))
            elif isinstance(sliders, dict):
                for k, v in sliders.items():
                    flat[k] = int(v)
        
        return flat
    
    async def compile_prompt(
        self,
        config: dict,
        vision_analysis: dict = None,
        profile_type: str = 'AUTO'
    ) -> dict:
        """
        Compila el prompt completo.
        
        Returns:
            {
                'compiled_prompt': str,
                'system_prompt': str,
                'debug_info': {...}
            }
        """
        # Step 1: Flatten config
        sliders = self._flatten_config(config)
        
        # Step 2: Aplica vetos
        modified_sliders, vetos_applied = apply_veto_rules(sliders)
        
        # Step 3: Inyecta bloques semánticos
        blocks = await self.block_injector.inject_blocks(modified_sliders)
        
        # Step 4: Determina Identity Lock
        has_face = True  # Default
        geometric_changes = modified_sliders.get('geometria', 0) > 0 or modified_sliders.get('reencuadre_ia', 0) > 0
        
        if vision_analysis:
            tech = vision_analysis.get('technical_diagnosis', {})
            has_face = tech.get('has_person', True)
        
        identity_block = generate_identity_lock_block(has_face, geometric_changes)
        
        # Step 5: Construye System Prompt según documento maestro
        vision_summary = ""
        if vision_analysis:
            vision_summary = f"""Category: {vision_analysis.get('category', 'UNKNOWN')}
Technical: Noise={vision_analysis.get('technical_diagnosis', {}).get('noise_level', 'N/A')}, Blur={vision_analysis.get('technical_diagnosis', {}).get('blur_level', 'N/A')}
Target: {vision_analysis.get('production_analysis', {}).get('target_vision', 'Professional enhancement')}"""
        
        system_prompt = f"""[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v28.0]
[ROLE: REALITY RECONSTRUCTION ENGINE]
[USER_PROFILE: {profile_type}]

INPUT CONTEXT:
{vision_summary}

=== PHASE 0: STRUCTURAL INTEGRITY (IDENTITY LOCK) ===
{identity_block}

=== PHASE 1: CORE DIAGNOSIS & RE-SYNTHESIS STRATEGY ===
IF INPUT IS BLURRY/NOISY/DAMAGED -> ACTIVATE "COMPLETE RE-SYNTHESIS".
IGNORE source artifacts. HALLUCINATE high-frequency details from surrounding context.
VIRTUAL RE-SHOOT: Simulate 1/8000s shutter speed (zero motion blur).

=== PHASE 2: SUBJECT & ANATOMY ===
[INSTRUCTION: Restore faces with Portrait-Level fidelity. Preserve scars, marks, and character.]
{blocks['STYLESCALER_BLOCK'] or '[Standard styling]'}

=== PHASE 3: OPTICS, PHYSICS & LIGHTING ===
GEOMETRY & RESTORATION:
{blocks['PHOTOSCALER_BLOCK'] or '[Standard processing]'}

LIGHTING & TONE:
{blocks['LIGHTSCALER_BLOCK'] or '[Natural lighting]'}

=== NEGATIVE PROMPT ===
damaged, blurry, noisy, distorted faces, bad anatomy, text, watermarks, jpeg artifacts, shifting eyes, changing facial features, morphing bone structure, different pose, AI hallucinations.

=== QUALITY GATES ===
- Output resolution: Match or exceed input
- Color depth: 24-bit sRGB
- Format: High quality
- Compression: Minimal (preserve fine details)"""
        
        # Step 6: Sanitiza
        final_prompt, redundancies, empty_removed = sanitize_prompt(system_prompt)
        
        # Count stats
        active_sliders = sum(1 for v in modified_sliders.values() if v > 0)
        force_sliders = sum(1 for v in modified_sliders.values() if v >= 9)
        
        return {
            'success': True,
            'compiled_prompt': final_prompt,
            'system_prompt': system_prompt,
            'metadata': {
                'active_sliders': active_sliders,
                'force_sliders': force_sliders,
                'version': '28.0'
            },
            'debug_info': {
                'vetos_applied': vetos_applied,
                'sanitization': {
                    'redundancies_removed': redundancies,
                    'empty_sections_removed': empty_removed
                },
                'blocks': blocks
            }
        }
    
    async def compile_with_metadata(self, config: dict, vision_data: dict = None) -> dict:
        """Wrapper para compatibilidad."""
        result = await self.compile_prompt(config, vision_data)
        return {
            'success': result['success'],
            'prompt': result['compiled_prompt'],
            'metadata': result['metadata']
        }


prompt_compiler = PromptCompilerService()
