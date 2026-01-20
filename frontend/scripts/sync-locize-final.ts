// Script DEFINITIVO para sincronizar traducciones con Locize
// Usando el endpoint de update con auto-translate habilitado en el proyecto
// https://locize.com/docs/integration/api

const LOCIZE_PROJECT_ID = 'b0b098f2-ad99-46c8-840d-f01dbc330e9a';
const LOCIZE_API_KEY = '6779d3af-6d78-4c2b-ae81-99ca03fc8278';

// Traducciones COMPLETAS en INGLÉS (Fuente)
const enTranslations: Record<string, string> = {
    // Navigation
    "nav.studio": "STUDIO",
    "nav.archive": "ARCHIVE",
    "nav.login": "LOGIN",
    "nav.upload_project": "Upload Project",
    "nav.recharge_tokens": "Recharge Tokens",
    "nav.operator_standard": "Standard Operator",
    "nav.operator_pro": "PRO Operator",
    "nav.engines.photo": "PHOTO",
    "nav.engines.style": "STYLE",
    "nav.engines.light": "LIGHT",
    "nav.engines.up": "UP",

    // Common
    "common.language": "LANGUAGE",
    "common.install": "INSTALL APP",
    "common.admin_dashboard": "ADMIN DASHBOARD",
    "common.logout": "LOGOUT",
    "common.expand": "Expand Menu",
    "common.collapse": "Collapse Menu",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.users_marketing": "Users & Marketing",
    "sidebar.infrastructure": "Infrastructure",
    "sidebar.storage": "Storage & Assets",
    "sidebar.luxscaler_engine": "LuxScaler Engine",
    "sidebar.forensic_lab": "Forensic Lab",
    "sidebar.theme_designer": "Theme Designer",
    "sidebar.viva_config": "System Config",
    "sidebar.logs": "System Logs",
    "sidebar.billing": "Subscriptions (Stripe)",
    "sidebar.groups.core": "CORE",
    "sidebar.groups.apps": "APPS",
    "sidebar.groups.system": "SYSTEM",

    // Dashboard
    "dashboard.total_users": "TOTAL USERS",
    "dashboard.total_cost": "TOTAL COST (USD)",
    "dashboard.generated_sessions": "GENERATED SESSIONS",
    "dashboard.unique_variations": "UNIQUE VARIATIONS",
    "dashboard.waitlist_pending": "WAITLIST",

    // Landing / HeroGallery
    "landing.hero.badge": "Official App",
    "landing.hero.title_part1": "Studio in",
    "landing.hero.title_part2": "Your Pocket",
    "landing.hero.subtitle": "The complete LuxScaler engine on iOS and Android. RAW capture. Professional editing interface. Full pipeline control from your device.",
    "landing.api.badge": "Developer API",
    "landing.api.title_part1": "Programmable",
    "landing.api.title_part2": "Defect Control",
    "landing.api.subtitle": "Every photo defect is a parameter. Motion blur, missed focus, noise, distortion. Enable, disable, or dial intensity from 0-10. Full programmatic control.",
    "landing.api.link": "View Documentation >",
    "landing.cta.title_part1": "READY TO",
    "landing.cta.title_part2": "SCALE",
    "landing.cta.subtitle": "Join thousands of photographers using LuxScaler to save their shots and enhance their portfolio.",
    "landing.cta.button": "GET 60 FREE TOKENS",
    "landing.cta.features.tokens": "60 Free Tokens",
    "landing.cta.features.pay": "Pay Per Use",
    "landing.cta.features.subs": "No Subscriptions",

    // Landing Motors
    "landing.motors.photo.name": "PHOTOSCALER™",
    "landing.motors.photo.tagline": "The Virtual Camera",
    "landing.motors.photo.desc": "Simulates high-end optics. Replaces mobile distortion with portrait telephoto physics.",
    "landing.motors.photo.short_desc": "Optics Simulation",

    "landing.motors.style.name": "STYLESCALER",
    "landing.motors.style.tagline": "The Color Lab",
    "landing.motors.style.desc": "Cinema-grade color science. Simulates film stocks and unifies atmosphere.",
    "landing.motors.style.short_desc": "Color Grading",

    "landing.motors.light.name": "LIGHTSCALER",
    "landing.motors.light.tagline": "The Lighting Rig",
    "landing.motors.light.desc": "Simulates studio equipment. Adds Key, Fill, and Rim lights for professional volume.",
    "landing.motors.light.short_desc": "Volumetric Lighting",

    "landing.motors.up.name": "UPSCALER",
    "landing.motors.up.tagline": "The Print Master",
    "landing.motors.up.desc": "Resolution enhancement. Injects plausible texture consistent with 150MP sensors.",
    "landing.motors.up.short_desc": "Print Resolution",

    // Landing Reveal
    "landing.reveal.definitive": "The Definitive",
    "landing.reveal.editor": "Editor",
    "landing.reveal.photographer": "Photographer",
    "landing.reveal.producer": "Producer",
    "landing.reveal.input": "Original Input",
    "landing.reveal.master": "LuxScaler Master",

    // Stripe
    "stripe.title": "Stripe Management",
    "stripe.products": "Products",
    "stripe.subscriptions": "Active Subscriptions",
    "stripe.refresh": "Refresh",
    "stripe.no_products": "No products",
    "stripe.no_subs": "No active subscriptions"
};

async function syncWithLocize() {
    const updateUrl = `https://api.locize.app/update/${LOCIZE_PROJECT_ID}/latest/en/translation`;

    console.log("🌐 Sincronizando traducciones en inglés con Locize...");
    console.log(`   Endpoint: ${updateUrl}`);
    console.log(`   Total de claves: ${Object.keys(enTranslations).length}\n`);

    try {
        const response = await fetch(updateUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOCIZE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(enTranslations)
        });

        const result = await response.text();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${result || 'Success (empty = OK)'}`);

        if (response.ok || response.status === 412) {
            console.log("\n✅ Sincronización completada!");
            console.log("   Locize traducirá automáticamente las claves a todos los idiomas.");
            console.log("   Dashboard: https://www.locize.app/p/eyfo2umc/v/latest");
        } else {
            console.error("\n❌ Error. Revisa permisos de API Key.");
        }
    } catch (err: any) {
        console.error("❌ Error de conexión:", err.message);
    }
}

syncWithLocize();
