import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Saco la config SMTP a constantes para reuso
const SMTP_CONFIG = {
    host: "smtp.ionos.es",
    port: 587,
    secure: false, // TLS
    auth: {
        user: "support@luxscaler.com",
        pass: "supportluxscaler",
    },
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { type, user_id, recipient_email, data } = await req.json();
        // type: 'LOW_BALANCE' | 'SECURITY_ALERT' | 'NEWSLETTER' | 'SYSTEM'

        // Auth Admin Init
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        console.log(`[Notification] Dispatching type: ${type} for ${user_id || recipient_email}`);

        // Resolve Recipient
        let email = recipient_email;
        let name = "User";

        if (!email && user_id) {
            // Fetch from DB
            const { data: profile } = await supabaseAdmin.from('profiles').select('id, username').eq('id', user_id).single();
            const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(user_id);

            if (user && user.email) {
                email = user.email;
                name = profile?.username || user.user_metadata?.full_name || "Creator";
            }
        }

        if (!email) throw new Error("Recipient email could not be resolved.");

        // Prepare Content based on Type
        let subject = "";
        let htmlContent = "";

        const baseStyle = `font-family: Arial, sans-serif; background: #000; color: #fff; padding: 30px; border-radius: 8px; border: 1px solid #333;`;
        const h1Style = `color: #fff; text-align: center; letter-spacing: 2px;`;
        const highlightBox = `background: #111; padding: 20px; border-left: 4px solid #00D4FF; margin: 20px 0;`;

        switch (type) {
            case 'LOW_BALANCE':
                subject = "⚠️ LUXSCALER: Low Balance Alert";
                htmlContent = `
                <div style="${baseStyle}">
                    <h1 style="${h1Style}">LOW BALANCE</h1>
                    <p>Hello ${name},</p>
                    <p>Your token balance has dropped below the threshold.</p>
                    <div style="${highlightBox}">
                        <strong>Current Balance:</strong> <span style="color: #FF4444">${data?.current_balance || '< 50'} Tokens</span><br/>
                        <strong>Status:</strong> CRITICAL
                    </div>
                    <p>To ensure uninterrupted access to the Deep Physics Engines, please top up your account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://luxscaler.com/pricing" style="background: #00D4FF; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">RECHARGE TOKENS &rarr;</a>
                    </div>
                </div>
            `;
                break;

            case 'SECURITY_ALERT':
                subject = "🛡️ LUXSCALER: Security Alert";
                htmlContent = `
                <div style="${baseStyle}">
                    <h1 style="${h1Style}">SECURITY NOTICE</h1>
                    <p>Hello ${name},</p>
                    <p>We detected an important change in your account security.</p>
                    <div style="${highlightBox} border-color: #FF4444;">
                        <strong>Event:</strong> ${data?.event || 'Profile Update'}<br/>
                        <strong>Time:</strong> ${new Date().toISOString()}
                    </div>
                    <p>If this wasn't you, please contact support immediately.</p>
                </div>
            `;
                break;

            case 'NEWSLETTER':
                subject = data?.subject || "LUXSCALER: New Update";
                htmlContent = `
                <div style="${baseStyle}">
                    <h1 style="${h1Style}">LUXSCALER UPDATE</h1>
                    ${data?.body || '<p>News from the lab.</p>'}
                    <p style="color: #666; font-size: 11px; margin-top: 40px; text-align: center;">You are receiving this because you are part of the LuxScaler Beta.</p>
                </div>
            `;
                break;

            default:
                throw new Error("Invalid Notification Type");
        }

        // Add Unsubscribe Footer
        htmlContent += `
        <div style="text-align: center; margin-top: 10px; font-family: Arial, sans-serif; font-size: 11px; padding-top: 20px; border-top: 1px solid #222;">
            <p style="color: #444;">LuxScaler Inc. - Deep Physics Lab</p>
            <a href="https://luxscaler.com/profile/settings" style="color: #666; text-decoration: none; margin-right: 10px;">Manage Preferences</a> | 
            <a href="https://luxscaler.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #666; text-decoration: none; margin-left: 10px;">Unsubscribe</a>
        </div>
    `;

        // Send Email
        const transporter = nodemailer.createTransport(SMTP_CONFIG);

        await transporter.sendMail({
            from: '"LuxScaler System" <support@luxscaler.com>',
            to: email,
            subject: subject,
            html: htmlContent,
        });

        console.log(`[Notification] Sent to ${email}`);

        return new Response(
            JSON.stringify({ success: true, message: "Notification Dispatched" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error(`[Notification] Error:`, error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
