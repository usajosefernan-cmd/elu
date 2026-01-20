import os
from supabase import create_client, Client
from pydantic import BaseModel
from typing import Optional, Dict, List
import datetime

class SupabaseService:
    def __init__(self):
        self.url = "https://uxqtxkuldjdvpnojgdsh.supabase.co"
        # Service Role Key for Admin Access
        self.key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cXR4a3VsZGpkdnBub2pnZHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODM0NDcxMiwiZXhwIjoyMDgzOTIwNzEyfQ.oMLuL3u9VWem-fFX95vh4ROljfNG9AWDwq-DFWmxtKg"
        self.client: Client = create_client(self.url, self.key)

    async def get_user_profile(self, email: str):
        try:
            response = self.client.table("user_profiles").select("*").eq("email", email).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Supabase Error (get_user): {e}")
            return None

    async def create_user_profile(self, email: str, user_mode: str = 'user'):
        try:
            data = {"email": email, "user_mode": user_mode}
            response = self.client.table("user_profiles").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Supabase Error (create_user): {e}")
            return None

    async def get_slider_config(self, user_id: str):
        # In v28, config might be derived from Macro/User Mode + semantic mappings
        # But for compatibility, we might store a computed config json or query tables
        # Let's assume we store a 'computed_config' in user_profiles or separate table if needed
        # For now, fetching user profile to get mode
        return await self.get_user_profile_by_id(user_id)

    async def get_user_profile_by_id(self, user_id: str):
        try:
            response = self.client.table("user_profiles").select("*").eq("id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Supabase Error: {e}")
            return None
    async def update_user_config(self, user_id: str, config: dict):
        try:
            self.client.table("user_profiles").update({"current_config": config}).eq("id", user_id).execute()
            return True
        except Exception as e:
            print(f"Supabase Error (update_config): {e}")
            return False

    async def log_job(self, job_data: dict):
        try:
            # Map Mongo-style job data to SQL columns
            row = {
                "user_id": job_data.get('user_id'),
                "mode": "MASTER",
                "status": "completed",
                "input_image_url": job_data.get('input', {}).get('imageUrl'),
                "output_image_url": job_data.get('output_image'), # If uploaded
                "compiled_prompt": job_data.get('master_prompt'),
                "logs": job_data
            }
            self.client.table("processing_jobs").insert(row).execute()
        except Exception as e:
            print(f"Supabase Log Error: {e}")

supabase_db = SupabaseService()
