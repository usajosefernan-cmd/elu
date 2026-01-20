import os
import random
import time

class KeyManager:
    def __init__(self):
        self.keys = []
        self.banned_keys = {} # key -> timestamp
        self._load_keys()
    
    def _load_keys(self):
        # Load all variables starting with GOOGLE_API_KEY
        # Priority to GOOGLE_API_KEY_2 as it is the newest provided by user
        env_vars = dict(os.environ)
        
        # Add GOOGLE_API_KEY_2 first (High Priority)
        if "GOOGLE_API_KEY_2" in env_vars:
            self.keys.append({"key": env_vars["GOOGLE_API_KEY_2"], "weight": 10.0})
            
        # Add GOOGLE_API_KEY
        if "GOOGLE_API_KEY" in env_vars:
            self.keys.append({"key": env_vars["GOOGLE_API_KEY"], "weight": 1.0})
            
        print(f"KeyManager: Loaded {len(self.keys)} API Keys.")

    def get_next_key(self):
        # Filter out banned keys (cooldown 60s)
        now = time.time()
        active_keys = [k for k in self.keys if k['key'] not in self.banned_keys or (now - self.banned_keys[k['key']] > 60)]
        
        if not active_keys:
            # If all banned, try to reset the oldest ban or just return the highest weighted one hoping for the best
            print("WARNING: All keys are in cooldown. Forcing use of primary key.")
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
        # Ban key for 60 seconds on error
        print(f"KeyManager: Banning key ...{key[-4:]} due to error.")
        self.banned_keys[key] = time.time()

key_manager = KeyManager()
