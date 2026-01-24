# LuxScaler v41 - LaoZhang Service
# Integración con Nano Banana Pro para generación de imágenes

import os
import requests
import base64
import re
from typing import Dict, Optional


class LaoZhangService:
    """
    Servicio para generar imágenes usando LaoZhang API.
    
    Modelos disponibles:
    - gemini-3-pro-image-preview (Nano Banana Pro): $0.05/edit, 4K, alta calidad
    - gemini-2.5-flash-image (Nano Banana): $0.025/edit, 1K, rápido
    - seedream-4-0-250828: $0.025/image, 2K/4K
    """
    
    def __init__(self):
        # Leer API key del documento
        self.api_key = "sk-aduYr9zcGnV39Vpj238041B0Af384432BeFf37C5E8F8Bf24"
        self.base_url = "https://api.laozhang.ai"
    
    async def generate_with_nano_banana_pro(
        self,
        prompt: str,
        image_base64: str,
        config: Optional[Dict] = None
    ) -> Dict:
        """
        Genera imagen usando Nano Banana Pro (gemini-3-pro-image-preview).
        
        Args:
            prompt: Instrucciones de edición/generación
            image_base64: Imagen base64 (sin prefijo data:image)
            config: {
                'aspect_ratio': '16:9' | '1:1' | '4:3' etc,
                'image_size': '1K' | '2K' | '4K',
                'reference_images': [base64_list] para multi-image fusion
            }
        
        Returns:
            {
                'success': bool,
                'image_base64': str,
                'model': str
            }
        """
        try:
            config = config or {}
            
            # Endpoint: Google Native Format para 4K
            endpoint = f"{self.base_url}/v1beta/models/gemini-3-pro-image-preview:generateContent"
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Limpiar base64 si tiene prefijo
            if image_base64.startswith('data:image'):
                image_base64 = image_base64.split(',')[1]
            
            # Construir contenido
            parts = [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_base64
                    }
                }
            ]
            
            # Añadir imágenes de referencia si existen (para Smart Anchors)
            if config.get('reference_images'):
                for ref_base64 in config['reference_images']:
                    if ref_base64.startswith('data:image'):
                        ref_base64 = ref_base64.split(',')[1]
                    
                    parts.append({
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": ref_base64
                        }
                    })
            
            # Configuración de generación
            generation_config = {
                "responseModalities": ["IMAGE"]
            }
            
            # Image config
            image_config = {}
            
            if config.get('aspect_ratio'):
                image_config["aspectRatio"] = config['aspect_ratio']
            
            if config.get('image_size'):
                image_config["imageSize"] = config['image_size']  # 1K, 2K, 4K
            
            if image_config:
                generation_config["imageConfig"] = image_config
            
            # Payload
            payload = {
                "contents": [{"parts": parts}],
                "generationConfig": generation_config
            }
            
            print(f"[LaoZhang] Calling Nano Banana Pro...")
            print(f"[LaoZhang] Image size: {config.get('image_size', '1K')}, Aspect: {config.get('aspect_ratio', 'auto')}")
            
            # Llamar API
            response = requests.post(endpoint, headers=headers, json=payload, timeout=120)
            
            if response.status_code >= 300:
                return {
                    "success": False,
                    "error": f"LaoZhang API error ({response.status_code}): {response.text[:200]}"
                }
            
            result = response.json()
            
            # Extraer imagen base64
            if 'candidates' in result and len(result['candidates']) > 0:
                candidate = result['candidates'][0]
                
                if 'content' in candidate and 'parts' in candidate['content']:
                    for part in candidate['content']['parts']:
                        if 'inline_data' in part:
                            image_data = part['inline_data']['data']
                            
                            print(f"[LaoZhang] ✅ Image generated successfully")
                            
                            return {
                                "success": True,
                                "image_base64": image_data,
                                "model": "gemini-3-pro-image-preview"
                            }
            
            return {
                "success": False,
                "error": "No image in response"
            }
            
        except Exception as e:
            print(f"[LaoZhang] Error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
    
    async def generate_with_nano_banana(
        self,
        prompt: str,
        image_base64: str
    ) -> Dict:
        """
        Genera imagen usando Nano Banana (gemini-2.5-flash-image).
        Más rápido y económico ($0.025 vs $0.05), 1K fijo.
        """
        try:
            # Endpoint: OpenAI Compatible Mode
            endpoint = f"{self.base_url}/v1/chat/completions"
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Convertir base64 a URL (o usar directamente)
            # LaoZhang acepta image_url con data:image
            image_url = f"data:image/jpeg;base64,{image_base64}" if not image_base64.startswith('data:') else image_base64
            
            payload = {
                "model": "gemini-2.5-flash-image",
                "stream": False,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }]
            }
            
            response = requests.post(endpoint, headers=headers, json=payload, timeout=60)
            
            if response.status_code >= 300:
                return {
                    "success": False,
                    "error": f"LaoZhang API error: {response.text[:200]}"
                }
            
            result = response.json()
            
            # Extraer imagen del response
            content = result['choices'][0]['message']['content']
            
            # Buscar base64 en formato markdown
            match = re.search(r'!\[.*?\]\((data:image/[^;]+;base64,([^)]+))\)', content)
            
            if match:
                base64_data = match.group(2)
                
                return {
                    "success": True,
                    "image_base64": base64_data,
                    "model": "gemini-2.5-flash-image"
                }
            
            return {
                "success": False,
                "error": "No image in response"
            }
            
        except Exception as e:
            print(f"[LaoZhang] Error: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Singleton
laozhang_service = LaoZhangService()
