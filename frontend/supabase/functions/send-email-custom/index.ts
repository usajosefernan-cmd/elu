import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, payload } = await req.json()

        if (action === 'test_connection') {
            const { host, port, user, pass, secure } = payload

            console.log(`Testing SMTP connection to ${host}:${port} for user ${user}`);

            const transporter = nodemailer.createTransport({
                host,
                port: Number(port),
                secure: secure,
                auth: {
                    user,
                    pass,
                },
            });

            // verify connection configuration
            await new Promise((resolve, reject) => {
                transporter.verify(function (error, success) {
                    if (error) {
                        console.error('SMTP Verify Error:', error);
                        reject(error);
                    } else {
                        console.log("SMTP Server is ready to take our messages");
                        resolve(success);
                    }
                });
            });

            return new Response(
                JSON.stringify({ message: 'Conexión SMTP exitosa. Credenciales válidas.', success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
        }

        if (action === 'send_email') {
            const { host, port, user, pass, secure, fromName, to, subject, html } = payload

            console.log(`Sending email to ${to} via ${host}`);

            const transporter = nodemailer.createTransport({
                host,
                port: Number(port),
                secure: secure,
                auth: {
                    user,
                    pass,
                },
            });

            const info = await transporter.sendMail({
                from: `"${fromName}" <${user}>`, // sender address
                to, // list of receivers
                subject, // Subject line
                html: html, // html body
            });

            console.log('Message sent: %s', info.messageId);

            return new Response(
                JSON.stringify({ message: 'Email enviado correctamente', info }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
        }

        throw new Error(`Action '${action}' not supported`)

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message, details: error }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )
    }
})
