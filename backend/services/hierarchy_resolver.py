# Hierarchy Resolver Logic
def resolve_conflicts(user_sliders):
    optimized = {
        'photoscaler': { s['name']: s['value'] for s in user_sliders['photoscaler']['sliders'] },
        'stylescaler': { s['name']: s['value'] for s in user_sliders['stylescaler']['sliders'] },
        'lightscaler': { s['name']: s['value'] for s in user_sliders['lightscaler']['sliders'] },
    }

    # REGLA 1: La Paradoja Forense
    if optimized['photoscaler'].get('limpieza_artefactos', 0) == 10:
        print("⚠️ FORCE RESTORATION detected. Killing Grain & Vintage Optics.")
        optimized['photoscaler']['grano_filmico'] = 0
        optimized['photoscaler']['optica'] = 10
        if optimized['stylescaler'].get('atmosfera', 0) > 3:
            optimized['stylescaler']['atmosfera'] = 3

    # REGLA 2: La Tiranía del Drama
    if optimized['lightscaler'].get('contraste', 0) == 10:
        optimized['lightscaler']['fill_light'] = 0

    # Write back to list structure
    for pillar in ['photoscaler', 'stylescaler', 'lightscaler']:
        for s in user_sliders[pillar]['sliders']:
            s['value'] = optimized[pillar][s['name']]

    return user_sliders
