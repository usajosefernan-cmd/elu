from google import genai
from google.genai import types
import os
import time
from services.key_manager import key_manager

class GeminiService:
    def __init__(self):
        pass

    async def generate_content(self, model_name: str, master_prompt: str, user_input: str) -> str:
        
        # New SDK Mapping
        target_model = "gemini-2.0-flash" 
        if "pro" in model_name or "gemini-3" in model_name:
            target_model = "gemini-3-pro-preview"
        elif "gemini" == model_name:
             target_model = "gemini-2.0-pro-exp-02-05" # Modern Pro

        fallback_model = "gemini-2.0-flash-lite-preview-02-05"

        print(f"GeminiService (New SDK): Requesting {target_model}")

        max_retries = 3
        
        for attempt in range(max_retries):
            current_key = key_manager.get_next_key()
            if not current_key: return "Error: No API Keys configured."
            
            # Switch to fallback on last attempt
            current_model_name = target_model
            if attempt == max_retries - 1:
                 current_model_name = fallback_model
                 print(f"GeminiService: Switching to fallback {current_model_name}")

            print(f"GeminiService: Attempt {attempt+1} | Key ...{current_key[-4:]}")

            try:
                # Initialize Client (New SDK)
                # Note: 'vertexai=False' by default uses Google AI Studio (API Key)
                # If user wants Vertex, we would need vertexai=True and project/location.
                # Since we have API Keys, we use standard mode.
                client = genai.Client(api_key=current_key)
                
                response = client.models.generate_content(
                    model=current_model_name,
                    contents=[
                        types.Content(
                            role="user",
                            parts=[
                                types.Part.from_text(text=master_prompt),
                                types.Part.from_text(text=user_input)
                            ]
                        )
                    ],
                    config=types.GenerateContentConfig(
                        safety_settings=[
                            types.SafetySetting(
                                category="HARM_CATEGORY_HARASSMENT",
                                threshold="BLOCK_NONE"
                            ),
                            types.SafetySetting(
                                category="HARM_CATEGORY_HATE_SPEECH",
                                threshold="BLOCK_NONE"
                            ),
                            types.SafetySetting(
                                category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold="BLOCK_NONE"
                            ),
                            types.SafetySetting(
                                category="HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold="BLOCK_NONE"
                            )
                        ],
                        # Low temp for forensic accuracy
                        temperature=0.2 if "pro" in current_model_name else 0.7 
                    )
                )
                
                if response.text:
                    key_manager.report_success(current_key)
                    return response.text
                else:
                    return "⚠️ Output Blocked / Empty."
                
            except Exception as e:
                print(f"GeminiService Error ({current_model_name}): {e}")
                err_str = str(e)
                
                if "429" in err_str or "quota" in err_str.lower():
                    key_manager.report_error(current_key)
                    time.sleep(2)
                    continue
                else:
                    return f"Error from Gemini ({current_model_name}): {str(e)}"
        
        return "Failed to generate content after retries."

gemini_service = GeminiService()
