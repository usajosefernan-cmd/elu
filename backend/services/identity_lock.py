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
        Genera el bloque de Identity Lock SOLO si hay rostro.
        Si no hay rostro, permite procesamiento normal.
        """
        # Si NO hay cara, no aplicar lock
        if not context.has_face:
            return """[NO FACE DETECTED]
Process the image according to slider instructions.
Preserve original subject matter and composition unless sliders indicate otherwise."""
        
        # Si HAY cara, aplicar BIOMETRIC LOCK
        base_block = """[BIOMETRIC LOCK ACTIVE - HUMAN FACE DETECTED]

ABSOLUTE RULES FOR FACIAL PRESERVATION:
1. Facial bone structure is IMMUTABLE
   - Skull shape, jaw line, cheekbones, forehead
   - Eye sockets, nose bridge, chin projection
   
2. Facial proportions are FIXED
   - Distance between eyes
   - Eye-to-nose-to-mouth ratios
   - Face width-to-height ratio
   
3. Expression is FROZEN
   - Lip tension and curve (smile, frown, neutral)
   - Eye openness and squint
   - Eyebrow position and arch
   - Muscle state of face
   
4. Gaze and pose are LOCKED
   - Eye direction (left, right, camera)
   - Head tilt and rotation angle
   - Neck position
   
5. Distinctive marks are PRESERVED
   - Moles, beauty marks, freckles
   - Scars, birthmarks
   - Wrinkles, laugh lines
   - Skin texture and pores
   
6. Natural features are PROTECTED
   - Eye color
   - Skin tone base
   - Ethnicity markers
   - Age indicators"""
        
        # Si hay permiso para correcciones geométricas
        if context.geometric_changes_enabled:
            geometric_note = """

GEOMETRIC CORRECTIONS ALLOWED (Technical Only):
- Correct wide-angle lens distortion (project to 50mm equivalent)
- Straighten perspective (walls, horizon)
- BUT: These corrections must NOT alter the person's actual facial structure
- The face geometry correction is about fixing CAMERA distortion, not changing the PERSON"""
        else:
            geometric_note = ""
        
        # Añadir marcas específicas si existen
        marks_note = ""
        if context.facial_marks and len(context.facial_marks) > 0:
            marks_note = f"""

SPECIFIC MARKS TO PRESERVE:
{', '.join(context.facial_marks)}
These marks are IDENTIFYING FEATURES - do not remove or alter."""
        
        # DNA Anchor si existe
        dna_note = ""
        if context.face_crop_url:
            dna_note = """

[DNA ANCHOR REFERENCE PROVIDED]
A biometric face crop is available as GROUND TRUTH for facial structure.
Use it to verify that bone structure and proportions remain identical."""
        
        return f"{base_block}{geometric_note}{marks_note}{dna_note}"
    
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
