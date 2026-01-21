# LuxScaler v28.0 - Multimodal Prompt Injector
# FASE 5.2: Inyección de DNA Anchor en Prompt Multimodal
# Según documento maestro del usuario

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import base64


@dataclass 
class MultimodalPart:
    """Parte de un contenido multimodal."""
    type: str  # "text" | "image"
    content: str  # texto o base64
    mime_type: Optional[str] = None


@dataclass
class MultimodalPromptContent:
    """Contenido multimodal para enviar a Gemini."""
    parts: List[MultimodalPart]
    
    def to_gemini_format(self) -> List[Dict]:
        """Convierte a formato de la API de Gemini."""
        result = []
        for part in self.parts:
            if part.type == "text":
                result.append({"text": part.content})
            elif part.type == "image":
                # Extraer base64 si viene como data URL
                if part.content.startswith('data:'):
                    header, encoded = part.content.split(',', 1)
                    mime = header.split(':')[1].split(';')[0]
                else:
                    encoded = part.content
                    mime = part.mime_type or "image/jpeg"
                
                result.append({
                    "inlineData": {
                        "data": encoded,
                        "mimeType": mime
                    }
                })
        return result


class MultimodalPromptInjector:
    """
    Inyector de prompts multimodales con DNA Anchor.
    
    Construye el contenido multimodal para Gemini:
    - Imagen A: El lienzo (composición, iluminación)
    - Imagen B: El face_crop.jpg (identidad biométrica) [opcional]
    
    Prompt: "Use Image A for lighting/composition.
             Use Image B as the ABSOLUTE BIOMETRIC GROUND TRUTH.
             Structure must match Image B pixel-perfectly."
    """
    
    def __init__(self):
        pass
    
    async def build_multimodal_prompt_with_dna_anchor(
        self,
        user_prompt: str,
        main_image_base64: str,
        dna_anchor_url: Optional[str] = None
    ) -> MultimodalPromptContent:
        """
        Construye prompt multimodal con DNA Anchor opcional.
        
        Args:
            user_prompt: Prompt de texto principal
            main_image_base64: Imagen principal en base64
            dna_anchor_url: URL o base64 del DNA Anchor facial
        
        Returns:
            MultimodalPromptContent listo para enviar
        """
        parts = []
        
        # Part 1: System instructions / Prompt de texto
        parts.append(MultimodalPart(
            type="text",
            content=user_prompt
        ))
        
        # Part 2: Main image (lienzo)
        parts.append(MultimodalPart(
            type="image",
            content=main_image_base64,
            mime_type="image/jpeg"
        ))
        
        # Part 3: DNA Anchor (identidad biométrica) - si existe
        if dna_anchor_url:
            # Si es URL, descargar
            anchor_base64 = await self._get_anchor_base64(dna_anchor_url)
            
            if anchor_base64:
                parts.append(MultimodalPart(
                    type="image",
                    content=anchor_base64,
                    mime_type="image/jpeg"
                ))
                
                # Part 4: Instrucción adicional para el DNA Anchor
                dna_instruction = """[BIOMETRIC GROUND TRUTH - IMAGE 2]:
This is the original face/subject identity (DNA Anchor).
When processing Image 1 (main canvas):
- Use Image 1 for lighting, composition, and context.
- Use Image 2 as the ABSOLUTE BIOMETRIC REFERENCE.
- Ensure facial structure matches Image 2 pixel-perfectly.
- No morphing, no identity alteration.
- Preserve all facial marks, scars, and character from Image 2."""
                
                parts.append(MultimodalPart(
                    type="text",
                    content=dna_instruction
                ))
        
        return MultimodalPromptContent(parts=parts)
    
    async def _get_anchor_base64(self, anchor_input: str) -> Optional[str]:
        """Obtiene el DNA Anchor en base64."""
        try:
            if anchor_input.startswith('data:image'):
                return anchor_input
            
            if anchor_input.startswith('http'):
                import requests
                resp = requests.get(anchor_input, timeout=30)
                if resp.status_code == 200:
                    b64 = base64.b64encode(resp.content).decode('utf-8')
                    mime = resp.headers.get('Content-Type', 'image/jpeg')
                    return f"data:{mime};base64,{b64}"
            
            return None
        except Exception as e:
            print(f"Error getting DNA Anchor: {e}")
            return None
    
    def build_simple_multimodal(
        self,
        prompt: str,
        image_base64: str
    ) -> MultimodalPromptContent:
        """
        Construye prompt multimodal simple sin DNA Anchor.
        
        Args:
            prompt: Texto del prompt
            image_base64: Imagen en base64
        
        Returns:
            MultimodalPromptContent
        """
        return MultimodalPromptContent(parts=[
            MultimodalPart(type="text", content=prompt),
            MultimodalPart(type="image", content=image_base64, mime_type="image/jpeg")
        ])
    
    def get_token_estimate(self, content: MultimodalPromptContent) -> Dict[str, int]:
        """
        Estima tokens del contenido multimodal.
        
        Returns:
            Dict con estimaciones de tokens
        """
        text_chars = sum(
            len(p.content) for p in content.parts if p.type == "text"
        )
        image_count = sum(1 for p in content.parts if p.type == "image")
        
        # Aproximaciones
        # Texto: ~4 chars per token
        # Imagen: ~258 tokens por imagen (según documentación de Gemini)
        
        text_tokens = text_chars // 4
        image_tokens = image_count * 258
        
        return {
            'text_tokens': text_tokens,
            'image_tokens': image_tokens,
            'total_tokens': text_tokens + image_tokens,
            'image_count': image_count
        }


# Instancia singleton  
multimodal_prompt_injector = MultimodalPromptInjector()
