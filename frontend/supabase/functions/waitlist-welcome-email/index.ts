
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();

        // El payload viene del Webhook de Supabase o llamada directa
        // Formato esperado de Webhook: { record: { email: '...', name: '...' } }
        const record = payload.record || payload;
        const { email, name } = record;

        if (!email) {
            throw new Error("Missing email in payload");
        }

        const SMTP_HOSTNAME = Deno.env.get("SMTP_HOSTNAME") || "smtp.ionos.com";
        const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
        const SMTP_USER = Deno.env.get("SMTP_USER") || "support@luxscaler.com";
        const SMTP_PASS = Deno.env.get("SMTP_PASS") || "supportluxscaler";

        const client = new SmtpClient();

        await client.connectTLS({
            hostname: SMTP_HOSTNAME,
            port: SMTP_PORT,
            username: SMTP_USER,
            password: SMTP_PASS,
        });

        const emailContent = `
      Hola ${name || 'Operador'},
      
      Gracias por unirte a la lista de espera oficial de LUXSCALER™.
      
      Estamos procesando las solicitudes para darte acceso al motor óptico de 16K más avanzado del mercado.
      
      Servicios de LUXSCALER:
      - PhotoScaler™: Calibración óptica y corrección geométrica.
      - StyleScaler™: Ciencia de color de grado cinematográfico.
      - LightScaler™: Simulación de iluminación de estudio profesional.
      - UpScaler Pro™: Inyección de textura plausible hasta 150MP.
      
      Te notificaremos en cuanto tu código de acceso beta esté listo.
      
      Atentamente,
      El Equipo de LuxScaler.
    `;

        await client.send({
            from: SMTP_USER,
            to: email,
            subject: "Bienvenido a la Lista de Espera de LuxScaler™",
            content: emailContent,
        });

        await client.close();

        return new Response(
            JSON.stringify({ message: "Email sent successfully" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
