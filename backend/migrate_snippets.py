import asyncio
from services.supabase_service import supabase_db
from data.snippets import SNIPPET_DICTIONARY

async def migrate_snippets():
    print("Migrating snippets to Supabase...")
    
    count = 0
    for pillar_name, sliders in SNIPPET_DICTIONARY.items():
        for slider_name, values in sliders.items():
            # Extract representative values for levels
            # OFF: 0
            # LOW: 1-3 (Taking 2)
            # MED: 4-6 (Taking 5)
            # HIGH: 7-9 (Taking 8)
            # FORCE: 10
            
            data = {
                "pillar_name": pillar_name,
                "slider_name": slider_name,
                "instruction_off": values.get(0, ""),
                "instruction_low": values.get(2, values.get(1, "")),
                "instruction_med": values.get(5, values.get(4, "")),
                "instruction_high": values.get(8, values.get(7, "")),
                "instruction_force": values.get(10, ""),
                "conflicts_with": [] # Can be populated later
            }
            
            # Upsert
            try:
                # Use pillar_name + slider_name as composite key for upsert?
                # The table has UNIQUE(pillar_name, slider_name)
                res = supabase_db.client.table("slider_semantic_mappings").upsert(data, on_conflict="pillar_name,slider_name").execute()
                print(f"Migrated {pillar_name}/{slider_name}")
                count += 1
            except Exception as e:
                print(f"Error migrating {pillar_name}/{slider_name}: {e}")

    print(f"Migration complete. {count} sliders processed.")

if __name__ == "__main__":
    asyncio.run(migrate_snippets())
