import os
import random
import time

class KeyManager:
    def __init__(self):
        self.keys = []
        self.banned_keys = {} # key -> timestamp
        self._load_keys()
    
    def _load_keys(self):
        env_vars = dict(os.environ)
        
        # Add GOOGLE_API_KEY_3 (Freshest - Highest Priority)
        if "GOOGLE_API_KEY_3" in env_vars:
            self.keys.append({"key": env_vars["GOOGLE_API_KEY_3"], "weight": 50.0})

        # Add GOOGLE_API_KEY_2 (High Priority)
        if "GOOGLE_API_KEY_2" in env_vars:
            self.keys.append({"key": env_vars["GOOGLE_API_KEY_2"], "weight": 10.0})
            
        # Add GOOGLE_API_KEY (Lowest - Backup)
        if "GOOGLE_API_KEY" in env_vars:
            self.keys.append({"key": env_vars["GOOGLE_API_KEY"], "weight": 1.0})
            
        print(f"KeyManager: Loaded {len(self.keys)} API Keys.")

    def get_next_key(self):
        # Filter out banned keys (cooldown 60s)
        now = time.time()
        active_keys = [k for k in self.keys if k['key'] not in self.banned_keys or (now - self.banned_keys[k['key']] > 60)]
        
        if not active_keys:
            # If all banned, return the one with highest weight (likely the newest) hoping it cooled down
            return self.keys[0]['key'] if self.keys else None
            
        # Weighted selection
        total_weight = sum(k['weight'] for k in active_keys)
        r = random.uniform(0, total_weight)
        cumulative = 0
        for k in active_keys:
            cumulative += k['weight']
            if r <= cumulative:
                return k['key']
        
        return active_keys[0]['key']

    def report_error(self, key):
        print(f"KeyManager: Banning key ...{key[-4:]} due to error.")
        self.banned_keys[key] = time.time()

key_manager = KeyManager()
