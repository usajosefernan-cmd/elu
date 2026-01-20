#!/usr/bin/env python3
"""
Debug Supabase integration
"""

import asyncio
from backend.services.supabase_service import supabase_db

async def debug_supabase():
    print("🔍 Debugging Supabase Integration")
    
    # Test getting user profile by email
    print("\n1. Testing get_user_profile by email:")
    user_by_email = await supabase_db.get_user_profile("usajosefernan@gmail.com")
    print(f"User by email: {user_by_email}")
    
    if user_by_email:
        user_id = user_by_email.get('id')
        print(f"User ID: {user_id}")
        
        # Test getting user profile by ID
        print(f"\n2. Testing get_user_profile_by_id with ID: {user_id}")
        user_by_id = await supabase_db.get_user_profile_by_id(user_id)
        print(f"User by ID: {user_by_id}")
        
        # Test get_slider_config
        print(f"\n3. Testing get_slider_config with ID: {user_id}")
        config = await supabase_db.get_slider_config(user_id)
        print(f"Slider config: {config}")
        
        # Check if current_config exists
        if config:
            current_config = config.get('current_config')
            print(f"Current config: {current_config}")
        
    else:
        print("❌ User not found by email")

if __name__ == "__main__":
    asyncio.run(debug_supabase())