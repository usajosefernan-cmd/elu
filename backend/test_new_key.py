import google.generativeai as genai
import os

api_key = "AIzaSyD3c37S0SiykfDzHP2T9ZhShw9ialTHuFE"
genai.configure(api_key=api_key)

try:
    print("Testing Key ending in ...HuFE")
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content("Hello")
    print("Success! Response:", response.text)
except Exception as e:
    print(f"Key Failed: {e}")
