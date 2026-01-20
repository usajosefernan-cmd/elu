from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import json

class GeminiService:
    def __init__(self):
        # Intentar obtener la key del usuario o fallar
        self.api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("EMERGENT_LLM_KEY")
        if not self.api_key:
             print("WARNING: No API Key found for Gemini. Please set GOOGLE_API_KEY.")

    async def generate_content(self, model_name: str, master_prompt: str, user_input: str) -> str:
        if not self.api_key:
            return "Error: API Key not configured."
        
        # Mapeo de nombres internos a nombres de emergent/google
        # user -> gemini-2.5-flash
        # pro -> gemini-2.5-pro (Asumimos esto como 'gemini' standard)
        # prolux -> gemini-3-pro-preview
        
        emergent_model_name = "gemini-2.5-flash"
        if model_name == 'gemini-2.5-flash':
            emergent_model_name = "gemini-2.5-flash"
        elif model_name == 'gemini':
            emergent_model_name = "gemini-2.5-pro" 
        elif model_name == 'gemini-3-pro':
            emergent_model_name = "gemini-3-pro-preview"
            
        print(f"Using model: {emergent_model_name}")

        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id="luxscaler-session", # Stateless for now
                system_message=master_prompt
            ).with_model("gemini", emergent_model_name)
            
            user_msg = UserMessage(text=user_input)
            response = await chat.send_message(user_msg)
            
            return response.text
        except Exception as e:
            return f"Error calling Gemini: {str(e)}"

gemini_service = GeminiService()
