import google.generativeai as genai
import os

class GeminiService:
    def __init__(self):
        self.api_key = os.environ.get("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)

    async def generate_content(self, model_name: str, master_prompt: str, user_input: str) -> str:
        if not self.api_key: return "Error: API Key not configured."
        
        # MAPPING UPDATE:
        # Auto/Vision -> gemini-2.5-flash (Mapped to 2.0-flash)
        # User -> gemini-2.5-flash
        # Pro -> gemini-2.0-pro (Mapped to 1.5-pro or 2.0-flash if not avail)
        # Prolux -> gemini-3-pro (Mapped to 1.5-pro or experimental if avail)

        target_model = "gemini-2.0-flash" 
        
        if "pro" in model_name or "gemini-3" in model_name:
             target_model = "gemini-1.5-pro" # Stable "Pro" equivalent

        try:
            # Low temperature for Identity Lock respect
            generation_config = {
                "temperature": 0.2,
                "top_p": 0.8,
            }

            model = genai.GenerativeModel(
                model_name=target_model,
                system_instruction=master_prompt
            )
            
            response = model.generate_content(
                user_input,
                generation_config=generation_config
            )
            
            return response.text
            
        except Exception as e:
            return f"Error from Gemini: {str(e)}"

gemini_service = GeminiService()
