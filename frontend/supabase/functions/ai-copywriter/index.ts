
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { type, keywords, vibe } = await req.json();
        const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("LAOZHANG_API_KEY");

        if (!apiKey) throw new Error("Missing API Key");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let prompt = "";
        if (type === "title") {
            prompt = `Generate 3 completely different, high-end, cinematic marketing TITLES for a product feature.
      Keywords: ${keywords}
      Vibe: ${vibe || "Premium, Technical, Futuristic"}
      Format: Return ONLY a JSON array of strings. Example: ["The Glass Engine", "Optics Reimagined", "Pure Light"]`;
        } else {
            prompt = `Generate 3 completely different, engaging, professional marketing DESCRIPTIONS for a product feature.
      Keywords: ${keywords}
      Vibe: ${vibe || "Premium, Technical, Futuristic"}
      Max Length: 2 sentences.
      Format: Return ONLY a JSON array of strings.`;
        }

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean markdown if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const suggestions = JSON.parse(cleanText);

        return new Response(
            JSON.stringify({ suggestions }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
