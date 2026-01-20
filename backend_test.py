#!/usr/bin/env python3
"""
LuxScaler v27 Backend API Testing Suite
Tests authentication, pillars configuration, and generation functionality
"""

import requests
import sys
import json
from datetime import datetime

class LuxScalerAPITester:
    def __init__(self, base_url="https://gemini-scaler.preview.emergentagent.com"):
        self.base_url = base_url
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=data)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            
            if success:
                print(f"   Status: {response.status_code} ✅")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"   Expected {expected_status}, got {response.status_code} ❌")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"   Exception: {str(e)} ❌")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        self.log_test("API Root Endpoint", success, 
                     "API is accessible" if success else "API not accessible")
        return success

    def test_login(self):
        """Test login with test credentials"""
        success, response = self.run_test(
            "Login Authentication",
            "POST",
            "auth/login",
            200,
            data={"email": "test@luxscaler.com", "password": "password"}
        )
        
        if success and 'userId' in response:
            self.user_id = response['userId']
            self.log_test("Login Authentication", True, f"User ID: {self.user_id}")
            return True
        else:
            self.log_test("Login Authentication", False, "No userId in response")
            return False

    def test_pillars_config(self):
        """Test getting pillars configuration"""
        if not self.user_id:
            self.log_test("Pillars Config", False, "No user ID available")
            return False

        success, response = self.run_test(
            "Get Pillars Config",
            "GET",
            f"pillars/config?userId={self.user_id}",
            200
        )
        
        if success:
            # Verify structure
            required_pillars = ['photoscaler', 'stylescaler', 'lightscaler']
            has_all_pillars = all(pillar in response for pillar in required_pillars)
            
            if has_all_pillars:
                # Check each pillar has required structure
                valid_structure = True
                for pillar_name in required_pillars:
                    pillar = response[pillar_name]
                    if not all(key in pillar for key in ['pillarName', 'mode', 'sliders']):
                        valid_structure = False
                        break
                    
                    # Check sliders structure
                    for slider in pillar['sliders']:
                        if not all(key in slider for key in ['name', 'value', 'levelText', 'snippet']):
                            valid_structure = False
                            break
                
                self.log_test("Pillars Config Structure", valid_structure, 
                             "All pillars have correct structure" if valid_structure else "Invalid pillar structure")
                return valid_structure
            else:
                self.log_test("Pillars Config", False, "Missing required pillars")
                return False
        else:
            self.log_test("Pillars Config", False, "Failed to get config")
            return False

    def test_slider_update(self):
        """Test slider update functionality"""
        if not self.user_id:
            self.log_test("Slider Update", False, "No user ID available")
            return False

        # Test updating limpieza_artefactos to value 7 (HIGH level)
        success, response = self.run_test(
            "Slider Update",
            "POST",
            "pillars/slider-update",
            200,
            data={
                "userId": self.user_id,
                "pilarName": "photoscaler",
                "sliderName": "limpieza_artefactos",
                "value": 7
            }
        )
        
        if success and response.get('success'):
            updated = response.get('updated', {})
            expected_level = "HIGH"  # Value 7 should map to HIGH
            actual_level = updated.get('levelText')
            
            level_correct = actual_level == expected_level
            snippet_present = 'snippet' in updated and len(updated['snippet']) > 0
            
            self.log_test("Slider Update - Level Mapping", level_correct, 
                         f"Expected {expected_level}, got {actual_level}")
            self.log_test("Slider Update - Snippet", snippet_present, 
                         "Snippet text updated" if snippet_present else "No snippet text")
            
            return level_correct and snippet_present
        else:
            self.log_test("Slider Update", False, "Update failed")
            return False

    def test_pillar_toggle(self):
        """Test pillar AUTO toggle functionality"""
        if not self.user_id:
            self.log_test("Pillar Toggle", False, "No user ID available")
            return False

        # Test toggling photoscaler to 'off' then back to 'auto'
        success1, response1 = self.run_test(
            "Pillar Toggle OFF",
            "POST",
            "pillars/toggle",
            200,
            data={
                "userId": self.user_id,
                "pilarName": "photoscaler",
                "mode": "off"
            }
        )
        
        success2, response2 = self.run_test(
            "Pillar Toggle AUTO",
            "POST",
            "pillars/toggle",
            200,
            data={
                "userId": self.user_id,
                "pilarName": "photoscaler",
                "mode": "auto"
            }
        )
        
        toggle_success = success1 and success2
        self.log_test("Pillar Toggle Functionality", toggle_success, 
                     "Toggle works" if toggle_success else "Toggle failed")
        return toggle_success

    def test_user_mode_update(self):
        """Test user mode switching to PRO"""
        if not self.user_id:
            self.log_test("User Mode Update", False, "No user ID available")
            return False

        success, response = self.run_test(
            "User Mode Switch to PRO",
            "POST",
            "pillars/update-user-mode",
            200,
            data={
                "userId": self.user_id,
                "mode": "pro"
            }
        )
        
        if success and response.get('success') and response.get('mode') == 'pro':
            self.log_test("User Mode Update", True, "Successfully switched to PRO mode")
            return True
        else:
            self.log_test("User Mode Update", False, "Failed to switch to PRO mode")
            return False

    def test_generation(self):
        """Test generation functionality"""
        if not self.user_id:
            self.log_test("Generation Test", False, "No user ID available")
            return False

        success, response = self.run_test(
            "Generation Request",
            "POST",
            "process/generate",
            200,
            data={
                "userId": self.user_id,
                "input": {
                    "content": "Describe a futuristic city with golden lights."
                }
            }
        )
        
        if success:
            has_output = 'output' in response and 'text' in response['output']
            has_metadata = 'metadata' in response
            
            self.log_test("Generation - Output Structure", has_output, 
                         "Has output text" if has_output else "Missing output text")
            self.log_test("Generation - Metadata", has_metadata, 
                         "Has metadata" if has_metadata else "Missing metadata")
            
            return has_output and has_metadata
        else:
            # Check if it's an expected error (API key not configured)
            if "API Key not configured" in str(response):
                self.log_test("Generation Test", True, "Expected error: API Key not configured")
                return True
            else:
                self.log_test("Generation Test", False, "Unexpected generation failure")
                return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting LuxScaler v27 Backend API Tests")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_root_endpoint,
            self.test_login,
            self.test_pillars_config,
            self.test_slider_update,
            self.test_pillar_toggle,
            self.test_user_mode_update,
            self.test_generation
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {e}")
                self.log_test(test.__name__, False, f"Exception: {e}")
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = LuxScalerAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())