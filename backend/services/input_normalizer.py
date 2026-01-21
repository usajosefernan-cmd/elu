# LuxScaler v28.0 - Input Normalization Service
# FASE 1: Normaliza imágenes a máximo 19.5MP con formato JPEG sRGB

from PIL import Image
from io import BytesIO
import base64
import hashlib
import requests

class InputNormalizer:
    """
    Normaliza imágenes de entrada al formato óptimo para Gemini.
    - Máximo: 19.5 MP
    - Formato: JPEG sRGB Quality 90
    - Downscale: Lanczos (alta calidad)
    """
    
    MAX_MEGAPIXELS = 19.5
    JPEG_QUALITY = 90
    
    async def normalize(self, image_input: str) -> dict:
        """
        Normaliza una imagen de cualquier fuente (URL, base64, bytes).
        
        Returns:
            {
                "normalized_bytes": bytes,
                "normalized_base64": str,
                "metadata": {
                    "original_mp": float,
                    "original_dimensions": {"width": int, "height": int},
                    "normalized_mp": float,
                    "normalized_dimensions": {"width": int, "height": int},
                    "downscale_factor": float,
                    "action": "pass_through" | "downscale",
                    "image_hash": str
                }
            }
        """
        try:
            # Step 1: Load image from any source
            img = await self._load_image(image_input)
            original_width, original_height = img.size
            original_mp = (original_width * original_height) / 1_000_000
            
            metadata = {
                "original_mp": round(original_mp, 2),
                "original_dimensions": {"width": original_width, "height": original_height},
                "normalized_mp": 0,
                "normalized_dimensions": {"width": 0, "height": 0},
                "downscale_factor": 1.0,
                "action": "pass_through",
                "aspect_ratio": round(original_width / original_height, 3)
            }
            
            # Step 2: Check if downscale needed
            if original_mp > self.MAX_MEGAPIXELS:
                metadata["action"] = "downscale"
                downscale_factor = (self.MAX_MEGAPIXELS / original_mp) ** 0.5
                new_width = int(original_width * downscale_factor)
                new_height = int(original_height * downscale_factor)
                
                # Lanczos resampling for highest quality
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                metadata["downscale_factor"] = round(downscale_factor, 3)
                metadata["normalized_dimensions"] = {"width": new_width, "height": new_height}
                metadata["normalized_mp"] = round((new_width * new_height) / 1_000_000, 2)
            else:
                metadata["normalized_dimensions"] = {"width": original_width, "height": original_height}
                metadata["normalized_mp"] = metadata["original_mp"]
            
            # Step 3: Convert to JPEG sRGB
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            output_buffer = BytesIO()
            img.save(output_buffer, format='JPEG', quality=self.JPEG_QUALITY, optimize=True)
            normalized_bytes = output_buffer.getvalue()
            
            # Step 4: Generate hash for caching
            metadata["image_hash"] = hashlib.sha256(normalized_bytes).hexdigest()
            
            # Step 5: Create base64 version
            normalized_base64 = f"data:image/jpeg;base64,{base64.b64encode(normalized_bytes).decode('utf-8')}"
            
            return {
                "success": True,
                "normalized_bytes": normalized_bytes,
                "normalized_base64": normalized_base64,
                "metadata": metadata
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "metadata": {}
            }
    
    async def _load_image(self, image_input: str) -> Image.Image:
        """Load image from URL or base64 string."""
        if image_input.startswith('data:'):
            # Base64 data URL
            header, encoded = image_input.split(',', 1)
            image_data = base64.b64decode(encoded)
            return Image.open(BytesIO(image_data))
        elif image_input.startswith('http'):
            # URL - download
            response = requests.get(image_input, timeout=30)
            response.raise_for_status()
            return Image.open(BytesIO(response.content))
        else:
            # Assume raw base64
            image_data = base64.b64decode(image_input)
            return Image.open(BytesIO(image_data))
    
    async def create_thumbnail(self, image_input: str, max_dimension: int = 1024) -> dict:
        """
        Creates a thumbnail for Proxy Vision analysis.
        Uses much smaller image for faster/cheaper analysis.
        """
        try:
            img = await self._load_image(image_input)
            original_width, original_height = img.size
            
            # Calculate new dimensions preserving aspect ratio
            if original_width > max_dimension or original_height > max_dimension:
                scale_factor = min(max_dimension / original_width, max_dimension / original_height)
                new_width = int(original_width * scale_factor)
                new_height = int(original_height * scale_factor)
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            else:
                new_width, new_height = original_width, original_height
            
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            output_buffer = BytesIO()
            img.save(output_buffer, format='JPEG', quality=85)
            thumbnail_bytes = output_buffer.getvalue()
            thumbnail_hash = hashlib.sha256(thumbnail_bytes).hexdigest()
            thumbnail_base64 = f"data:image/jpeg;base64,{base64.b64encode(thumbnail_bytes).decode('utf-8')}"
            
            return {
                "success": True,
                "thumbnail_bytes": thumbnail_bytes,
                "thumbnail_base64": thumbnail_base64,
                "thumbnail_hash": thumbnail_hash,
                "dimensions": {"width": new_width, "height": new_height},
                "aspect_ratio": round(new_width / new_height, 3)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}


input_normalizer = InputNormalizer()
