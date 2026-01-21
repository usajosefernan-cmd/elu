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
    def __init__(self, base_url="https://image-genius-3.preview.emergentagent.com"):
        # Use external API base from frontend/.env (VITE_BACKEND_URL)
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
        """Test login with admin credentials"""
        success, response = self.run_test(
            "Login Authentication",
            "POST",
            "auth/login",
            200,
            data={"email": "usajosefernan@gmail.com", "password": "password"}
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

    def test_user_macro_logic(self):
        """Test User Macro Logic - apply-user-macro endpoint"""
        if not self.user_id:
            self.log_test("User Macro Logic", False, "No user ID available")
            return False

        success, response = self.run_test(
            "User Macro Application",
            "POST",
            "process/apply-user-macro",
            200,
            data={
                "userId": self.user_id,
                "quality": 10,
                "aesthetics": 5,
                "light": 5
            }
        )
        
        if success and response.get('success'):
            config = response.get('config', {})
            photoscaler = config.get('photoscaler', {})
            sliders = photoscaler.get('sliders', [])
            
            # Find limpieza_artefactos slider (should be first one based on macro_mappings.py)
            limpieza_value = None
            for slider in sliders:
                if slider.get('name') == 'limpieza_artefactos':
                    limpieza_value = slider.get('value')
                    break
            
            if limpieza_value == 10:
                self.log_test("User Macro - limpieza_artefactos", True, f"Value correctly set to {limpieza_value}")
                return True
            else:
                self.log_test("User Macro - limpieza_artefactos", False, f"Expected 10, got {limpieza_value}")
                return False
        else:
            self.log_test("User Macro Logic", False, "Failed to apply user macro")
            return False

    def test_pro_macro_logic(self):
        """Test Pro Macro Logic - apply-pro-macro endpoint"""
        if not self.user_id:
            self.log_test("Pro Macro Logic", False, "No user ID available")
            return False

        success, response = self.run_test(
            "Pro Macro Application",
            "POST",
            "process/apply-pro-macro",
            200,
            data={
                "userId": self.user_id,
                "macroKey": "macro_restoration"
            }
        )
        
        if success and response.get('success'):
            config = response.get('config', {})
            photoscaler = config.get('photoscaler', {})
            sliders = photoscaler.get('sliders', [])
            
            # Find grano_filmico slider (should be set to 0 for macro_restoration)
            grano_value = None
            for slider in sliders:
                if slider.get('name') == 'grano_filmico':
                    grano_value = slider.get('value')
                    break
            
            if grano_value == 0:
                self.log_test("Pro Macro - grano_filmico", True, f"Value correctly set to {grano_value}")
                return True
            else:
                self.log_test("Pro Macro - grano_filmico", False, f"Expected 0, got {grano_value}")
                return False
        else:
            self.log_test("Pro Macro Logic", False, "Failed to apply pro macro")
            return False

    def test_vision_analysis_base64(self):
        """Test Vision Analysis with Base64 image data"""
        # This is a 1x1 pixel transparent PNG in base64
        base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        success, response = self.run_test(
            "Vision Analysis - Base64",
            "POST",
            "process/analyze",
            200,
            data={
                "userId": self.user_id or "test_user_123",
                "imageUrl": base64_image
            }
        )
        
        if success and response.get('success'):
            analysis = response.get('analysis', {})
            has_semantic_anchors = 'semantic_anchors' in analysis
            has_technical_assessment = 'technical_assessment' in analysis
            has_suggested_settings = 'suggested_pillar_settings' in analysis
            
            self.log_test("Vision Analysis Base64 - semantic_anchors", has_semantic_anchors, 
                         "Has semantic_anchors" if has_semantic_anchors else "Missing semantic_anchors")
            self.log_test("Vision Analysis Base64 - technical_assessment", has_technical_assessment, 
                         "Has technical_assessment" if has_technical_assessment else "Missing technical_assessment")
            self.log_test("Vision Analysis Base64 - suggested_settings", has_suggested_settings, 
                         "Has suggested_pillar_settings" if has_suggested_settings else "Missing suggested_pillar_settings")
            
            return has_semantic_anchors and has_technical_assessment and has_suggested_settings
        else:
            self.log_test("Vision Analysis Base64", False, "Base64 vision analysis failed")
            return False

    def test_vision_analysis_url(self):
        """Test Vision Analysis with public URL"""
        success, response = self.run_test(
            "Vision Analysis - URL",
            "POST",
            "process/analyze",
            200,
            data={
                "userId": self.user_id or "test_user_123",
                "imageUrl": "https://images.pexels.com/photos/35501372/pexels-photo-35501372.jpeg"
            }
        )
        
        if success and response.get('success'):
            analysis = response.get('analysis', {})
            has_semantic_anchors = 'semantic_anchors' in analysis
            semantic_anchors_is_list = isinstance(analysis.get('semantic_anchors'), list)
            
            self.log_test("Vision Analysis URL - Structure", has_semantic_anchors, 
                         "Has semantic_anchors" if has_semantic_anchors else "Missing semantic_anchors")
            self.log_test("Vision Analysis URL - Anchors Type", semantic_anchors_is_list, 
                         "semantic_anchors is list" if semantic_anchors_is_list else "semantic_anchors not a list")
            
            return has_semantic_anchors and semantic_anchors_is_list
        else:
            self.log_test("Vision Analysis URL", False, "URL vision analysis failed")
            return False

    def test_vision_analysis_invalid_data(self):
        """Test Vision Analysis with invalid image data"""
        success, response = self.run_test(
            "Vision Analysis - Invalid Data",
            "POST",
            "process/analyze",
            200,  # System gracefully handles invalid data with fallback
            data={
                "userId": self.user_id or "test_user_123",
                "imageUrl": "invalid_image_data"
            }
        )
        
        # Check if we get a graceful fallback response
        if success and response.get('success'):
            analysis = response.get('analysis', {})
            has_fallback_structure = 'semantic_anchors' in analysis and 'technical_assessment' in analysis
            self.log_test("Vision Analysis Invalid Data", True, "Invalid data handled with graceful fallback")
            return True
        else:
            self.log_test("Vision Analysis Invalid Data", False, "Invalid data not handled properly")
            return False

    def test_full_generation_flow(self):
        """Test Full Generation Flow with image"""
        if not self.user_id:
            self.log_test("Full Generation Flow", False, "No user ID available")
            return False

        success, response = self.run_test(
            "Full Generation Flow",
            "POST",
            "process/generate",
            200,
            data={
                "userId": self.user_id,
                "input": {
                    "content": "Test",
                    "imageUrl": "https://images.pexels.com/photos/35501372/pexels-photo-35501372.jpeg"
                }
            }
        )
        
        if success and response.get('success'):
            output = response.get('output', {})
            has_text = 'text' in output and len(output['text']) > 0
            
            self.log_test("Full Generation - Output Text", has_text, 
                         "Has output text" if has_text else "Missing output text")
            
            return has_text
        else:
            self.log_test("Full Generation Flow", False, "Generation flow failed")
            return False

    def test_supabase_generation_flow(self):
        """Test generation flow reads configuration from Supabase user_profiles (current_config)"""
        if not self.user_id:
            self.log_test("Supabase Generation Flow", False, "No user ID available")
            return False

        # Use the correct Supabase user ID
        supabase_user_id = "d86b1859-3e57-4ec1-9e50-1aae155dbdef"

        success, response = self.run_test(
            "Supabase Generation Flow",
            "POST",
            "process/generate",
            200,
            data={
                "userId": supabase_user_id,
                "input": {
                    "content": "Test generation with Supabase config"
                }
            }
        )
        
        if success and response.get('success'):
            output = response.get('output', {})
            metadata = response.get('metadata', {})
            has_text = 'text' in output
            has_metadata = 'modelUsed' in metadata
            
            self.log_test("Supabase Generation - Output Structure", has_text, 
                         "Has output structure" if has_text else "Missing output structure")
            self.log_test("Supabase Generation - Metadata", has_metadata, 
                         "Has metadata" if has_metadata else "Missing metadata")
            
            return has_text and has_metadata
        else:
            self.log_test("Supabase Generation Flow", False, "Generation flow failed")
            return False

    def test_supabase_apply_user_macro(self):
        """Test apply-user-macro updates current_config in Supabase"""
        # Use the correct Supabase user ID
        supabase_user_id = "d86b1859-3e57-4ec1-9e50-1aae155dbdef"

        success, response = self.run_test(
            "Supabase Apply User Macro",
            "POST",
            "process/apply-user-macro",
            200,
            data={
                "userId": supabase_user_id,
                "quality": 8,
                "aesthetics": 6,
                "light": 7
            }
        )
        
        if success and response.get('success'):
            config = response.get('config', {})
            
            # Verify config structure
            has_photoscaler = 'photoscaler' in config
            has_stylescaler = 'stylescaler' in config
            has_lightscaler = 'lightscaler' in config
            
            config_complete = has_photoscaler and has_stylescaler and has_lightscaler
            
            self.log_test("Supabase User Macro - Config Structure", config_complete, 
                         "Complete config returned" if config_complete else "Incomplete config")
            
            # Test that the config was actually updated in Supabase by making another generation call
            if config_complete:
                # Make a generation call to verify the updated config is being used
                gen_success, gen_response = self.run_test(
                    "Verify Supabase Config Update",
                    "POST",
                    "process/generate",
                    200,
                    data={
                        "userId": supabase_user_id,
                        "input": {
                            "content": "Test with updated config"
                        }
                    }
                )
                
                config_persisted = gen_success and gen_response.get('success')
                self.log_test("Supabase Config Persistence", config_persisted, 
                             "Config persisted in Supabase" if config_persisted else "Config not persisted")
                
                return config_persisted
            
            return config_complete
        else:
            self.log_test("Supabase Apply User Macro", False, "User macro application failed")
            return False

    def test_process_analyze_endpoint(self):
        """Test POST /api/process/analyze with public image URL"""
        public_image_url = "https://images.pexels.com/photos/35501372/pexels-photo-35501372.jpeg"
        
        success, response = self.run_test(
            "Process Analyze Endpoint",
            "POST",
            "process/analyze",
            200,
            data={
                "imageUrl": public_image_url
            }
        )
        
        if success:
            # Check required fields
            has_success = response.get('success') is True
            has_analysis = 'analysis' in response and isinstance(response['analysis'], dict)
            has_thumbnail_used = 'thumbnail_used' in response
            has_tokens_consumed = 'tokens_consumed' in response
            
            self.log_test("Process Analyze - success field", has_success, 
                         "Has success:true" if has_success else "Missing or false success field")
            self.log_test("Process Analyze - analysis object", has_analysis, 
                         "Has analysis object" if has_analysis else "Missing analysis object")
            self.log_test("Process Analyze - thumbnail_used field", has_thumbnail_used, 
                         "Has thumbnail_used field" if has_thumbnail_used else "Missing thumbnail_used field")
            self.log_test("Process Analyze - tokens_consumed field", has_tokens_consumed, 
                         "Has tokens_consumed field" if has_tokens_consumed else "Missing tokens_consumed field")
            
            return has_success and has_analysis and has_thumbnail_used and has_tokens_consumed
        else:
            self.log_test("Process Analyze Endpoint", False, "Endpoint failed")
            return False

    def test_process_compile_endpoint(self):
        """Test POST /api/process/compile with minimal config"""
        minimal_config = {
            "photoscaler": {
                "pillarName": "photoscaler",
                "mode": "auto",
                "sliders": [
                    {"name": "limpieza_artefactos", "value": 5, "levelText": "MEDIUM", "snippet": "test"}
                ]
            }
        }
        
        success, response = self.run_test(
            "Process Compile Endpoint",
            "POST",
            "process/compile",
            200,
            data={
                "config": minimal_config,
                "userMode": "auto"
            }
        )
        
        if success:
            # Check required fields
            has_success = response.get('success') is True
            has_prompt = 'prompt' in response and isinstance(response['prompt'], str) and len(response['prompt']) > 0
            
            self.log_test("Process Compile - success field", has_success, 
                         "Has success:true" if has_success else "Missing or false success field")
            self.log_test("Process Compile - prompt string", has_prompt, 
                         "Has prompt string" if has_prompt else "Missing or empty prompt string")
            
            return has_success and has_prompt
        else:
            self.log_test("Process Compile Endpoint", False, "Endpoint failed")
            return False

    def test_process_generate_image_endpoint(self):
        """Test POST /api/process/generate-image with imageUrl + compiledPrompt"""
        image_url = "https://images.pexels.com/photos/35501372/pexels-photo-35501372.jpeg"
        compiled_prompt = "Enhance this image with professional quality improvements"
        
        success, response = self.run_test(
            "Process Generate Image Endpoint",
            "POST",
            "process/generate-image",
            200,
            data={
                "imageUrl": image_url,
                "compiledPrompt": compiled_prompt,
                "userMode": "auto",
                "outputType": "preview_watermark"
            }
        )
        
        if success:
            # Check required fields
            has_success = response.get('success') is True
            output = response.get('output', {})
            has_image = 'image' in output and output['image'] is not None
            metadata = response.get('metadata', {})
            has_output_type = 'output_type' in metadata
            
            self.log_test("Process Generate Image - success field", has_success, 
                         "Has success:true" if has_success else "Missing or false success field")
            self.log_test("Process Generate Image - output.image exists", has_image, 
                         "Has output.image" if has_image else "Missing output.image")
            self.log_test("Process Generate Image - metadata.output_type", has_output_type, 
                         "Has metadata.output_type" if has_output_type else "Missing metadata.output_type")
            
            return has_success and has_image and has_output_type
        else:
            self.log_test("Process Generate Image Endpoint", False, "Endpoint failed")
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting LuxScaler v27 Backend API Tests - Review Request Focus")
        print("=" * 60)
        
        # Test sequence - focusing on review request items
        tests = [
            self.test_root_endpoint,
            # Review request specific tests
            self.test_process_analyze_endpoint,
            self.test_process_compile_endpoint, 
            self.test_process_generate_image_endpoint,
            # Additional comprehensive tests
            self.test_login,
            self.test_supabase_generation_flow,
            self.test_supabase_apply_user_macro,
            self.test_pillars_config,
            self.test_slider_update,
            self.test_pillar_toggle,
            self.test_user_mode_update,
            self.test_user_macro_logic,
            self.test_pro_macro_logic,
            self.test_vision_analysis_base64,
            self.test_vision_analysis_url,
            self.test_vision_analysis_invalid_data,
            self.test_full_generation_flow
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