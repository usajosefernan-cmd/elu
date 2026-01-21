// LuxScaler v28 - Vision Analysis Edge Function
// Version 2: Fixed for Deno runtime

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Helper to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const imageUrl = body.imageUrl;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "imageUrl is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get API key
    const apiKey = Deno.env.get("GOOGLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "GOOGLE_API_KEY not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Fetch image
    console.log("Fetching image:", imageUrl);
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      throw new Error(`Failed to fetch image: ${imgResponse.status}`);
    }

    const imgBuffer = await imgResponse.arrayBuffer();
    const base64Image = arrayBufferToBase64(imgBuffer);
    const mimeType = imgResponse.headers.get("content-type") || "image/jpeg";
    console.log("Image fetched, size:", imgBuffer.byteLength, "mime:", mimeType);

    // Prepare Gemini request
    const prompt = `[LUXSCALER VISION ANALYSIS v28]
Analyze this photograph professionally. Return ONLY valid JSON:
{
  "technical_score": <number 0-10>,
  "semantic_anchors": ["element to preserve", ...],
  "detected_issues": ["issue to fix", ...],
  "suggested_settings": {"limpieza_artefactos": <0-10>, "enfoque": <0-10>, "contraste": <0-10>},
  "recommended_profile": "auto" | "user" | "pro" | "prolux"
}`;

    const geminiBody = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimeType, data: base64Image } }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024
      }
    };

    console.log("Calling Gemini API...");
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody)
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log("Gemini response received");

    // Extract text from response
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON from response
    let analysis;
    try {
      let jsonText = responseText;
      // Remove markdown code blocks if present
      if (jsonText.includes("```json")) {
        jsonText = jsonText.split("```json")[1].split("```")[0];
      } else if (jsonText.includes("```")) {
        jsonText = jsonText.split("```")[1].split("```")[0];
      }
      analysis = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Return default analysis
      analysis = {
        technical_score: 6,
        semantic_anchors: ["main subject"],
        detected_issues: ["analysis incomplete"],
        suggested_settings: { limpieza_artefactos: 3, enfoque: 5, contraste: 4 },
        recommended_profile: "auto"
      };
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis,
        tokens_consumed: geminiData.usageMetadata?.totalTokenCount || 500
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
