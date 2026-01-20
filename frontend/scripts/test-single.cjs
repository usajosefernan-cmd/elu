const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = 'AIzaSyAwCnJgbzoFKnd74JvAClEvi_eJVemsjdc';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Usando el nombre exacto de la lista: models/gemini-flash-latest
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function testSingleTranslation() {
    const prompt = `Traduce al español para una app de fotografía técnica.
Texto: "Studio in Your Pocket"
Solo devuelve la traducción.`;

    try {
        console.log('--- TESTING GEMINI FLASH LATEST ---');
        const result = await model.generateContent(prompt);
        console.log('Result:', result.response.text().trim());
        console.log('✅ TEST SUCCESSFUL');
    } catch (e) {
        console.error('❌ TEST FAILED:', e.message);
    }
}

testSingleTranslation();
