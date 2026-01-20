import asyncio
from services.prompt_compiler_service import prompt_compiler
from data.snippets import get_default_pillars_config

async def test_compiler():
    print("Testing Prompt Compiler...")
    
    # Get a dummy config
    config = get_default_pillars_config()
    
    # Modify some values to test specific mappings
    config['photoscaler']['sliders'][0]['value'] = 8 # limpieza HIGH
    config['lightscaler']['sliders'][5]['value'] = 10 # contraste FORCE
    
    print("Compiling prompt...")
    prompt = await prompt_compiler.compile_prompt(config, {"semantic_anchors": ["Test Image"]})
    
    print("\n=== GENERATED PROMPT ===")
    print(prompt)
    print("========================")
    
    if "SOURCE: SUPABASE SEMANTIC MAPPINGS" in prompt:
        print("✅ Header check passed")
    else:
        print("❌ Header check failed")

    if "Restoration mode" in prompt: # High cleaning
        print("✅ Mapping check 1 passed")
    
    if "CRUSHED BLACKS" in prompt: # Force contrast
        print("✅ Mapping check 2 passed")

if __name__ == "__main__":
    asyncio.run(test_compiler())
