const { GoogleGenerativeAI } = require('@google/generative-ai');
const GEMINI_API_KEY = 'AIzaSyAwCnJgbzoFKnd74JvAClEvi_eJVemsjdc';

async function listModels() {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    try {
        // Note: The SDK doesn't have a direct listModels, we usually check documentation
        // but some versions might expose it or we can try a simple probe.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Legacy name probe
        const result = await model.generateContent("test");
        console.log("gemini-pro works!");
    } catch (e) {
        console.log("gemini-pro failed:", e.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("test");
        console.log("gemini-1.0-pro works!");
    } catch (e) {
        console.log("gemini-1.0-pro failed:", e.message);
    }
}

listModels();
