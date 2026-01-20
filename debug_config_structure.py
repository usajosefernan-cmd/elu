#!/usr/bin/env python3
"""
Debug config structure
"""

import asyncio
from backend.services.supabase_service import supabase_db

async def debug_config_structure():
    print("🔍 Debugging config structure")
    
    supabase_user_id = "d86b1859-3e57-4ec1-9e50-1aae155dbdef"
    
    # Get the config
    config = await supabase_db.get_slider_config(supabase_user_id)
    print(f"Full config: {config}")
    
    if config:
        current_config = config.get('current_config')
        print(f"\nCurrent config: {current_config}")
        
        if current_config:
            print(f"\nCurrent config keys: {current_config.keys()}")
            if 'photoscaler' in current_config:
                print(f"Photoscaler structure: {current_config['photoscaler']}")

if __name__ == "__main__":
    asyncio.run(debug_config_structure())