import google.generativeai as genai
import os
import time
from backend.services.key_manager import key_manager

class GeminiService:
    def __init__(self):
        pass

    async def generate_content(self, model_name: str, master_prompt: str, user_input: str) -> str:
        
        # Explicit Mapping based on Web Search & User Request
        target_model = "gemini-2.5-flash" # Default Speed
        
        if "pro" in model_name or "gemini-3" in model_name or "nano" in model_name:
            target_model = "gemini-3-pro-preview" 
        elif "gemini" == model_name:
             target_model = "gemini-2.5-pro"

        print(f"GeminiService: Target Model -> {target_model}")

        # Fallback Model (High Quota)
        fallback_model = "gemini-2.0-flash" 

        max_retries = 3
        
        for attempt in range(max_retries):
            current_key = key_manager.get_next_key()
            if not current_key: return "Error: No API Keys configured."
            
            genai.configure(api_key=current_key)
            
            # If last attempt and target is the heavy 3-pro, switch to fallback to ensure output
            current_model_name = target_model
            if attempt == max_retries - 1 and target_model == "gemini-3-pro-preview":
                 print(f"GeminiService: Switching to fallback {fallback_model} due to repeated failures.")
                 current_model_name = fallback_model

            print(f"GeminiService: Attempt {attempt+1}/{max_retries} | Model: {current_model_name} | Key: ...{current_key[-4:]}")

            try:
                # Safety Settings - Block None for Creative/Forensic Tasks
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
                
                # Handle Quota (429) or Permission (403) or Not Found (404 - unlikely if name correct)
                if "429" in err_str or "quota" in err_str.lower():
                    key_manager.report_error(current_key)
                    time.sleep(1) # Brief pause before next key
                    continue
                elif "404" in err_str:
                    print("GeminiService: Model 404. It might be unavailable. Switching to fallback immediately.")
                    current_model_name = fallback_model
                    # Retry with fallback in next loop iteration? Or forcing immediate retry?
                    # Let's just let the loop continue, next attempt will pick up fallback logic if we set target_model?
                    # Better: try immediately with fallback using same key if key is valid but model isn't?
                    # No, usually 404 is global.
                    # Let's change target_model to fallback for subsequent retries
                    target_model = fallback_model
                    continue
                else:
                    # Other errors
                    return f"Error from Gemini ({current_model_name}): {str(e)}"
        
        return "Failed to generate content after retries. System is busy."

gemini_service = GeminiService()
