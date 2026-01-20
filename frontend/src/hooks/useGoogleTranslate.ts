
import { useEffect, useState } from 'react';

/**
 * Hook PRO para Google Translate "Invisible"
 * Maneja la inyección del script, la eliminación del banner y el cambio de idioma vía cookies.
 */
export const useGoogleTranslate = () => {
    const [currentLang, setCurrentLang] = useState('es');

    // 1. Inyectar Script y Configuración Inicial
    useEffect(() => {
        // Evitar duplicados
        if (document.querySelector('#google-translate-script')) return;

        // Crear div contenedor oculto
        const div = document.createElement('div');
        div.id = 'google_translate_element';
        div.style.display = 'none'; // Oculto desde el inicio
        document.body.appendChild(div);

        // Definir función de inicialización global
        (window as any).googleTranslateElementInit = () => {
            new (window as any).google.translate.TranslateElement({
                pageLanguage: 'es',
                includedLanguages: 'en,es',
                autoDisplay: false, // CLAVE: No mostrar banner automático
            }, 'google_translate_element');
        };

        // Inyectar script de Google
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);

        // 2. OBSERVADOR NUCLEAR: Matar el banner si aparece
        const observer = new MutationObserver(() => {
            // Eliminar banner iframe
            const iframe = document.querySelector('.goog-te-banner-frame');
            if (iframe) {
                iframe.remove();
            }

            // Eliminar clase skiptranslate del body
            if (document.body.classList.contains('skiptranslate')) {
                document.body.classList.remove('skiptranslate');
            }

            // Forzar top 0 en body
            if (document.body.style.top !== '0px') {
                document.body.style.top = '0px';
                document.body.style.position = 'static';
            }
        });

        observer.observe(document.body, { childList: true, attributes: true, subtree: false });
        observer.observe(document.documentElement, { childList: true, attributes: true });

        // Limpieza básica de estilos iniciales
        const style = document.createElement('style');
        style.innerHTML = `
            .goog-te-banner-frame { display: none !important; }
            .goog-te-gadget { display: none !important; }
            body { top: 0px !important; }
            #google_translate_element { display: none !important; }
            .skiptranslate { display: none !important; }
        `;
        document.head.appendChild(style);

        return () => observer.disconnect();
    }, []);

    // 3. Función para Cambiar Idioma (Cookie Method)
    const changeLanguage = (langCode: 'es' | 'en') => {
        // Set Google Cookie: /auto/target_lang
        // Format: googtrans=/auto/en or /es/en
        const cookieValue = `/auto/${langCode}`;

        document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`;
        document.cookie = `googtrans=${cookieValue}; path=/;`; // Fallback for localhost

        setCurrentLang(langCode);

        // Recargar para aplicar
        window.location.reload();
    };

    return { changeLanguage, currentLang };
};
