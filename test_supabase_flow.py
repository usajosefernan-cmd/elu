#!/usr/bin/env python3
"""
Test generation with correct Supabase user ID
"""

import requests

def test_generation_with_supabase_id():
    # Use the actual Supabase user ID
    supabase_user_id = "d86b1859-3e57-4ec1-9e50-1aae155dbdef"
    
    print("🔍 Testing generation with Supabase user ID")
    
    # Test apply-user-macro first to set current_config
    macro_url = "https://image-enhancer-107.preview.emergentagent.com/api/process/apply-user-macro"
    macro_data = {
        "userId": supabase_user_id,
        "quality": 8,
        "aesthetics": 6,
        "light": 7
    }
    
    print("1. Testing apply-user-macro...")
    macro_response = requests.post(macro_url, json=macro_data)
    print(f"Macro Status: {macro_response.status_code}")
    print(f"Macro Response: {macro_response.json()}")
    
    if macro_response.status_code == 200:
        # Now test generation
        gen_url = "https://image-enhancer-107.preview.emergentagent.com/api/process/generate"
        gen_data = {
            "userId": supabase_user_id,
            "input": {
                "content": "Test generation with Supabase config"
            }
        }
        
        print("\n2. Testing generation...")
        gen_response = requests.post(gen_url, json=gen_data)
        print(f"Generation Status: {gen_response.status_code}")
        print(f"Generation Response: {gen_response.json()}")

if __name__ == "__main__":
    test_generation_with_supabase_id()