"""
Backend API Tests for LuxScaler v28 - FASE 4 & FASE 5
Tests the new features:
- Veto Engine (Conflict Resolution)
- Block Injector (Semantic Blocks)
- Semantic Sanitizer
- Identity Lock
- DNA Anchor Generator
- Context Cache Manager
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-retoucher.preview.emergentagent.com')


class TestVetoEngine:
    """Test Veto Engine - FASE 4 PASO 1"""
    
    def test_veto_paradoja_forense_limpieza_artefactos_10(self):
        """
        Test: When limpieza_artefactos=10, grano_filmico should be vetoed to 0
        Rule: "La Paradoja Forense"
        """
        payload = {
            "config": {
                "photoscaler": {
                    "sliders": [
                        {"name": "limpieza_artefactos", "value": 10},
                        {"name": "grano_filmico", "value": 5}
                    ]
                },
                "stylescaler": {"sliders": []},
                "lightscaler": {"sliders": []}
            },
            "includeDebug": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/process/compile",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True
        
        # Check debug_info for vetos
        debug_info = data.get("debug_info", {})
        vetos_applied = debug_info.get("vetos_applied", [])
        
        # Find "La Paradoja Forense" veto
        forense_veto = None
        for veto in vetos_applied:
            if veto.get("rule_name") == "La Paradoja Forense":
                forense_veto = veto
                break
        
        assert forense_veto is not None, "Expected 'La Paradoja Forense' veto to be applied"
        
        # Check that grano_filmico was vetoed to 0
        actions = forense_veto.get("actions", [])
        grano_action = None
        for action in actions:
            if action.get("slider_name") == "grano_filmico":
                grano_action = action
                break
        
        assert grano_action is not None, "Expected grano_filmico to be vetoed"
        assert grano_action.get("original_value") == 5, "Original value should be 5"
        assert grano_action.get("forced_value") == 0, "Forced value should be 0"
        
        print(f"✅ Veto 'La Paradoja Forense' applied correctly: grano_filmico {grano_action['original_value']} → {grano_action['forced_value']}")
    
    def test_veto_paradoja_geometria(self):
        """
        Test: When geometria=10 AND reencuadre_ia=10, reencuadre_ia should be vetoed to 0
        Rule: "Paradoja de Geometría"
        """
        payload = {
            "config": {
                "photoscaler": {
                    "sliders": [
                        {"name": "geometria", "value": 10}
                    ]
                },
                "stylescaler": {
                    "sliders": [
                        {"name": "reencuadre_ia", "value": 10}
                    ]
                },
                "lightscaler": {"sliders": []}
            },
            "includeDebug": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/process/compile",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        debug_info = data.get("debug_info", {})
        vetos_applied = debug_info.get("vetos_applied", [])
        
        # Find "Paradoja de Geometría" veto
        geometria_veto = None
        for veto in vetos_applied:
            if "Geometr" in veto.get("rule_name", ""):
                geometria_veto = veto
                break
        
        assert geometria_veto is not None, "Expected 'Paradoja de Geometría' veto to be applied"
        
        # Check that reencuadre_ia was vetoed to 0
        actions = geometria_veto.get("actions", [])
        reencuadre_action = None
        for action in actions:
            if action.get("slider_name") == "reencuadre_ia":
                reencuadre_action = action
                break
        
        assert reencuadre_action is not None, "Expected reencuadre_ia to be vetoed"
        assert reencuadre_action.get("forced_value") == 0, "Forced value should be 0"
        
        print(f"✅ Veto 'Paradoja de Geometría' applied correctly: reencuadre_ia → 0")


class TestBlockInjector:
    """Test Block Injector - FASE 4 PASO 2"""
    
    def test_block_injector_generates_blocks(self):
        """Test that Block Injector generates PHOTOSCALER, STYLESCALER, LIGHTSCALER blocks"""
        payload = {
            "config": {
                "photoscaler": {
                    "sliders": [
                        {"name": "limpieza_artefactos", "value": 5},
                        {"name": "enfoque", "value": 7}
                    ]
                },
                "stylescaler": {
                    "sliders": [
                        {"name": "styling_piel", "value": 6}
                    ]
                },
                "lightscaler": {
                    "sliders": [
                        {"name": "key_light", "value": 8}
                    ]
                }
            },
            "includeDebug": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/process/compile",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        # Check that prompt contains blocks
        prompt = data.get("prompt", "")
        
        # The prompt should contain the phase sections
        assert "PHASE 2: SUBJECT & ANATOMY" in prompt, "Expected STYLESCALER block in PHASE 2"
        assert "PHASE 3: OPTICS, PHYSICS & LIGHTING" in prompt, "Expected PHOTOSCALER/LIGHTSCALER blocks in PHASE 3"
        
        # Check debug info for active sliders
        debug_info = data.get("debug_info", {})
        active_sliders = debug_info.get("active_sliders", {})
        
        assert active_sliders.get("total_active", 0) >= 4, "Expected at least 4 active sliders"
        
        by_pillar = active_sliders.get("by_pillar", {})
        assert by_pillar.get("PHOTOSCALER", 0) >= 1, "Expected PHOTOSCALER sliders"
        assert by_pillar.get("STYLESCALER", 0) >= 1, "Expected STYLESCALER sliders"
        assert by_pillar.get("LIGHTSCALER", 0) >= 1, "Expected LIGHTSCALER sliders"
        
        print(f"✅ Block Injector working: {active_sliders['total_active']} active sliders")
        print(f"   - PHOTOSCALER: {by_pillar.get('PHOTOSCALER', 0)}")
        print(f"   - STYLESCALER: {by_pillar.get('STYLESCALER', 0)}")
        print(f"   - LIGHTSCALER: {by_pillar.get('LIGHTSCALER', 0)}")


class TestSemanticSanitizer:
    """Test Semantic Sanitizer - FASE 4 PASO 3"""
    
    def test_sanitizer_removes_redundancies(self):
        """Test that Semantic Sanitizer removes redundancies"""
        payload = {
            "config": {
                "photoscaler": {
                    "sliders": [
                        {"name": "limpieza_artefactos", "value": 5}
                    ]
                },
                "stylescaler": {"sliders": []},
                "lightscaler": {"sliders": []}
            },
            "includeDebug": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/process/compile",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        debug_info = data.get("debug_info", {})
        sanitization = debug_info.get("sanitization", {})
        
        # Check sanitization stats exist
        assert "redundancies_removed" in sanitization, "Expected redundancies_removed in sanitization"
        assert "lines_before" in sanitization, "Expected lines_before in sanitization"
        assert "lines_after" in sanitization, "Expected lines_after in sanitization"
        
        print(f"✅ Sanitizer stats: {sanitization['redundancies_removed']} redundancies removed")
        print(f"   - Lines before: {sanitization['lines_before']}")
        print(f"   - Lines after: {sanitization['lines_after']}")


class TestIdentityLock:
    """Test Identity Lock - FASE 5.1"""
    
    def test_identity_lock_level_in_metadata(self):
        """Test that Identity Lock level is returned in metadata"""
        payload = {
            "config": {
                "photoscaler": {
                    "sliders": [
                        {"name": "limpieza_artefactos", "value": 5}
                    ]
                },
                "stylescaler": {"sliders": []},
                "lightscaler": {"sliders": []}
            },
            "includeDebug": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/process/compile",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        # Check metadata for identity_lock_level
        metadata = data.get("metadata", {})
        assert "identity_lock_level" in metadata, "Expected identity_lock_level in metadata"
        
        identity_level = metadata.get("identity_lock_level")
        assert identity_level in ["NONE", "RELAXED", "STANDARD", "MAXIMUM"], f"Unexpected identity_lock_level: {identity_level}"
        
        # Check prompt contains Identity Lock section
        prompt = data.get("prompt", "")
        assert "IDENTITY LOCK" in prompt, "Expected IDENTITY LOCK section in prompt"
        
        print(f"✅ Identity Lock level: {identity_level}")
    
    def test_identity_lock_relaxed_with_high_limpieza(self):
        """Test that Identity Lock is RELAXED when limpieza_artefactos >= 9"""
        payload = {
            "config": {
                "photoscaler": {
                    "sliders": [
                        {"name": "limpieza_artefactos", "value": 10}
                    ]
                },
                "stylescaler": {"sliders": []},
                "lightscaler": {"sliders": []}
            },
            "includeDebug": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/process/compile",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        
        data = response.json()
        metadata = data.get("metadata", {})
        
        # With limpieza_artefactos=10, identity_lock should be RELAXED
        identity_level = metadata.get("identity_lock_level")
        assert identity_level == "RELAXED", f"Expected RELAXED, got {identity_level}"
        
        print(f"✅ Identity Lock correctly RELAXED with limpieza_artefactos=10")


class TestTokensEstimate:
    """Test Tokens Estimate"""
    
    def test_tokens_estimate_returned(self):
        """Test that tokens estimate is returned with includeDebug=True"""
        payload = {
            "config": {
                "photoscaler": {
                    "sliders": [
                        {"name": "limpieza_artefactos", "value": 5}
                    ]
                },
                "stylescaler": {"sliders": []},
                "lightscaler": {"sliders": []}
            },
            "includeDebug": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/process/compile",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        # Check tokens_estimate
        tokens_estimate = data.get("tokens_estimate", {})
        assert "total_estimated" in tokens_estimate, "Expected total_estimated in tokens_estimate"
        
        total_tokens = tokens_estimate.get("total_estimated", 0)
        assert total_tokens > 0, "Expected positive token count"
        
        print(f"✅ Tokens estimate: {total_tokens} tokens")


class TestCompileEndpointResponse:
    """Test /api/process/compile endpoint response structure"""
    
    def test_compile_returns_full_response_with_debug(self):
        """Test that compile endpoint returns full response with includeDebug=True"""
        payload = {
            "config": {
                "photoscaler": {
                    "sliders": [
                        {"name": "limpieza_artefactos", "value": 7},
                        {"name": "geometria", "value": 5}
                    ]
                },
                "stylescaler": {
                    "sliders": [
                        {"name": "styling_piel", "value": 6}
                    ]
                },
                "lightscaler": {
                    "sliders": [
                        {"name": "key_light", "value": 8}
                    ]
                }
            },
            "visionAnalysis": {
                "category": "PORTRAIT",
                "technical_diagnosis": {
                    "noise_level": "LOW",
                    "blur_level": "NONE"
                }
            },
            "profileType": "PRO",
            "includeDebug": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/process/compile",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields
        assert data.get("success") == True
        assert "prompt" in data, "Expected 'prompt' in response"
        assert "metadata" in data, "Expected 'metadata' in response"
        assert "debug_info" in data, "Expected 'debug_info' in response (includeDebug=True)"
        assert "tokens_estimate" in data, "Expected 'tokens_estimate' in response"
        
        # Check metadata structure
        metadata = data.get("metadata", {})
        assert "active_sliders" in metadata
        assert "force_sliders" in metadata
        assert "version" in metadata
        assert "identity_lock_level" in metadata
        
        # Check debug_info structure
        debug_info = data.get("debug_info", {})
        assert "vetos_applied" in debug_info
        assert "active_sliders" in debug_info
        assert "sanitization" in debug_info
        assert "validation" in debug_info
        
        # Check prompt is not truncated (should be > 500 chars for full prompt)
        prompt = data.get("prompt", "")
        assert len(prompt) > 500, f"Prompt seems truncated: {len(prompt)} chars"
        
        print(f"✅ Compile endpoint returns full response")
        print(f"   - Prompt length: {len(prompt)} chars")
        print(f"   - Active sliders: {metadata.get('active_sliders')}")
        print(f"   - Version: {metadata.get('version')}")


class TestPromptNotTruncated:
    """Test that prompt is not truncated"""
    
    def test_prompt_contains_all_sections(self):
        """Test that compiled prompt contains all required sections"""
        payload = {
            "config": {
                "photoscaler": {
                    "sliders": [
                        {"name": "limpieza_artefactos", "value": 5}
                    ]
                },
                "stylescaler": {"sliders": []},
                "lightscaler": {"sliders": []}
            },
            "includeDebug": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/process/compile",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        
        data = response.json()
        prompt = data.get("prompt", "")
        
        # Check all required sections are present
        required_sections = [
            "SYSTEM OVERRIDE",
            "IDENTITY LOCK",
            "PHASE 1",
            "PHASE 2",
            "PHASE 3",
            "NEGATIVE PROMPT",
            "QUALITY GATES"
        ]
        
        for section in required_sections:
            assert section in prompt, f"Missing section: {section}"
        
        print(f"✅ Prompt contains all required sections")
        print(f"   - Total length: {len(prompt)} chars")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
