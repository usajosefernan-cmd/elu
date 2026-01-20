import google.generativeai as genai
import os
import time
from backend.services.key_manager import key_manager

class GeminiService:
    def __init__(self):
        pass

    async def generate_content(self, model_name: str, master_prompt: str, user_input: str) -> str:
        
        # Primary Model Strategy
        target_model = "gemini-2.5-flash"
        if "pro" in model_name or "gemini-3" in model_name:
            target_model = "gemini-3-pro-preview"
        
        # Fallback Model (if Quota exceeds on all keys)
        fallback_model = "gemini-2.0-flash" 

        print(f"Requesting Model: {target_model}")

        # Attempt Logic
        max_retries = 3
        
        for attempt in range(max_retries):
            current_key = key_manager.get_next_key()
            if not current_key: return "Error: No API Keys configured."
            
            genai.configure(api_key=current_key)
            
            # Determine which model to use for this attempt
            # If we are retrying due to quota, maybe we switch to fallback on last attempt?
            # Or if we failed heavily. For now, try target model.
            
            # NOTE: If target is 3-pro and fails 429, we might want to fallback to 2.0-flash immediately 
            # if we know we are out of quota.
            
            current_model_name = target_model
            
            # Logic: If retrying and it was a 429, try fallback model on last attempt?
            if attempt == max_retries - 1 and target_model == "gemini-3-pro-preview":
                 print(f"Last attempt: Switching to fallback {fallback_model}")
                 current_model_name = fallback_model

            try:
                safety_settings = [
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                ]

                model = genai.GenerativeModel(
                    model_name=current_model_name,
                    system_instruction=master_prompt
                )
                
                response = model.generate_content(
                    user_input,
                    safety_settings=safety_settings
                )
                
                if response.candidates and response.candidates[0].content.parts:
                    key_manager.report_success(current_key)
                    return response.text
                else:
                    return f"⚠️ Output Blocked. Reason: {response.prompt_feedback}"
                
            except Exception as e:
                print(f"Attempt {attempt+1} failed with {current_model_name}: {e}")
                err_str = str(e)
                if "429" in err_str or "quota" in err_str.lower():
                    key_manager.report_error(current_key)
                    # Loop continues to next attempt/key
                else:
                    # Non-recoverable error?
                    pass
        
        return "Failed to generate content after retries. System is busy."

gemini_service = GeminiService()
