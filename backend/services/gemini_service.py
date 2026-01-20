import google.generativeai as genai
import os

class GeminiService:
    def __init__(self):
        self.api_key = os.environ.get("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
        else:
            print("WARNING: No API Key found for Gemini.")

    async def generate_content(self, model_name: str, master_prompt: str, user_input: str) -> str:
        if not self.api_key:
            return "Error: API Key not configured."
        
        target_model = "gemini-2.0-flash" 
        if "pro" in model_name or model_name == "gemini":
            target_model = "gemini-1.5-pro"
             
        try:
            # Configure safety settings to BLOCK_NONE to allow creative/forensic prompts
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE"
                },
            ]

            model = genai.GenerativeModel(
                model_name=target_model,
                system_instruction=master_prompt
            )
            
            response = model.generate_content(
                user_input,
                safety_settings=safety_settings
            )
            
            if response.candidates:
                return response.text
            else:
                # Log feedback for debugging
                print(f"Gemini Blocked Response: {response.prompt_feedback}")
                return f"⚠️ Generation Blocked by Safety Filters.\nReason: {response.prompt_feedback}"
            
        except Exception as e:
            print(f"Gemini generation error: {e}")
            return f"Error from Gemini: {str(e)}"

gemini_service = GeminiService()
