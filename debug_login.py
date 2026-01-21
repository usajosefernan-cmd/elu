#!/usr/bin/env python3
"""
Debug login flow
"""

import requests

def test_login_debug():
    url = "https://luxeditor.preview.emergentagent.com/api/auth/login"
    data = {"email": "usajosefernan@gmail.com", "password": "password"}
    
    print("🔍 Testing login flow")
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_login_debug()