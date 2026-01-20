
import { locizeService } from '../services/locize.service';

// SINGLE SOURCE OF TRUTH: ENGLISH TRANSLATIONS
// Estas son las ÚNICAS claves que se envían a Locize.
// Locize se encarga de traducir al resto de idiomas automáticamente.

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
    "stripe.no_subs": "No active subscriptions",

    // Global Footer
    "footer.company.desc": "Professional optics simulation and resolution enhancement. Engineered for the highest fidelity in photographic restoration and cinema-grade upscaling.",
    "footer.resources.title": "RESOURCES",
    "footer.resources.pricing": "PRICING",
    "footer.resources.faq": "FAQ",
    "footer.resources.api_docs": "API DOCS",
    "footer.resources.contact": "CONTACT",
    "footer.legal.title": "LEGAL",
    "footer.legal.terms": "TERMS",
    "footer.legal.privacy": "PRIVACY",
    "footer.legal.cookies": "COOKIES",
    "footer.rights": "© 2026 LUXSCALER. ALL RIGHTS RESERVED.",
    "footer.features.forensic": "Forensic Integrity",
    "footer.features.privacy": "Privacy First",
    "footer.features.eu": "EU Compliance",

    // Showcase - PhotoScaler
    "showcase.photo.01.title": "DETAIL RECOV",
    "showcase.photo.01.sub": "Textural Synthesis",
    "showcase.photo.01.effect": "TEXTURE+",
    "showcase.photo.02.title": "CLARITY ENHANCE",
    "showcase.photo.02.sub": "Edge Refinement",
    "showcase.photo.03.title": "MICRO DETAIL",
    "showcase.photo.03.sub": "Pixel Reconstruction",
    "showcase.photo.03.effect": "EYE DETAIL",
    "showcase.photo.04.title": "COLOR MATRIX",
    "showcase.photo.04.sub": "Chromatic Balance",
    "showcase.photo.05.title": "FULL RESTORE",
    "showcase.photo.05.sub": "Complex Pipeline",
    "showcase.photo.06.title": "TEXTURE LOCK",
    "showcase.photo.06.sub": "Organic Preservation",
    "showcase.photo.06.effect": "PRESERVE",
    "showcase.photo.07.title": "FORENSIC SCAN",
    "showcase.photo.07.sub": "Evidence Extraction",
    "showcase.photo.08.title": "LEGACY PHOTO",
    "showcase.photo.08.sub": "Temporal Repair",
    "showcase.photo.08.effect": "RESTORE",
    "showcase.photo.09.title": "ARTIFACT KILL",
    "showcase.photo.09.sub": "Noise Reduction",
    "showcase.photo.10.title": "CONTRAST OPT",
    "showcase.photo.10.sub": "Dynamic Range",
    "showcase.photo.11.title": "EDGE DEFINE",
    "showcase.photo.11.sub": "Boundary Logic",
    "showcase.photo.12.title": "DEPTH RECOV",
    "showcase.photo.12.sub": "3D Spatial Analysis",
    "showcase.photo.12.effect": "3D DEPTH",
    "showcase.photo.13.title": "LIGHT CORR",
    "showcase.photo.13.sub": "Volumetric Balancer",
    "showcase.photo.13.effect": "LIGHT+",
    "showcase.photo.14.title": "BATCH PROC",
    "showcase.photo.14.sub": "Mass Automation",
    "showcase.photo.15.title": "REALTIME PREV",
    "showcase.photo.15.sub": "Instant Feedback",

    // Showcase - StyleScaler
    "showcase.style.01.title": "FILM EMULATION",
    "showcase.style.01.sub": "Analog Color Science",
    "showcase.style.01.effect": "CINEMATIC",
    "showcase.style.02.title": "COLOR GRADE",
    "showcase.style.02.sub": "Hollywood LUT System",
    "showcase.style.03.title": "SKIN TONE",
    "showcase.style.03.sub": "Portrait Harmonics",

    // Showcase - LightScaler
    "showcase.light.01.title": "KEY LIGHT",
    "showcase.light.01.sub": "Primary Illumination",
    "showcase.light.01.effect": "STUDIO",
    "showcase.light.02.title": "FILL LIGHT",
    "showcase.light.02.sub": "Shadow Lift",
    "showcase.light.03.title": "RIM LIGHT",
    "showcase.light.03.sub": "Edge Separation",

    // Showcase - Upscaler
    "showcase.up.01.title": "4K UPSCALE",
    "showcase.up.01.sub": "Resolution Synthesis",
    "showcase.up.01.effect": "4K",
    "showcase.up.02.title": "TEXTURE GEN",
    "showcase.up.02.sub": "Detail Hallucination",
    "showcase.up.03.title": "PRINT READY",
    "showcase.up.03.sub": "150MP Output",

    // Product Showcase UI
    "product.zoom": "ZOOM",
    "product.vs": "vs",

    // App System Messages
    "system.loading.calibrating_lens": "PhotoScaler™: Calibrating 85mm Lens...",
    "system.loading.analyzing_sensor": "PhotoScaler™: Analyzing Sensor Data...",
    "system.loading.simulating_optics": "PhotoScaler™: Simulating Leica Optics...",
    "system.loading.processing_bokeh": "PhotoScaler™: Processing Bokeh Depth...",
    "system.loading.finalizing_output": "PhotoScaler™: Finalizing 4K Output...",
    "system.imminent.register": "Register to create 4K Masters.",
    "system.imminent.confirm": "CONFIRM 4K MASTER",
    "system.back": "BACK",
    "system.processing": "PROCESSING",
    "system.engineering_data": "ENGINEERING DATA",
    "system.login_register": "Login / Register",
    "system.error": "Error"
};

async function main() {
    console.log("🚀 Iniciando Protocolo de Sincronización Locize...");

    // 1. Sincronizar Inglés
    try {
        await locizeService.syncEnglishTranslations(enTranslations);

        // 2. Esperar traducción automática (Opcional, pero recomendado en el protocolo)
        // Reducimos timeout a 10s para desarrollo ágil, aumentar en prod
        const done = await locizeService.waitForAutoTranslation(15000); // 15s wait

        if (done) {
            console.log("✨ Ciclo de sincronización completado exitosamente.");
        } else {
            console.log("⚠️ Ciclo completado parcialmente (traducciones en progreso).");
        }

        // 3. Verificación rápida de español
        console.log("🔍 Verificando español...");
        const es = await locizeService.getTranslations('es');
        console.log(`🇪🇸 Español tiene ${Object.keys(es).length} claves.`);

    } catch (error) {
        console.error("💥 Fallo crítico en sincronización:", error);
        process.exit(1);
    }
}

main();
