import os
import time
import random

class KeyManager:
    def __init__(self):
        self.keys = []
        self._load_keys()
        self.current_index = 0
        self.cooldown_seconds = 60

    def _load_keys(self):
        env_vars = dict(os.environ)
        # Load known keys with IDs if possible, else generic
        # Priority: 3 > 2 > 1
        if "GOOGLE_API_KEY_3" in env_vars:
            self.keys.append({"id": "key_3", "key": env_vars["GOOGLE_API_KEY_3"], "last_error": 0, "error_count": 0})
        if "GOOGLE_API_KEY_2" in env_vars:
            self.keys.append({"id": "key_2", "key": env_vars["GOOGLE_API_KEY_2"], "last_error": 0, "error_count": 0})
        if "GOOGLE_API_KEY" in env_vars:
            self.keys.append({"id": "key_1", "key": env_vars["GOOGLE_API_KEY"], "last_error": 0, "error_count": 0})
            
        print(f"KeyManager: Loaded {len(self.keys)} API Keys.")

    def get_next_key(self):
        if not self.keys: return None
        
        now = time.time()
        # Filter keys not in cooldown
        available = [k for k in self.keys if (now - k['last_error']) > self.cooldown_seconds]
        
        if not available:
            # All in cooldown? Pick the one with oldest error (first to recover)
            print("WARNING: All keys in cooldown. Picking best candidate.")
            self.keys.sort(key=lambda x: x['last_error'])
            return self.keys[0]['key']
            
        # Round Robin selection
        key_data = available[self.current_index % len(available)]
        self.current_index += 1
        return key_data['key']

    def report_error(self, key_value):
        now = time.time()
        for k in self.keys:
            if k['key'] == key_value:
                k['last_error'] = now
                k['error_count'] += 1
                print(f"⚠️ KeyManager: Error on {k['id']} (...{key_value[-4:]}). Cooldown activated.")
                break

    def report_success(self, key_value):
        for k in self.keys:
            if k['key'] == key_value:
                k['error_count'] = 0
                # Don't reset last_error purely on success if we want to track rate limits history? 
                # Usually we just clear error count.
                break

key_manager = KeyManager()
