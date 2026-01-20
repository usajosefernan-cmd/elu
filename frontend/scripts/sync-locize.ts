// Script para sincronizar traducciones con Locize
// Probando diferentes métodos de autenticación
const LOCIZE_PROJECT_ID = 'b0b098f2-ad99-46c8-840d-f01dbc330e9a';
const LOCIZE_API_KEY = 'cc85c60c-0e44-4009-bc33-7a60c5f399ae';

const esTranslations: Record<string, string> = {
    "nav.studio": "ESTUDIO",
    "nav.archive": "ARCHIVO",
    "nav.login": "ACCESO",
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
};

async function syncTranslations() {
    const lngs = ['es'];
    console.log(`🔄 Iniciando sincronización para ${lngs.length} idiomas...\n`);

    for (const lng of lngs) {
        console.log(`🌐 Procesando idioma: ${lng}...`);

        // El endpoint de update para "es" (fuente) o el de translate para otros
        const endpoint = lng === 'es'
            ? `https://api.locize.io/update/${LOCIZE_PROJECT_ID}/latest/${lng}/translation`
            : `https://api.locize.io/translate/${LOCIZE_PROJECT_ID}/latest/${lng}/translation`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${LOCIZE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: lng === 'es' ? JSON.stringify(esTranslations) : JSON.stringify({})
            });

            const result = await response.text();
            console.log(`   [${lng}] Status: ${response.status} - ${result || 'Success'}`);
        } catch (e: any) {
            console.log(`   [${lng}] Error: ${e.message}`);
        }
    }

    console.log('\n✅ Proceso de sincronización finalizado!');
}

syncTranslations();
