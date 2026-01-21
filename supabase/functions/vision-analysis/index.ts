// @ts-nocheck
Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_API_KEY");
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No API key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }

    // Fetch image
    const imgRes = await fetch(imageUrl);
    const imgBuf = await imgRes.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)));

    // Call Gemini
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Analyze image. Return JSON: {\"score\":7,\"issues\":[],\"profile\":\"auto\"}" },
              { inlineData: { mimeType: "image/jpeg", data: b64 } }
            ]
          }]
        })
      }
    );

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    return new Response(JSON.stringify({ success: true, analysis: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
