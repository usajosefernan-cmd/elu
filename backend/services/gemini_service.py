import google.generativeai as genai
import os
import time
from services.key_manager import key_manager

class GeminiService:
    def __init__(self):
        pass

    async def generate_content(self, model_name: str, master_prompt: str, user_input: str) -> str:
        
        # Priority 1: Requested Model (e.g. 3-pro)
        target_model = "gemini-2.5-flash" 
        if "pro" in model_name or "gemini-3" in model_name or "nano" in model_name:
            target_model = "gemini-3-pro-preview" 
        elif "gemini" == model_name:
             target_model = "gemini-2.5-pro"

        # Priority 2: Flash Fallback
        fallback_model_1 = "gemini-2.0-flash" 
        
        # Priority 3: Lite Fallback (Highest Speed/Quota)
        fallback_model_2 = "gemini-2.0-flash-lite-preview-02-05"

        print(f"GeminiService: Requesting {target_model}...")

        max_retries = 4 # Increased retries
        
        for attempt in range(max_retries):
            current_key = key_manager.get_next_key()
            if not current_key: return "Error: No API Keys configured."
            
            genai.configure(api_key=current_key)
            
            # Dynamic Model Selection based on attempt
            current_model_name = target_model
            
            # If we are failing, degrade gracefully
            if attempt == 1 and "pro" in target_model:
                 current_model_name = fallback_model_1 # Switch to Flash
                 print(f"GeminiService: Downgrading to {current_model_name}...")
            elif attempt >= 2:
                 current_model_name = fallback_model_2 # Switch to Lite
                 print(f"GeminiService: Downgrading to {current_model_name} (Lite)...")

            print(f"GeminiService: Attempt {attempt+1}/{max_retries} | Model: {current_model_name} | Key: ...{current_key[-4:]}")

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
                print(f"GeminiService Error ({current_model_name}): {e}")
                err_str = str(e)
                
                if "429" in err_str or "quota" in err_str.lower():
                    key_manager.report_error(current_key)
                    print(f"GeminiService: 429 Detected. Sleeping 5s before retry...")
                    time.sleep(5) # Backoff
                    continue
                elif "404" in err_str:
                    print("GeminiService: Model Not Found. Switching fallback.")
                    # If 3-Pro is 404, next loop will likely pick fallback if logic above holds, 
                    # but let's force it for safety in case we are at attempt 0
                    if "pro" in target_model:
                        target_model = fallback_model_1 
                    continue
                else:
                    # Other errors
                    return f"Error from Gemini ({current_model_name}): {str(e)}"
        
        return "Failed to generate content after retries. System is busy."

gemini_service = GeminiService()
