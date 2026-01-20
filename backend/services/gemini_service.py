import google.generativeai as genai
import os
import time
from services.key_manager import key_manager

class GeminiService:
    def __init__(self):
        pass

    async def generate_content(self, model_name: str, master_prompt: str, user_input: str) -> str:
        
        target_model = "gemini-2.5-flash" 
        if "flash" in model_name:
            target_model = "gemini-2.5-flash"
        elif "pro" in model_name or "gemini-3" in model_name:
            target_model = "gemini-3-pro-preview" 
        elif "gemini" == model_name:
             target_model = "gemini-2.5-pro"

        print(f"Using Model: {target_model}")

        # Retry Logic (Max 3 attempts with different keys)
        last_error = None
        for attempt in range(3):
            current_key = key_manager.get_next_key()
            if not current_key: return "Error: No API Keys configured."
            
            genai.configure(api_key=current_key)
            print(f"Attempt {attempt+1}/3 with key ...{current_key[-4:]}")

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
                print(f"Error on attempt {attempt+1}: {e}")
                last_error = e
                # Check for 429 Quota or 403 Permission
                err_str = str(e)
                if "429" in err_str or "quota" in err_str.lower() or "403" in err_str:
                    key_manager.report_error(current_key)
                    continue # Retry loop will pick next best key
                else:
                    # Non-key related error (e.g. bad request), break immediately
                    return f"Error from Gemini ({target_model}): {str(e)}"
        
        return f"Failed after 3 attempts. Last error: {str(last_error)}"

gemini_service = GeminiService()
