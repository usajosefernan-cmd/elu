import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// import Backend from 'i18next-locize-backend';

// LOCIZE CONFIG - DISABLED FOR LOCAL DEV
// const locizeOptions = {
//     projectId: import.meta.env.VITE_LOCIZE_PROJECT_ID || 'eyfo2umc',
//     apiKey: import.meta.env.VITE_LOCIZE_API_KEY || '6779d3af-6d78-4c2b-ae81-99ca03fc8278', // Read-Only por defecto si no hay variable
//     referenceLng: 'en',
//     version: 'latest'
// };

// TRADUCCIONES LOCALES EMBEBIDAS (RESPALDO)
const localResources = {
    es: {
        translation: {
            "nav.studio": "ESTUDIO",
            "nav.archive": "ARCHIVO",
            "nav.login": "ACCESO",
            "nav.upload_project": "Subir Proyecto",
            "nav.recharge_tokens": "Recargar Tokens",
            "nav.operator_standard": "Operador Estándar",
            "nav.operator_pro": "Operador PRO",
            "nav.engines.photo": "FOTO",
            "nav.engines.style": "ESTILO",
            "nav.engines.light": "LUZ",
            "nav.engines.up": "UP",
            "common.language": "IDIOMA",
            "common.install": "INSTALAR APP",
            "common.admin_dashboard": "PANEL ADMIN",
            "common.logout": "CERRAR SESIÓN",
            "common.expand": "Expandir Menú",
            "common.collapse": "Colapsar Menú",
            "sidebar.dashboard": "Panel Principal",
            "sidebar.users_marketing": "Usuarios y Marketing",
            "sidebar.infrastructure": "Infraestructura",
            "sidebar.storage": "Almacenamiento y Assets",
            "sidebar.luxscaler_engine": "Motor LuxScaler",
            "sidebar.forensic_lab": "Laboratorio Forense",
            "sidebar.theme_designer": "Diseñador de Temas",
            "sidebar.viva_config": "Configuración del Sistema",
            "sidebar.logs": "Registros del Sistema",
            "sidebar.billing": "Suscripciones (Stripe)",
            "sidebar.groups.core": "NÚCLEO",
            "sidebar.groups.apps": "APLICACIONES",
            "sidebar.groups.system": "SISTEMA",
            "dashboard.total_users": "USUARIOS TOTALES",
            "dashboard.total_cost": "COSTE TOTAL (USD)",
            "dashboard.generated_sessions": "SESIONES GENERADAS",
            "dashboard.unique_variations": "VARIACIONES ÚNICAS",
            "dashboard.waitlist_pending": "LISTA DE ESPERA",
            "stripe.title": "Gestión de Stripe",
            "stripe.products": "Productos",
            "stripe.subscriptions": "Suscripciones Activas",
            "stripe.refresh": "Actualizar",
            "stripe.no_products": "No hay productos",
            "stripe.no_subs": "No hay suscripciones activas"
        }
    },
    en: {
        translation: {
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
            "common.language": "LANGUAGE",
            "common.install": "INSTALL APP",
            "common.admin_dashboard": "ADMIN DASHBOARD",
            "common.logout": "LOGOUT",
            "common.expand": "Expand Menu",
            "common.collapse": "Collapse Menu",
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
            "dashboard.total_users": "TOTAL USERS",
            "dashboard.total_cost": "TOTAL COST (USD)",
            "dashboard.generated_sessions": "GENERATED SESSIONS",
            "dashboard.unique_variations": "UNIQUE VARIATIONS",
            "dashboard.waitlist_pending": "WAITLIST",
            "stripe.title": "Stripe Management",
            "stripe.products": "Products",
            "stripe.subscriptions": "Active Subscriptions",
            "stripe.refresh": "Refresh",
            "stripe.no_products": "No products",
            "stripe.no_subs": "No active subscriptions"
        }
    }
};

// Respetar preferencia del usuario (detectada por LanguageDetector)\n// Si no hay preferencia guardada, usar 'en' como default (configurado en init)\n
i18n
    // .use(Backend) // DISABLED LOCIZE
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: localResources,
        lng: 'en',
        fallbackLng: 'en',
        supportedLngs: ['es', 'en', 'de', 'fr', 'ja', 'zh', 'ar'],
        debug: false,

        // backend: locizeOptions, // DISABLED LOCIZE
        // saveMissing: true, 

        interpolation: {
            escapeValue: false,
        },

        detection: {
            order: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        },

        react: {
            useSuspense: false
        }
    });

export default i18n;
