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
        
        # EXACT MAPPING BASED ON AVAILABLE MODELS
        target_model = "gemini-2.5-flash" # Default
        
        if "flash" in model_name:
            target_model = "gemini-2.5-flash"
        elif "pro" in model_name or "gemini-3" in model_name:
            # User explicitly requested gemini-3-pro / nano-banana
            target_model = "gemini-3-pro-preview" 
        elif "gemini" == model_name:
             target_model = "gemini-2.5-pro" # Fallback for 'pro' mode generic

        print(f"Using Model: {target_model}")

        try:
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]

            model = genai.GenerativeModel(
                model_name=target_model,
                system_instruction=master_prompt
            )
            
            # Note: For Gemini 3 Pro, ensure we are not sending unsupported params if any
            response = model.generate_content(
                user_input,
                safety_settings=safety_settings
            )
            
            # Safe access to text
            if response.candidates and response.candidates[0].content.parts:
                return response.text
            else:
                print(f"Gemini Feedback: {response.prompt_feedback}")
                return f"⚠️ Output Blocked. Reason: {response.prompt_feedback}"
            
        except Exception as e:
            print(f"Gemini generation error: {e}")
            return f"Error from Gemini ({target_model}): {str(e)}"

gemini_service = GeminiService()
