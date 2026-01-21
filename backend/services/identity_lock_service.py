# LuxScaler v28.0 - Identity Lock Service
# FASE 5: Sistema de bloqueo de identidad dinámico

from typing import Dict, Optional, List

class IdentityLockService:
    """
    Gestiona el Identity Lock para preservación facial.
    Genera bloques de instrucciones basados en el contexto.
    """
    
    # Sliders que pueden afectar la identidad
    IDENTITY_RISK_SLIDERS = {
        'reencuadre_ia': 5,      # Umbral para permitir cambios estructurales
        'geometria': 8,          # Solo geometría extrema afecta identidad
        'styling_piel': 9,       # Piel sintética puede alterar identidad
        'maquillaje': 8          # Maquillaje extremo puede alterar
    }
    
    def analyze_identity_risk(self, slider_config: Dict) -> Dict:
        """
        Analiza si la configuración de sliders puede afectar la identidad.
        
        Returns:
            {
                'identity_lock_active': bool,
                'structural_changes_allowed': bool,
                'risk_level': 'none' | 'low' | 'medium' | 'high',
                'risky_sliders': [{'name': str, 'value': int, 'threshold': int}],
                'recommendation': str
            }
        """
        # Flatten config
        flat = {}
        for pillar in ['photoscaler', 'stylescaler', 'lightscaler']:
            pillar_data = slider_config.get(pillar, {})
            sliders = pillar_data.get('sliders', [])
            if isinstance(sliders, list):
                for s in sliders:
                    flat[s.get('name', '')] = int(s.get('value', 0))
            elif isinstance(sliders, dict):
                for k, v in sliders.items():
                    flat[k] = int(v)
        
        risky_sliders = []
        structural_changes_allowed = False
        
        # Check each risky slider
        for slider_name, threshold in self.IDENTITY_RISK_SLIDERS.items():
            value = flat.get(slider_name, 0)
            if value > threshold:
                risky_sliders.append({
                    'name': slider_name,
                    'value': value,
                    'threshold': threshold
                })
                if slider_name in ['reencuadre_ia', 'geometria']:
                    structural_changes_allowed = True
        
        # Determine risk level
        if not risky_sliders:
            risk_level = 'none'
        elif len(risky_sliders) == 1:
            risk_level = 'low'
        elif len(risky_sliders) <= 2:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        # Identity lock is active when NOT allowing structural changes
        identity_lock_active = not structural_changes_allowed
        
        # Generate recommendation
        if risk_level == 'none':
            recommendation = "Identidad completamente protegida. Cambios solo en color/luz/textura."
        elif risk_level == 'low' and not structural_changes_allowed:
            recommendation = "Identidad protegida con ajustes cosméticos menores."
        elif structural_changes_allowed:
            recommendation = "PRECAUCIÓN: Cambios estructurales habilitados. Verificar identidad post-proceso."
        else:
            recommendation = "Múltiples ajustes activos. Identidad facial puede verse afectada."
        
        return {
            'identity_lock_active': identity_lock_active,
            'structural_changes_allowed': structural_changes_allowed,
            'risk_level': risk_level,
            'risky_sliders': risky_sliders,
            'recommendation': recommendation
        }
    
    def generate_lock_block(self, 
                           slider_config: Dict, 
                           has_person: bool = True,
                           semantic_anchors: List[str] = None) -> str:
        """
        Genera el bloque de Identity Lock para el prompt.
        
        Args:
            slider_config: Configuración de sliders
            has_person: Si la imagen contiene una persona
            semantic_anchors: Elementos a preservar detectados por visión
        
        Returns:
            Texto del bloque Identity Lock para insertar en prompt
        """
        if not has_person:
            return """=== IDENTITY LOCK: INACTIVE (No Person Detected) ===
Standard processing mode. Focus on scene enhancement.
Preserve architectural geometry and object relationships."""
        
        analysis = self.analyze_identity_risk(slider_config)
        
        # Build anchors text
        anchors_text = ""
        if semantic_anchors:
            filtered = [a for a in semantic_anchors if any(
                kw in a.lower() for kw in ['face', 'eye', 'scar', 'mole', 'tattoo', 'freckle', 'cheek', 'nose', 'lip']
            )]
            if filtered:
                anchors_text = f"\nIDENTITY MARKERS TO PRESERVE: {', '.join(filtered)}"
        
        if analysis['identity_lock_active']:
            return f"""=== CRITICAL: IDENTITY LOCK ACTIVE ===
PRESERVATION LEVEL: MAXIMUM
DO NOT MOVE PIXELS related to face/body structure.
Facial geometry must match source 100% for overlay comparison.

ALLOWED CHANGES:
- Color correction, tone mapping
- Lighting simulation (additive, not structural)
- Skin texture enhancement (preserve pores, marks)
- Hair color/shine enhancement
- Eye brightness/clarity

FORBIDDEN CHANGES:
- Any structural pixel movement
- Face shape modification
- Eye repositioning or resizing
- Nose/lip shape changes
- Bone structure alteration
- Age modification
- Gender characteristics change
{anchors_text}

QUALITY GATE: Output must pass before/after overlay test.
If any facial pixel shifts more than 2px, REJECT and regenerate."""
        
        elif analysis['structural_changes_allowed']:
            return f"""=== IDENTITY LOCK: STRUCTURAL MODE ===
PRESERVATION LEVEL: FLEXIBLE (Reframing Enabled)
Structural changes allowed for composition improvement.

CONSTRAINTS:
- Facial IDENTITY must remain recognizable
- Bone structure proportions maintained
- Character marks preserved (scars, moles, tattoos)
- Eye color and shape preserved
- Skin tone preserved
{anchors_text}

ALLOWED CHANGES:
- Crop/reframe composition
- Lens distortion correction
- Perspective adjustment
- Background extension
- Subject repositioning within frame

QUALITY GATE: Person must be clearly identifiable as same individual."""
        
        else:
            return f"""=== IDENTITY LOCK: STANDARD MODE ===
PRESERVATION LEVEL: HIGH
Cosmetic enhancements allowed within identity boundaries.

CONSTRAINTS:
- Facial structure must remain unchanged
- Proportions preserved
- Character intact
{anchors_text}

ALLOWED CHANGES:
- Skin retouching (preserve texture pattern)
- Makeup enhancement
- Hair styling
- Lighting adjustments
- Color grading

QUALITY GATE: Same person, enhanced appearance."""
    
    def generate_dna_anchor_instruction(self, face_crop_available: bool = False) -> str:
        """
        Genera instrucciones para el DNA Anchor multimodal.
        Solo aplica si tenemos un crop facial disponible.
        """
        if not face_crop_available:
            return ""
        
        return """
=== MULTIMODAL DNA ANCHOR ACTIVE ===
IMAGE 2 (Face Crop) is the BIOMETRIC GROUND TRUTH.
When processing IMAGE 1 (main canvas):
- Use IMAGE 1 for lighting, composition, context
- Use IMAGE 2 as ABSOLUTE FACIAL REFERENCE
- Ensure facial structure matches IMAGE 2 pixel-perfectly
- No morphing, no identity alteration permitted
- Preserve ALL facial marks from IMAGE 2"""


identity_lock_service = IdentityLockService()
