import google.generativeai as genai
import os
from services.key_manager import key_manager

class GeminiService:
    def __init__(self):
        # Initial config with a key to avoid startup errors, but we will re-configure per request
        first_key = key_manager.get_next_key()
        if first_key:
            genai.configure(api_key=first_key)
        else:
            print("WARNING: No API Key found for Gemini.")

    async def generate_content(self, model_name: str, master_prompt: str, user_input: str) -> str:
        # 1. Get a key for this request
        current_key = key_manager.get_next_key()
        if not current_key:
            return "Error: No API Keys configured."
            
        # Re-configure global genai with this key (limitation of SDK global state)
        # Note: In a high-concurrency async app, this global switch is risky.
        # Ideally we instantiate a client per request if SDK supports it, or use lock.
        # The `google-generativeai` SDK uses a global `configure`.
        # However, `GenerativeModel` methods might accept `api_key` in newer versions or we assume low concurrency for MVP.
        # Better approach: We rely on the global configure for now as per standard docs.
        genai.configure(api_key=current_key)
        
        target_model = "gemini-2.5-flash" # Default
        if "pro" in model_name or "gemini-3" in model_name:
             target_model = "gemini-3-pro-preview" 
        elif "gemini" == model_name:
             target_model = "gemini-2.0-pro-exp-02-05" # Fallback

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
            
            response = model.generate_content(
                user_input,
                safety_settings=safety_settings
            )
            
            if response.candidates and response.candidates[0].content.parts:
                return response.text
            else:
                return f"⚠️ Output Blocked. Reason: {response.prompt_feedback}"
            
        except Exception as e:
            # Report error to manager (e.g. 429)
            key_manager.report_error(current_key)
            
            # Simple retry with one more key?
            # For MVP, just returning error.
            print(f"Gemini error with key ...{current_key[-4:]}: {e}")
            return f"Error from Gemini: {str(e)}"

gemini_service = GeminiService()
