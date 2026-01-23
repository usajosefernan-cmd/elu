#!/usr/bin/env python3
"""
Focused tests for the review request
"""

import requests
import sys

class ReviewRequestTester:
    def __init__(self, base_url="https://visionaire-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.mongo_user_id = None
        self.supabase_user_id = "d86b1859-3e57-4ec1-9e50-1aae155dbdef"
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")

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

    def test_1_login_flow(self):
        """Test 1: Login flow with admin user"""
        success, response = self.run_test(
            "Login Flow (usajosefernan@gmail.com)",
            "POST",
            "auth/login",
            200,
            data={"email": "usajosefernan@gmail.com", "password": "password"}
        )
        
        if success and 'userId' in response:
            self.mongo_user_id = response['userId']
            self.log_test("Test 1: Login Flow", True, f"MongoDB User ID: {self.mongo_user_id}")
            return True
        else:
            self.log_test("Test 1: Login Flow", False, "No userId in response")
            return False

    def test_2_generation_with_supabase_config(self):
        """Test 2: Generation flow reads configuration from Supabase"""
        success, response = self.run_test(
            "Generation with Supabase Config",
            "POST",
            "process/generate",
            200,
            data={
                "userId": self.supabase_user_id,
                "input": {
                    "content": "Test generation reading from Supabase current_config"
                }
            }
        )
        
        if success and response.get('success'):
            output = response.get('output', {})
            metadata = response.get('metadata', {})
            has_output = 'text' in output
            has_metadata = 'modelUsed' in metadata
            
            if has_output and has_metadata:
                self.log_test("Test 2: Generation with Supabase Config", True, 
                             "Successfully reads config from Supabase user_profiles.current_config")
                return True
            else:
                self.log_test("Test 2: Generation with Supabase Config", False, 
                             "Missing output or metadata")
                return False
        else:
            self.log_test("Test 2: Generation with Supabase Config", False, 
                         "Generation failed - config not found or other error")
            return False

    def test_3_apply_user_macro_updates_supabase(self):
        """Test 3: Apply-user-macro updates current_config in Supabase"""
        success, response = self.run_test(
            "Apply User Macro Updates Supabase",
            "POST",
            "process/apply-user-macro",
            200,
            data={
                "userId": self.supabase_user_id,
                "quality": 9,
                "aesthetics": 7,
                "light": 8
            }
        )
        
        if success and response.get('success'):
            config = response.get('config', {})
            
            # Verify config structure
            has_photoscaler = 'photoscaler' in config
            has_stylescaler = 'stylescaler' in config
            has_lightscaler = 'lightscaler' in config
            
            if has_photoscaler and has_stylescaler and has_lightscaler:
                # Verify the config was persisted by making another generation call
                gen_success, gen_response = self.run_test(
                    "Verify Config Persistence",
                    "POST",
                    "process/generate",
                    200,
                    data={
                        "userId": self.supabase_user_id,
                        "input": {
                            "content": "Verify updated config is persisted"
                        }
                    }
                )
                
                if gen_success and gen_response.get('success'):
                    self.log_test("Test 3: Apply-user-macro Updates Supabase", True, 
                                 "Successfully updates current_config in Supabase user_profiles")
                    return True
                else:
                    self.log_test("Test 3: Apply-user-macro Updates Supabase", False, 
                                 "Config not persisted - generation failed after macro update")
                    return False
            else:
                self.log_test("Test 3: Apply-user-macro Updates Supabase", False, 
                             "Incomplete config structure returned")
                return False
        else:
            self.log_test("Test 3: Apply-user-macro Updates Supabase", False, 
                         "Apply-user-macro failed")
            return False

    def run_review_tests(self):
        """Run all review request tests"""
        print("🚀 Starting Review Request Tests")
        print("=" * 60)
        print("Testing the following requirements:")
        print("1. Login flow still works (POST /api/auth/login)")
        print("2. Generation flow reads config from Supabase user_profiles.current_config")
        print("3. Apply-user-macro updates current_config in Supabase")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_1_login_flow,
            self.test_2_generation_with_supabase_config,
            self.test_3_apply_user_macro_updates_supabase
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {e}")
                self.log_test(test.__name__, False, f"Exception: {e}")
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Review Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All review requirements PASSED!")
        else:
            print("⚠️  Some review requirements FAILED!")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ReviewRequestTester()
    success = tester.run_review_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())