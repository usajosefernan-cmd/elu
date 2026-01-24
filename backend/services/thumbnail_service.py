"""
LuxScaler v40.1 - Thumbnail Service
Genera thumbnails optimizados para presets (max 1024px, webp 80%)
"""
import base64
import io
from PIL import Image
import httpx
from typing import Optional, Tuple

class ThumbnailService:
    def __init__(self):
        self.max_dimension = 1024
        self.quality = 80
        self.format = "WEBP"
    
    async def create_thumbnail_from_url(self, image_url: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Descarga una imagen desde URL y crea un thumbnail.
        Returns: (base64_data, mime_type) or (None, None) on error
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(image_url)
                if response.status_code != 200:
                    print(f"[ThumbnailService] Failed to download: {response.status_code}")
                    return None, None
                
                image_bytes = response.content
                return self._process_image(image_bytes)
        except Exception as e:
            print(f"[ThumbnailService] Error downloading image: {e}")
            return None, None
    
    def create_thumbnail_from_base64(self, base64_data: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Crea un thumbnail desde una imagen base64.
        Returns: (base64_data, mime_type) or (None, None) on error
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            image_bytes = base64.b64decode(base64_data)
            return self._process_image(image_bytes)
        except Exception as e:
            print(f"[ThumbnailService] Error processing base64: {e}")
            return None, None
    
    def _process_image(self, image_bytes: bytes) -> Tuple[Optional[str], Optional[str]]:
        """
        Procesa los bytes de imagen y genera thumbnail.
        """
        try:
            # Open image
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary (for WEBP compatibility)
            if img.mode in ('RGBA', 'P'):
                # Create white background for transparency
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calculate new dimensions maintaining aspect ratio
            width, height = img.size
            if width > height:
                if width > self.max_dimension:
                    new_width = self.max_dimension
                    new_height = int(height * (self.max_dimension / width))
                else:
                    new_width, new_height = width, height
            else:
                if height > self.max_dimension:
                    new_height = self.max_dimension
                    new_width = int(width * (self.max_dimension / height))
                else:
                    new_width, new_height = width, height
            
            # Resize with high quality
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save to WEBP
            buffer = io.BytesIO()
            img.save(buffer, format=self.format, quality=self.quality, method=6)
            buffer.seek(0)
            
            # Encode to base64
            thumbnail_base64 = base64.b64encode(buffer.read()).decode('utf-8')
            
            print(f"[ThumbnailService] Created {new_width}x{new_height} WEBP thumbnail ({len(thumbnail_base64)//1024}KB)")
            
            return thumbnail_base64, "image/webp"
            
        except Exception as e:
            print(f"[ThumbnailService] Error processing image: {e}")
            return None, None


thumbnail_service = ThumbnailService()
