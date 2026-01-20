
import fs from 'fs';
import path from 'path';

const LOCIZE_PROJECT_ID = 'b0b098f2-ad99-46c8-840d-f01dbc330e9a';
const LOCIZE_API_KEY = '6779d3af-6d78-4c2b-ae81-99ca03fc8278';

async function syncSpanish() {
    const filePath = path.join(process.cwd(), 'frontend', 'locize_manual_es_v2.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    const translations = JSON.parse(content);

    const updateUrl = `https://api.locize.app/update/${LOCIZE_PROJECT_ID}/latest/es/translation`;

    console.log("🌐 Sincronizando traducciones en ESPAÑOL manuales...");
    console.log(`   Endpoint: ${updateUrl}`);
    console.log(`   Total de claves: ${Object.keys(translations).length}`);

    try {
        const response = await fetch(updateUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOCIZE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(translations)
        });

        const result = await response.text();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${result}`);

        if (response.ok) {
            console.log("\n✅ Español actualizado correctamente.");
        } else {
            console.error("\n❌ Error al subir español.");
        }
    } catch (err) {
        console.error("❌ Error de conexión:", err);
    }
}

syncSpanish();
