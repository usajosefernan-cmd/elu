
// frontend/services/locize.service.ts

// Configuración basada en variables de entorno o valores por defecto del protocolo
const LOCIZE_CONFIG = {
    projectId: import.meta.env.VITE_LOCIZE_PROJECT_ID || 'b0b098f2-ad99-46c8-840d-f01dbc330e9a',
    apiKey: import.meta.env.VITE_LOCIZE_API_KEY || '6779d3af-6d78-4c2b-ae81-99ca03fc8278',
    version: import.meta.env.VITE_LOCIZE_VERSION || 'latest',
    namespace: import.meta.env.VITE_LOCIZE_NAMESPACE || 'translation',
    sourceLang: 'en',
    supportedLangs: ['en', 'es', 'ar', 'de', 'fr', 'ja', 'zh']
};

export class LocizeService {

    /**
     * MÉTODO 1: Enviar/Actualizar traducciones en INGLÉS
     * Este método enviará las claves en inglés y Locize las traducirá automáticamente
     */
    async syncEnglishTranslations(translations: Record<string, string>) {
        const url = `https://api.locize.app/update/${LOCIZE_CONFIG.projectId}/${LOCIZE_CONFIG.version}/${LOCIZE_CONFIG.sourceLang}/${LOCIZE_CONFIG.namespace}`;

        console.log(`📤 Enviando ${Object.keys(translations).length} claves a Locize (${LOCIZE_CONFIG.sourceLang})...`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${LOCIZE_CONFIG.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(translations)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Locize API error: ${response.status} - ${error}`);
            }

            console.log('✅ Traducciones en inglés sincronizadas con Locize');
            console.log('⏳ Locize debería estar traduciendo automáticamente a otros idiomas...');

            return true;
        } catch (error) {
            console.error('❌ Error al sincronizar con Locize:', error);
            throw error;
        }
    }

    /**
     * MÉTODO 2: Obtener traducciones de un idioma específico
     */
    async getTranslations(language = 'en') {
        const url = `https://api.locize.app/${LOCIZE_CONFIG.projectId}/${LOCIZE_CONFIG.version}/${language}/${LOCIZE_CONFIG.namespace}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error al obtener traducciones: ${response.status}`);
            }

            const translations = await response.json();
            console.log(`✅ Traducciones obtenidas para idioma: ${language}`);

            return translations;
        } catch (error) {
            console.error(`❌ Error al obtener traducciones para ${language}:`, error);
            throw error;
        }
    }

    /**
     * MÉTODO 4: Verificar el estado de traducción
     */
    async getTranslationStatus() {
        const url = `https://api.locize.app/${LOCIZE_CONFIG.projectId}/${LOCIZE_CONFIG.version}/languages`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${LOCIZE_CONFIG.apiKey}`
                }
            });
            const languages = await response.json();

            console.log('📊 Estado de traducción por idioma:');
            // Locize api returns keys as language codes
            for (const key in languages) {
                const info = languages[key];
                // Check structure of response to be sure where translated % is
                const percentage = (info.translated?.[LOCIZE_CONFIG.version] || 0) * 100;
                console.log(`  ${key}: ${percentage.toFixed(1)}% traducido`);
            }

            return languages;
        } catch (error) {
            console.error('❌ Error al obtener estado:', error);
            throw error;
        }
    }

    /**
     * MÉTODO 5: Esperar a que las traducciones automáticas estén completas
     */
    async waitForAutoTranslation(timeout = 30000) {
        const startTime = Date.now();
        const checkInterval = 2000; // Revisar cada 2 segundos

        console.log('⏳ Esperando a que Locize complete las traducciones automáticas...');

        while (Date.now() - startTime < timeout) {
            const status = await this.getTranslationStatus();

            // Verificar si todos los idiomas están 100% traducidos
            // Note: The API response structure needs to be handled carefully.
            // Assuming 'status' object keys are language codes.

            const allComplete = LOCIZE_CONFIG.supportedLangs
                .filter(lang => lang !== LOCIZE_CONFIG.sourceLang)
                .every(lang => {
                    const langInfo = status[lang];
                    if (!langInfo) return false;
                    // Check locize API stats structure
                    const progress = langInfo.translated?.[LOCIZE_CONFIG.version] ?? 0;
                    return progress >= 0.99; // 99% or more
                });

            if (allComplete) {
                console.log('✅ Todas las traducciones automáticas completadas');
                return true;
            }

            // Esperar antes de volver a revisar
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        console.warn('⚠️ Timeout: Las traducciones aún no están completas (o no hay nada nuevo que traducir)');
        return false;
    }
}

export const locizeService = new LocizeService();
