
const LOCIZE_PROJECT_ID = 'b0b098f2-ad99-46c8-840d-f01dbc330e9a';
const LOCIZE_API_KEY = 'cc85c60c-0e44-4009-bc33-7a60c5f399ae';

// Traducciones maestras en INGLÉS (Fuente)
const enTranslations: Record<string, string> = {
    "nav.studio": "STUDIO",
    "nav.archive": "ARCHIVE",
    "nav.login": "LOGIN",
    "nav.engines.photo": "PHOTO",
    "nav.engines.style": "STYLE",
    "nav.engines.light": "LIGHT",
    "nav.engines.up": "UP",
    "common.language": "LANGUAGE",
    "common.install": "INSTALL APP",
    "common.admin_dashboard": "ADMIN DASHBOARD",
    "common.logout": "LOGOUT",
    "common.expand": "Expand Menu",
    "common.collapse": "Collapse Menu",
    "sidebar.dashboard": "Main Dashboard",
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
    "dashboard.total_users": "TOTAL USERS",
    "dashboard.total_cost": "TOTAL COST (USD)",
    "dashboard.generated_sessions": "GENERATED SESSIONS",
    "dashboard.unique_variations": "UNIQUE VARIATIONS",
    "dashboard.waitlist_pending": "WAITLIST PENDING",
    "stripe.title": "Stripe Management",
    "stripe.products": "Products",
    "stripe.subscriptions": "Active Subscriptions",
    "stripe.refresh": "Refresh",
    "stripe.no_products": "No products found",
    "stripe.no_subs": "No active subscriptions"
};

async function syncToEnglishAndAutoTranslate() {
    // 1. Actualizar Inglés (en) como fuente
    console.log("🌐 Updating source language: en...");
    const updateUrl = `https://api.locize.io/update/${LOCIZE_PROJECT_ID}/latest/en/translation`;

    try {
        const updateRes = await fetch(updateUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOCIZE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(enTranslations)
        });
        const updateData = await updateRes.text();
        console.log(`   [en] Update Status: ${updateRes.status} - ${updateData || 'Success'}`);

        if (updateRes.ok || updateRes.status === 412) {
            // 2. Disparar traducción automática a los demás idiomas
            const targetLngs = ['es', 'ar', 'de', 'fr', 'ja', 'zh'];
            console.log("\n🚀 Triggering auto-translation from 'en' to targets...");

            for (const lng of targetLngs) {
                console.log(`🌐 Translating to: ${lng}...`);
                const translateUrl = `https://api.locize.io/translate/${LOCIZE_PROJECT_ID}/latest/${lng}/translation?from=en`;

                const transRes = await fetch(translateUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${LOCIZE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({}) // Body vacío dispara la traducción de claves faltantes o desactualizadas
                });
                const transData = await transRes.text();
                console.log(`   [${lng}] Translate Status: ${transRes.status} - ${transData || 'Success'}`);
            }
        }
    } catch (err: any) {
        console.error("❌ Critical Error:", err.message);
    }

    console.log('\n✅ Global Synchronization Finished!');
}

syncToEnglishAndAutoTranslate();
