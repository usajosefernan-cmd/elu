# LuxScaler v28.0 - DNA Anchor Generator
# FASE 5.2: Multimodal DNA Anchor (Nueva característica v28.0)
# Según documento maestro del usuario

from typing import Dict, Any, Optional
from dataclasses import dataclass
import base64
from io import BytesIO
import os

# PIL para procesamiento de imagen
try:
    from PIL import Image
except ImportError:
    Image = None


@dataclass
class DNAAnchor:
    """Resultado del generador de DNA Anchor."""
    face_detected: bool
    face_crop_base64: Optional[str] = None
    face_crop_url: Optional[str] = None
    face_crop_storage_path: Optional[str] = None
    face_bounding_box: Optional[Dict[str, int]] = None
    anchor_strength: str = "weak"  # "weak" | "medium" | "strong" | "absolute"
    error: Optional[str] = None


class DNAAnchorGenerator:
    """
    Generador de DNA Anchor para preservación de identidad.
    
    El Identity Lock actual es texto. Si la temperatura creativa es alta,
    el modelo puede ignorarlo. La solución: inyectar biométricamente 
    la cara original como imagen.
    
    Flujo:
    1. Detecta cara en imagen normalizada
    2. Hace crop facial (256x256 o más)
    3. Almacena para envío multimodal
    """
    
    def __init__(self):
        self.face_detector = None
        self.models_loaded = False
        self.crop_size = 256
        self.margin_percent = 0.2  # 20% extra alrededor de la cara
    
    def _load_face_detector(self):
        """Intenta cargar detector de caras (lazy loading)."""
        if self.models_loaded:
            return self.face_detector is not None
        
        self.models_loaded = True
        
        # Intentar cargar face_recognition (más preciso)
        try:
            import face_recognition
            self.face_detector = 'face_recognition'
            print("DNAAnchorGenerator: Using face_recognition")
            return True
        except ImportError:
            pass
        
        # Fallback a OpenCV (más ligero)
        try:
            import cv2
            self.face_detector = 'opencv'
            print("DNAAnchorGenerator: Using OpenCV Haar Cascade")
            return True
        except ImportError:
            pass
        
        print("DNAAnchorGenerator: No face detector available")
        return False
    
    def _detect_faces_face_recognition(self, image_data: bytes) -> list:
        """Detecta caras usando face_recognition."""
        import face_recognition
        import numpy as np
        
        # Convertir bytes a array
        img = Image.open(BytesIO(image_data))
        img_array = np.array(img)
        
        # Detectar ubicaciones de caras
        face_locations = face_recognition.face_locations(img_array)
        
        # Convertir formato (top, right, bottom, left) -> (x, y, w, h)
        results = []
        for (top, right, bottom, left) in face_locations:
            results.append({
                'x': left,
                'y': top,
                'width': right - left,
                'height': bottom - top,
                'confidence': 1.0
            })
        
        return results
    
    def _detect_faces_opencv(self, image_data: bytes) -> list:
        """Detecta caras usando OpenCV Haar Cascade."""
        import cv2
        import numpy as np
        
        # Convertir bytes a array
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Cargar clasificador Haar
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # Detectar
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        results = []
        for (x, y, w, h) in faces:
            results.append({
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h),
                'confidence': 0.8
            })
        
        return results
    
    def _create_face_crop(
        self, 
        image_data: bytes, 
        face_box: Dict[str, int]
    ) -> bytes:
        """Crea un crop de la cara con margen."""
        if Image is None:
            return None
        
        img = Image.open(BytesIO(image_data))
        img_width, img_height = img.size
        
        # Calcular crop con margen
        x = face_box['x']
        y = face_box['y']
        w = face_box['width']
        h = face_box['height']
        
        # Añadir margen
        margin_w = int(w * self.margin_percent)
        margin_h = int(h * self.margin_percent)
        
        crop_x = max(0, x - margin_w)
        crop_y = max(0, y - margin_h)
        crop_right = min(img_width, x + w + margin_w)
        crop_bottom = min(img_height, y + h + margin_h)
        
        # Realizar crop
        cropped = img.crop((crop_x, crop_y, crop_right, crop_bottom))
        
        # Redimensionar a tamaño estándar
        cropped = cropped.resize((self.crop_size, self.crop_size), Image.Resampling.LANCZOS)
        
        # Convertir a bytes JPEG
        output = BytesIO()
        cropped.save(output, format='JPEG', quality=95)
        return output.getvalue()
    
    async def generate_dna_anchor(
        self,
        image_input: str,
        job_id: str = None
    ) -> DNAAnchor:
        """
        Genera DNA Anchor desde una imagen.
        
        Args:
            image_input: URL o base64 de la imagen
            job_id: ID del job (para storage path)
        
        Returns:
            DNAAnchor con el resultado
        """
        # Verificar dependencias
        if Image is None:
            return DNAAnchor(
                face_detected=False,
                anchor_strength="weak",
                error="PIL not installed"
            )
        
        # Cargar detector
        if not self._load_face_detector():
            return DNAAnchor(
                face_detected=False,
                anchor_strength="weak",
                error="No face detector available"
            )
        
        try:
            # Obtener bytes de la imagen
            image_data = await self._get_image_bytes(image_input)
            if not image_data:
                return DNAAnchor(
                    face_detected=False,
                    anchor_strength="weak",
                    error="Could not load image"
                )
            
            # Detectar caras
            if self.face_detector == 'face_recognition':
                faces = self._detect_faces_face_recognition(image_data)
            else:
                faces = self._detect_faces_opencv(image_data)
            
            if not faces:
                return DNAAnchor(
                    face_detected=False,
                    anchor_strength="weak"
                )
            
            # Tomar la cara más grande/confiable
            primary_face = max(faces, key=lambda f: f['width'] * f['height'])
            
            # Crear crop
            face_crop_bytes = self._create_face_crop(image_data, primary_face)
            if not face_crop_bytes:
                return DNAAnchor(
                    face_detected=True,
                    face_bounding_box=primary_face,
                    anchor_strength="medium",
                    error="Could not create face crop"
                )
            
            # Convertir a base64
            face_crop_base64 = base64.b64encode(face_crop_bytes).decode('utf-8')
            face_crop_data_url = f"data:image/jpeg;base64,{face_crop_base64}"
            
            return DNAAnchor(
                face_detected=True,
                face_crop_base64=face_crop_data_url,
                face_bounding_box=primary_face,
                anchor_strength="absolute"
            )
            
        except Exception as e:
            print(f"DNAAnchorGenerator Error: {e}")
            return DNAAnchor(
                face_detected=False,
                anchor_strength="weak",
                error=str(e)
            )
    
    async def _get_image_bytes(self, image_input: str) -> Optional[bytes]:
        """Obtiene bytes de una imagen desde URL o base64."""
        try:
            if image_input.startswith('data:image'):
                # Base64
                header, encoded = image_input.split(',', 1)
                return base64.b64decode(encoded)
            elif image_input.startswith('http'):
                # URL
                import requests
                resp = requests.get(image_input, timeout=30)
                if resp.status_code == 200:
                    return resp.content
            return None
        except Exception as e:
            print(f"Error getting image bytes: {e}")
            return None


# Instancia singleton
dna_anchor_generator = DNAAnchorGenerator()
