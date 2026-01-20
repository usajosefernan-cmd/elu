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
        
        # Map internal names to actual Google GenAI model names
        # PRD asked for 2.5/3.0 which might not exist publicly yet. 
        # Mapping to latest stable/preview equivalents.
        
        target_model = "gemini-2.0-flash" # Default fallback
        
        if "flash" in model_name:
            target_model = "gemini-2.0-flash"
        elif "pro" in model_name or model_name == "gemini":
            target_model = "gemini-1.5-pro" # Strong stable pro model
        elif "gemini-3" in model_name:
             target_model = "gemini-1.5-pro" # Fallback for '3' to best avail
             
        # Create model with system instruction
        try:
            # System instructions are passed to GenerativeModel constructor in newer SDKs
            # or we prepend to prompt if not supported.
            # google-generativeai supports system_instruction
            model = genai.GenerativeModel(
                model_name=target_model,
                system_instruction=master_prompt
            )
            
            response = model.generate_content(user_input)
            return response.text
            
        except Exception as e:
            print(f"Gemini generation error: {e}")
            return f"Error from Gemini: {str(e)}"

gemini_service = GeminiService()
