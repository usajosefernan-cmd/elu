import os
import random

class KeyManager:
    def __init__(self):
        self.keys = []
        self._load_keys()
    
    def _load_keys(self):
        # Load all variables starting with GOOGLE_API_KEY
        for key, val in os.environ.items():
            if key.startswith("GOOGLE_API_KEY") and val:
                # Assign a default weight, or could parse from a config string
                # For now equal weights for robustness
                self.keys.append({"key": val, "weight": 1.0})
        
        print(f"KeyManager: Loaded {len(self.keys)} API Keys.")

    def get_next_key(self):
        if not self.keys:
            return None
            
        # Weighted selection logic
        total_weight = sum(k['weight'] for k in self.keys)
        r = random.uniform(0, total_weight)
        cumulative = 0
        for k in self.keys:
            cumulative += k['weight']
            if r <= cumulative:
                return k['key']
        
        return self.keys[0]['key']

    def report_error(self, key):
        # Logic to temporarily down-weight or remove a key on 429 error
        print(f"KeyManager: Reported error for key ending in ...{key[-4:]}")
        # For simplicity in this MVP, we just rotate to random next time
        pass

key_manager = KeyManager()
