# LuxScaler v28.0 - Identity Lock Service
# FASE 5.1: El Identity Lock Dinámico
# Según documento maestro del usuario

from typing import List, Optional
from dataclasses import dataclass


@dataclass
class IdentityLockContext:
    """Contexto para generar el bloque de Identity Lock."""
    has_face: bool
    face_crop_url: Optional[str] = None
    facial_marks: Optional[List[str]] = None
    requires_structural_preservation: bool = True
    geometric_changes_enabled: bool = False


class IdentityLockService:
    """
    Servicio de Identity Lock dinámico.
    
    El backend inyecta este texto en system_instruction.
    Incluye la lógica dinámica de integridad estructural.
    """
    
    def generate_identity_lock_block(
        self,
        context: IdentityLockContext
    ) -> str:
        """
        Genera el bloque de Identity Lock según el contexto.
        SIEMPRE aplica BIOMETRIC LOCK estricto por defecto.
        
        Args:
            context: IdentityLockContext con la información del análisis
        
        Returns:
            Texto del bloque Identity Lock
        """
        # Si no hay cara, lock básico
        if not context.has_face:
            return """[IDENTITY LOCK: BASIC]
Preserve overall composition and subject matter.
Do not invent new elements unless explicitly requested."""
        
        # BIOMETRIC LOCK ESTRICTO (por defecto SIEMPRE)
        if context.geometric_changes_enabled:
            # Solo permitir correcciones geométricas técnicas
            base_block = """[BIOMETRIC LOCK: STRICT WITH GEOMETRIC CORRECTION]

ALLOWED CORRECTIONS:
- Lens distortion correction (wide-angle → 50mm equivalent)
- Perspective correction (straighten walls, horizon)
- Outpaint cut-off limbs to complete anatomy

ABSOLUTELY FORBIDDEN:
- Changing bone structure (cheekbones, jaw, forehead)
- Altering eye distance, nose shape, lip proportions
- Shifting facial expression or gaze direction
- Changing ethnicity, age, gender markers
- Face swapping or morphing
- Plastic surgery effects
- Altering distinctive marks (moles, scars, wrinkles)
- Removing or adding facial features"""
        else:
            # LOCK MÁXIMO - Solo mejoras de calidad
            base_block = """[BIOMETRIC LOCK: MAXIMUM]

THIS IS A FORENSIC RESTORATION, NOT ARTISTIC CREATION.

READ-ONLY ELEMENTS (DO NOT MODIFY):
- ALL facial bone structure (skull, jaw, cheekbones, forehead)
- Eye distance, nose geometry, lip shape and size
- Facial expression state (smile intensity, eye squint, muscle tension)
- Gaze direction and head pose angle
- Distinctive marks: moles, scars, freckles, wrinkles, tattoos
- Dental features visible in expression
- Hair texture and pattern (natural vs styled)

WRITE-ACCESS ONLY FOR:
- Sensor noise removal and sharpness restoration
- Color grading and exposure correction
- Lighting enhancement (without changing shadows that define structure)
- Texture detail restoration (pores, fine lines) ON TOP of existing topology

CRITICAL: If the face is blurry, RE-SYNTHESIZE detail FOLLOWING the existing structure.
DO NOT invent a new face or "improve" features."""
        
        # Añadir preservación de marcas faciales específicas
        marks_preservation = ""
        if context.facial_marks and len(context.facial_marks) > 0:
            marks_preservation = f"""

SPECIFIC MARKS TO PRESERVE IDENTICALLY:
{', '.join(context.facial_marks)}"""
        
        # Añadir referencia al DNA Anchor si existe
        dna_anchor_block = ""
        if context.face_crop_url:
            dna_anchor_block = """

[DNA ANCHOR REFERENCE ACTIVE]
A biometric face crop is provided as ABSOLUTE GROUND TRUTH for facial structure.
ANY deviation from the DNA Anchor facial geometry is STRICTLY FORBIDDEN.
Use it to verify bone structure accuracy in your output."""
        
        return f"{base_block}{marks_preservation}{dna_anchor_block}"
    
    def generate_from_sliders(
        self,
        sliders: dict,
        has_face: bool = True,
        facial_marks: List[str] = None
    ) -> str:
        """
        Genera el Identity Lock basado en la configuración de sliders.
        
        Args:
            sliders: Diccionario de sliders {name: value}
            has_face: Si se detectó rostro en la imagen
            facial_marks: Lista de marcas faciales detectadas
        
        Returns:
            Texto del bloque Identity Lock
        """
        # Determinar si hay cambios geométricos habilitados
        geometric_changes = (
            sliders.get('geometria', 0) > 0 or
            sliders.get('geometria_distorsion', 0) > 0 or
            sliders.get('reencuadre_ia', 0) > 0
        )
        
        context = IdentityLockContext(
            has_face=has_face,
            facial_marks=facial_marks or [],
            requires_structural_preservation=True,
            geometric_changes_enabled=geometric_changes
        )
        
        return self.generate_identity_lock_block(context)
    
    def get_constraint_level(self, sliders: dict) -> str:
        """
        Retorna el nivel de restricción basado en sliders.
        
        Returns:
            "NONE" | "RELAXED" | "STANDARD" | "MAXIMUM"
        """
        # Si hay síntesis de ADN alta, relajar restricciones
        if sliders.get('sintesis_adn', 0) >= 8:
            return "RELAXED"
        
        # Si hay cambios geométricos
        if sliders.get('geometria', 0) > 0 or sliders.get('reencuadre_ia', 0) > 0:
            return "STANDARD"
        
        # Si limpieza de artefactos es muy alta
        if sliders.get('limpieza_artefactos', 0) >= 9:
            return "RELAXED"
        
        # Default: máxima restricción
        return "MAXIMUM"


# Instancia singleton
identity_lock_service = IdentityLockService()
