from google import genai
from google.genai import types
import os
import time
import base64
import requests
from io import BytesIO
from PIL import Image
from services.key_manager import key_manager

class GeminiService:
    def __init__(self):
        pass

    def _get_image_aspect_ratio(self, image_input: str) -> str:
        """Detect aspect ratio from input image and return closest standard ratio."""
        try:
            if image_input.startswith("data:image"):
                header, encoded = image_input.split(",", 1)
                image_data = base64.b64decode(encoded)
                img = Image.open(BytesIO(image_data))
            elif image_input.startswith("http"):
                resp = requests.get(image_input)
                img = Image.open(BytesIO(resp.content))
            else:
                return "1:1"  # Default
            
            width, height = img.size
            ratio = width / height
            
            # Map to closest standard aspect ratio
            if ratio > 1.6:  # Wide
                return "16:9"
            elif ratio > 1.2:  # Slightly wide
                return "4:3"
            elif ratio > 0.9:  # Square-ish
                return "1:1"
            elif ratio > 0.7:  # Portrait
                return "3:4"
            else:  # Tall portrait
                return "9:16"
        except Exception as e:
            print(f"Aspect ratio detection error: {e}")
            return "1:1"  # Safe default

    async def generate_content(self, model_name: str, master_prompt: str, user_input_text: str, image_input: str = None) -> dict:
        
        # 1. Model Selection (Image Generation focus)
        # IMPORTANT: Use gemini-2.0-flash-exp-image-generation for image output
        # This is the only Gemini model that generates images
        
        target_model = "gemini-2.0-flash-exp-image-generation" # Correct model for image generation
        
        # Fallback to same model - there's no other image gen model available
        fallback_model = "gemini-2.0-flash-exp-image-generation"

        print(f"GeminiService (ImgGen): Requesting {target_model}")

        max_retries = 3
        
        for attempt in range(max_retries):
            current_key = key_manager.get_next_key()
            if not current_key: return {"error": "No API Keys configured."}
            
            # Switch to fallback on last attempt
            current_model_name = target_model
            if attempt == max_retries - 1 and target_model != fallback_model:
                 current_model_name = fallback_model
                 print(f"GeminiService: Switching to fallback {current_model_name}")

            print(f"GeminiService: Attempt {attempt+1} | Key ...{current_key[-4:]}")

            try:
                client = genai.Client(api_key=current_key)
                
                # 2. Construct Contents (Multimodal)
                contents_parts = []
                
                # A. System Instruction (Master Prompt) -> As text part? 
                # SDK might prefer system_instruction config, but for Image models sometimes prompt is better in contents
                # Documentation says contents=[prompt, image].
                # Let's combine master prompt and user input.
                final_prompt = f"{master_prompt}\n\nUSER REQUEST: {user_input_text}"
                contents_parts.append(types.Part.from_text(text=final_prompt))
                
                # B. Input Image (for Img-to-Img)
                detected_aspect_ratio = "1:1"  # Default
                if image_input:
                    detected_aspect_ratio = self._get_image_aspect_ratio(image_input)
                    print(f"GeminiService: Detected aspect ratio {detected_aspect_ratio}")
                    
                    if image_input.startswith("data:image"):
                        try:
                            header, encoded = image_input.split(",", 1)
                            mime_type = header.split(":")[1].split(";")[0]
                            image_data = base64.b64decode(encoded)
                            contents_parts.append(types.Part.from_bytes(data=image_data, mime_type=mime_type))
                        except Exception as e:
                            print(f"Base64 error: {e}")
                    elif image_input.startswith("http"):
                        try:
                            resp = requests.get(image_input)
                            if resp.status_code == 200:
                                mime_type = resp.headers.get("Content-Type", "image/jpeg")
                                contents_parts.append(types.Part.from_bytes(data=resp.content, mime_type=mime_type))
                        except Exception as e:
                            print(f"Download error: {e}")

                # 3. Call API
                response = client.models.generate_content(
                    model=current_model_name,
                    contents=[types.Content(role="user", parts=contents_parts)],
                    config=types.GenerateContentConfig(
                        response_modalities=['TEXT', 'IMAGE'], # CRITICAL per docs
                        image_config=types.ImageConfig(
                            aspect_ratio=detected_aspect_ratio, # Use detected aspect ratio
                            image_size="4K" if "pro" in current_model_name else None # 4K only on Pro
                        ),
                        safety_settings=[
                            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
                            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_NONE"),
                            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
                            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE")
                        ]
                    )
                )
                
                # 4. Parse Response
                result = {"text": "", "image_base64": None, "model": current_model_name}
                
                if response.candidates:
                    for part in response.candidates[0].content.parts:
                        if part.text:
                            result["text"] += part.text
                        if part.inline_data:
                            # Convert bytes to base64 string for frontend
                            b64_str = base64.b64encode(part.inline_data.data).decode('utf-8')
                            mime = part.inline_data.mime_type
                            result["image_base64"] = f"data:{mime};base64,{b64_str}"
                
                key_manager.report_success(current_key)
                return result
                
            except Exception as e:
                print(f"GeminiService Error ({current_model_name}): {e}")
                err_str = str(e)
                
                if "429" in err_str or "quota" in err_str.lower():
                    key_manager.report_error(current_key)
                    time.sleep(2)
                    continue
                else:
                    return {"error": f"Error from Gemini: {str(e)}"}
        
        return {"error": "Failed to generate content after retries."}

gemini_service = GeminiService()
