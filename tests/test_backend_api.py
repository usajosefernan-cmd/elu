"""
Backend API Tests for LuxScaler v28
Tests the image processing endpoints including:
- /api/process/analyze - Image analysis with Gemini 2.5 Flash
- /api/process/compile - Prompt compilation
- /api/process/generate-image - Image generation
"""

import pytest
import requests
import os
import base64
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://image-genius-3.preview.emergentagent.com')

# Test credentials
TEST_USER_EMAIL = "usajosefernan@gmail.com"
TEST_USER_PASSWORD = "111111"

# Sample test image (1x1 pixel PNG in base64)
SAMPLE_IMAGE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


class TestAPIRoot:
    """Test basic API connectivity"""
    
    def test_api_root_endpoint(self):
        """Test that the API root endpoint responds"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API Root: {data['message']}")


class TestProcessAnalyze:
    """Test /api/process/analyze endpoint - CRITICAL for v28 flow"""
    
    def test_analyze_with_base64_image(self):
        """Test image analysis with base64 encoded image"""
        payload = {
            "imageBase64": SAMPLE_IMAGE_BASE64
        }
        
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/process/analyze",
            json=payload,
            timeout=60
        )
        elapsed = time.time() - start_time
        
        print(f"⏱️ Analyze endpoint response time: {elapsed:.2f}s")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        
        if data.get("success"):
            assert "analysis" in data
            print(f"✅ Analysis successful: {data.get('analysis', {}).keys() if isinstance(data.get('analysis'), dict) else 'N/A'}")
        else:
            # Even if analysis fails (e.g., tiny image), endpoint should respond correctly
            print(f"⚠️ Analysis returned success=False: {data.get('error', 'No error message')}")
        
        # Performance check - should respond within reasonable time
        assert elapsed < 30, f"Analyze endpoint took too long: {elapsed:.2f}s (expected < 30s)"
    
    def test_analyze_without_image_returns_error(self):
        """Test that analyze endpoint returns error when no image provided"""
        payload = {}
        
        response = requests.post(
            f"{BASE_URL}/api/process/analyze",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200  # Endpoint returns 200 with error in body
        data = response.json()
        assert data.get("success") == False
        assert "error" in data
        print(f"✅ Correctly returns error for missing image: {data.get('error')}")


class TestProcessCompile:
    """Test /api/process/compile endpoint"""
    
    def test_compile_prompt_basic(self):
        """Test prompt compilation with basic config"""
        payload = {
            "config": {
                "photoscaler": {
                    "sliders": [
                        {"name": "limpieza_artefactos", "value": 5},
                        {"name": "enfoque", "value": 5}
                    ]
                },
                "stylescaler": {
                    "sliders": [
                        {"name": "estilo_autor", "value": 5}
                    ]
                },
                "lightscaler": {
                    "sliders": [
                        {"name": "brillo_exposicion", "value": 5}
                    ]
                }
            },
            "visionAnalysis": {
                "subject_type": "portrait",
                "lighting_conditions": "natural"
            },
            "userMode": "auto"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/process/compile",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "prompt" in data
        assert "metadata" in data
        
        print(f"✅ Prompt compiled successfully")
        print(f"   - Active sliders: {data.get('metadata', {}).get('active_sliders', 'N/A')}")
        print(f"   - Identity lock: {data.get('metadata', {}).get('identity_lock', 'N/A')}")


class TestProcessGenerateImage:
    """Test /api/process/generate-image endpoint"""
    
    def test_generate_image_endpoint_exists(self):
        """Test that generate-image endpoint exists and accepts requests"""
        # Using a minimal payload - actual generation may fail without valid image
        payload = {
            "imageUrl": "https://example.com/test.jpg",
            "compiledPrompt": "Test prompt",
            "userMode": "auto"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/process/generate-image",
            json=payload,
            timeout=60
        )
        
        # Endpoint should exist (not 404)
        assert response.status_code != 404, "Generate-image endpoint not found"
        
        data = response.json()
        # May fail due to invalid image URL, but endpoint should respond
        print(f"✅ Generate-image endpoint responds: success={data.get('success')}")
        if not data.get("success"):
            print(f"   - Error (expected with test URL): {data.get('error', 'N/A')}")


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_auth_login_endpoint(self):
        """Test that auth login endpoint works with test credentials"""
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=payload,
            timeout=10
        )
        
        print(f"✅ Auth login endpoint responds with status: {response.status_code}")
        
        # Should return 200 for valid credentials or 401 for invalid
        assert response.status_code in [200, 401, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            print(f"   - Login successful, userId: {data.get('userId', 'N/A')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
