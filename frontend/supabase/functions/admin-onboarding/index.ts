import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { email, name, initial_tokens = 500 } = await req.json();

        if (!email) throw new Error("Email is required");

        // 1. Initialize Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // 2. Auth Check: Verify Caller is Admin (Optional security layer, can be disabled if calling from secure backend)
        // const authHeader = req.headers.get('Authorization')!;
        // const { data: { user: adminUser } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        // const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', adminUser?.id).single();
        // if (!profile?.is_admin) throw new Error("Unauthorized: Admin access required.");

        console.log(`[Onboarding] Starting for: ${email}`);

        // 3. Check if user exists, else Create
        let userId;
        const { data: existingUser } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single(); // Check profile mapping first? OR Auth directly.
        // Better to check Auth Admin
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const foundUser = users.find(u => u.email === email);

        if (foundUser) {
            console.log(`[Onboarding] User exists: ${foundUser.id}`);
            userId = foundUser.id;
        } else {
            console.log(`[Onboarding] Creating new user...`);
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                email_confirm: true, // Auto-confirm so they can use Magic Link immediately
                user_metadata: { full_name: name || 'Lux User' }
            });
            if (createError) throw createError;
            userId = newUser.user.id;
        }

        // 4. Inject Tokens
        console.log(`[Onboarding] Injecting ${initial_tokens} tokens...`);
        // Upsert into profiles (in case trigger missed it or just to be safe/update)
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: userId,
            username: email.split('@')[0], // Default username
            tokens_balance: initial_tokens
        }, { onConflict: 'id' });

        if (profileError) console.error("Profile upsert warning:", profileError);


        // 5. Generate Magic Link (Recovery/Set Password)
        console.log(`[Onboarding] Generating Magic Link...`);
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email
        });

        if (linkError) throw linkError;
        const magicLink = linkData.properties.action_link;


        // 6. Send Email via IONOS
        console.log(`[Onboarding] Sending Email to ${email}...`);
        const transporter = nodemailer.createTransport({
            host: "smtp.ionos.es", // Hardcoded per user BBLA
            port: 587,
            secure: false, // TLS
            auth: {
                user: "support@luxscaler.com",
                pass: "supportluxscaler",
            },
        });

        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 8px;">
          <h1 style="color: #fff; text-align: center; letter-spacing: 2px;">LUXSCALER™</h1>
          <hr style="border: 1px solid #333;" />
          <h2 style="color: #A0A0A0;">BETA ACCESS GRANTED</h2>
          <p>Hello ${name || 'Creator'},</p>
          <p>Your official beta account has been provisioned.</p>
          <div style="background: #111; padding: 20px; border-left: 4px solid #00D4FF; margin: 20px 0;">
              <strong>Initial Limit:</strong> ${initial_tokens} Tokens<br/>
              <strong>Status:</strong> Active<br/>
              <strong>Engine Access:</strong> PhotoScaler, StyleScaler, LightScaler
          </div>
          <p>Click the button below to secure your account and set your password. This link is valid for 24 hours.</p>
          <div style="text-align: center; margin: 40px 0;">
              <a href="${magicLink}" style="background: #fff; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 4px; display: inline-block;">SECURE ACCOUNT & ENTER &rarr;</a>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">
              If the button doesn't work, copy this link:<br/>
              <a href="${magicLink}" style="color: #666;">${magicLink}</a>
          </p>
      </div>
    `;

        await transporter.sendMail({
            from: '"LuxScaler Support" <support@luxscaler.com>',
            to: email,
            subject: "LUXSCALER: Beta Access & Credits Granted",
            html: emailHtml,
        });

        console.log(`[Onboarding] Success.`);

        return new Response(
            JSON.stringify({ success: true, userId, message: "User onboarded, tokens sent, magic link emailed." }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error(`[Onboarding] Error:`, error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
