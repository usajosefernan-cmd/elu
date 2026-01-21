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
        
        Args:
            context: IdentityLockContext con la información del análisis
        
        Returns:
            Texto del bloque Identity Lock
        """
        # Si no hay cara o no requiere preservación estructural
        if not context.has_face or not context.requires_structural_preservation:
            return "Standard processing. No identity constraints."
        
        # Determinar el tipo de bloqueo
        if context.geometric_changes_enabled:
            base_block = """ALLOW structural changes for geometry correction (lens distortion, perspective).
HOWEVER: Facial identity must be preserved. Bone structure, proportions, character marks are sacred.
Changes allowed: Lens distortion correction, perspective fixing.
Changes FORBIDDEN: Changing face shape, proportions, identity markers."""
        else:
            base_block = """CRITICAL: IDENTITY LOCK ACTIVE - MAXIMUM CONSTRAINT.
DO NOT MOVE PIXELS related to face/body structure.
Structure must match overlay 100%.
Allowed changes: Color correction, tone mapping, lighting simulation.
Forbidden changes: Any structural pixel movement, facial morphing, identity alteration."""
        
        # Añadir preservación de marcas faciales
        marks_preservation = ""
        if context.facial_marks and len(context.facial_marks) > 0:
            marks_preservation = f"\nFacial marks to preserve identically: {', '.join(context.facial_marks)}"
        
        # Añadir referencia al DNA Anchor si existe
        dna_anchor_block = ""
        if context.face_crop_url:
            dna_anchor_block = """

[DNA ANCHOR REFERENCE ACTIVE]
A biometric face crop has been provided as secondary image reference.
Use the DNA Anchor as ABSOLUTE GROUND TRUTH for facial structure.
Any deviation from the DNA Anchor facial geometry is FORBIDDEN."""
        
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
