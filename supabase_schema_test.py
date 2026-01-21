#!/usr/bin/env python3
"""
Supabase Schema Verification Test - v28.1 Review Request
Tests schema changes executed via Management API:
1. Verify slider_semantic_mappings for specific keys reflect new v28.1 snippet texts
2. Verify generations and variations tables exist
3. Verify RLS is enabled on generations/variations
"""

import json
import requests
import sys
from supabase import create_client, Client

class SupabaseSchemaVerifier:
    def __init__(self):
        # Load credentials from BBLA/CREDENTIALS.json
        with open('/app/BBLA/CREDENTIALS.json', 'r') as f:
            creds = json.load(f)
        
        self.project_url = creds['project_url']
        self.project_ref = creds['project_ref']
        self.service_role_key = creds['keys']['service_role_key']
        
        # Extract PAT from the credentials file (appears to be at the end)
        creds_text = open('/app/BBLA/CREDENTIALS.json', 'r').read()
        # Look for PAT pattern in the file
        lines = creds_text.split('\n')
        self.pat = None
        for line in lines:
            if line.startswith('sbp_'):
                self.pat = line.strip()
                break
        
        if not self.pat:
            print("⚠️  PAT not found in credentials file, using fallback")
            self.pat = "sbp_bef67551661ef1dd4ebb9966e0c4924a3f922308"  # From the file
        
        # Initialize Supabase client
        self.client = create_client(self.project_url, self.service_role_key)
        
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

    def test_slider_semantic_mappings_v28_1(self):
        """Test slider_semantic_mappings for specific keys with v28.1 snippet texts"""
        print("\n🔍 Testing slider_semantic_mappings for v28.1 snippet texts...")
        
        # Keys to verify from review request
        test_keys = [
            ('photoscaler', 'limpieza_artefactos'),
            ('photoscaler', 'geometria'),
            ('stylescaler', 'look_cine'),
            ('lightscaler', 'key_light')
        ]
        
        try:
            # Query slider_semantic_mappings table
            response = self.client.table("slider_semantic_mappings").select("*").execute()
            
            if not response.data:
                self.log_test("Slider Semantic Mappings - Table Exists", False, "Table exists but no data found")
                return False
            
            mappings = {(row['pillar_name'], row['slider_name']): row for row in response.data}
            
            all_keys_found = True
            v28_1_format_correct = True
            
            for pillar, slider in test_keys:
                key = (pillar, slider)
                if key in mappings:
                    mapping = mappings[key]
                    
                    # Check if v28.1 format is present (LOW/MED/HIGH/FORCE structure)
                    has_low = mapping.get('instruction_low') is not None
                    has_med = mapping.get('instruction_med') is not None  
                    has_high = mapping.get('instruction_high') is not None
                    has_force = mapping.get('instruction_force') is not None
                    
                    if has_low and has_med and has_high and has_force:
                        self.log_test(f"Slider Mapping - {pillar}.{slider} v28.1 Format", True, 
                                    f"Has LOW/MED/HIGH/FORCE instructions")
                        
                        # Verify content matches expected v28.1 patterns
                        low_text = mapping.get('instruction_low', '')
                        high_text = mapping.get('instruction_high', '')
                        force_text = mapping.get('instruction_force', '')
                        
                        # Check for expected patterns in FORCE level (should be ALL CAPS intensive)
                        force_is_intensive = force_text and force_text.isupper() and len(force_text) > 20
                        
                        self.log_test(f"Slider Mapping - {pillar}.{slider} FORCE Intensity", force_is_intensive,
                                    f"FORCE text: {force_text[:50]}..." if force_text else "No FORCE text")
                    else:
                        self.log_test(f"Slider Mapping - {pillar}.{slider} v28.1 Format", False,
                                    f"Missing instructions: LOW={has_low}, MED={has_med}, HIGH={has_high}, FORCE={has_force}")
                        v28_1_format_correct = False
                else:
                    self.log_test(f"Slider Mapping - {pillar}.{slider} Exists", False, "Key not found in mappings")
                    all_keys_found = False
            
            self.log_test("Slider Semantic Mappings - All Test Keys Found", all_keys_found,
                         f"Found {len([k for k in test_keys if k in mappings])}/{len(test_keys)} keys")
            
            return all_keys_found and v28_1_format_correct
            
        except Exception as e:
            self.log_test("Slider Semantic Mappings - Query", False, f"Exception: {str(e)}")
            return False

    def test_generations_table_exists(self):
        """Test that generations table exists"""
        print("\n🔍 Testing generations table existence...")
        
        try:
            # Try to query the generations table
            response = self.client.table("generations").select("id").limit(1).execute()
            
            # If we get here without exception, table exists
            self.log_test("Generations Table - Exists", True, "Table accessible via PostgREST")
            return True
            
        except Exception as e:
            error_msg = str(e).lower()
            if 'relation' in error_msg and 'does not exist' in error_msg:
                self.log_test("Generations Table - Exists", False, "Table does not exist")
            else:
                self.log_test("Generations Table - Exists", False, f"Query error: {str(e)}")
            return False

    def test_variations_table_exists(self):
        """Test that variations table exists"""
        print("\n🔍 Testing variations table existence...")
        
        try:
            # Try to query the variations table
            response = self.client.table("variations").select("id").limit(1).execute()
            
            # If we get here without exception, table exists
            self.log_test("Variations Table - Exists", True, "Table accessible via PostgREST")
            return True
            
        except Exception as e:
            error_msg = str(e).lower()
            if 'relation' in error_msg and 'does not exist' in error_msg:
                self.log_test("Variations Table - Exists", False, "Table does not exist")
            else:
                self.log_test("Variations Table - Exists", False, f"Query error: {str(e)}")
            return False

    def test_rls_enabled_via_management_api(self):
        """Test RLS is enabled on generations/variations using Management API"""
        print("\n🔍 Testing RLS status via Management API...")
        
        if not self.pat:
            self.log_test("RLS Check - Management API", False, "No PAT available for Management API")
            return False
        
        try:
            # Use Supabase Management API to check RLS status
            headers = {
                "Authorization": f"Bearer {self.pat}",
                "Content-Type": "application/json"
            }
            
            # Check RLS for generations table
            url = f"https://api.supabase.com/v1/projects/{self.project_ref}/database/tables"
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                self.log_test("RLS Check - Management API Access", False, 
                             f"API returned {response.status_code}: {response.text}")
                return False
            
            tables = response.json()
            
            # Find generations and variations tables
            generations_table = None
            variations_table = None
            
            for table in tables:
                if table.get('name') == 'generations':
                    generations_table = table
                elif table.get('name') == 'variations':
                    variations_table = table
            
            # Check RLS status
            generations_rls = generations_table and generations_table.get('rls_enabled', False) if generations_table else None
            variations_rls = variations_table and variations_table.get('rls_enabled', False) if variations_table else None
            
            if generations_table:
                self.log_test("RLS - Generations Table Enabled", generations_rls, 
                             f"RLS enabled: {generations_rls}")
            else:
                self.log_test("RLS - Generations Table Found", False, "Table not found in API response")
            
            if variations_table:
                self.log_test("RLS - Variations Table Enabled", variations_rls,
                             f"RLS enabled: {variations_rls}")
            else:
                self.log_test("RLS - Variations Table Found", False, "Table not found in API response")
            
            return (generations_table and generations_rls) and (variations_table and variations_rls)
            
        except Exception as e:
            self.log_test("RLS Check - Management API", False, f"Exception: {str(e)}")
            return False

    def test_database_connection(self):
        """Test basic database connection"""
        print("\n🔍 Testing Supabase database connection...")
        
        try:
            # Try a simple query to test connection
            response = self.client.table("user_profiles").select("id").limit(1).execute()
            self.log_test("Database Connection", True, "Successfully connected to Supabase")
            return True
        except Exception as e:
            self.log_test("Database Connection", False, f"Connection failed: {str(e)}")
            return False

    def test_schema_version_info(self):
        """Check if there's any schema version information"""
        print("\n🔍 Checking schema version information...")
        
        try:
            # Check if there's a schema_migrations or version table
            tables_to_check = ['schema_migrations', 'schema_version', 'migrations']
            
            for table_name in tables_to_check:
                try:
                    response = self.client.table(table_name).select("*").limit(5).execute()
                    if response.data:
                        self.log_test(f"Schema Info - {table_name} Table", True, 
                                     f"Found {len(response.data)} records")
                        return True
                except:
                    continue
            
            self.log_test("Schema Version Info", False, "No schema version tables found")
            return False
            
        except Exception as e:
            self.log_test("Schema Version Info", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all schema verification tests"""
        print("🚀 Starting Supabase Schema Verification Tests - v28.1 Review Request")
        print("=" * 70)
        print(f"Project: {self.project_ref}")
        print(f"URL: {self.project_url}")
        print("=" * 70)
        
        # Test sequence based on review request
        tests = [
            self.test_database_connection,
            self.test_slider_semantic_mappings_v28_1,
            self.test_generations_table_exists,
            self.test_variations_table_exists,
            self.test_rls_enabled_via_management_api,
            self.test_schema_version_info
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {e}")
                self.log_test(test.__name__, False, f"Exception: {e}")
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Schema Verification Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        else:
            print("\n✅ All schema verification tests passed!")
        
        return self.tests_passed == self.tests_run

def main():
    verifier = SupabaseSchemaVerifier()
    success = verifier.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())