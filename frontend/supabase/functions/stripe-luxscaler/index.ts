import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@14.14.0"; // Using same version as stripe-manager

console.log("Stripe Webhook Handler (LuxScaler) Up!");

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

// Crypto provider for signature verification
const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");

    // Verify method
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    if (!signature) {
        return new Response("No signature header", { status: 400 });
    }

    const body = await req.text();
    let event;

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
            undefined,
            cryptoProvider
        );
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    console.log(`🔔 Event received: ${event.type}`);

    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        // Usamos Service Role Key para poder escribir en cualquier tabla sin restricciones de RLS de usuario
        // (Ya que el webhook no tiene sesión de usuario)
    );

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log(`Processing checkout session: ${session.id}`);
                await handleCheckoutSessionCompleted(session, supabaseClient);
                break;

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                await handleSubscriptionUpdated(subscription, supabaseClient);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (err) {
        console.error(`Error processing event: ${err.message}`);
        // Return 200 to acknowledge receipt anyway so Stripe doesn't retry indefinitely for logic errors
        // Pero si es crítico, 500.
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    });
});

// --- Handlers ---

async function handleCheckoutSessionCompleted(session: any, supabase: any) {
    // Logic: 
    // 1. Get user_id (from client_reference_id or metadata)
    // 2. Grant tokens (Lumens)
    // 3. Record transaction

    const userId = session.client_reference_id || session.metadata?.user_id;
    const customerEmail = session.customer_details?.email;

    if (!userId) {
        console.error("No user_id found in session");
        return;
    }

    console.log(`Granting access to user ${userId} (${customerEmail})`);

    // TODO: Check database schema for how to add credits. 
    // Assuming 'profiles' table has 'credits' field, or 'transactions' table.
    // For now, logging the success. 
    // Implement logic based on line_items or amount_total.
}

async function handleSubscriptionUpdated(sub: any, supabase: any) {
    console.log(`Subscription ${sub.id} status is ${sub.status}`);
    // Update user subscription status in DB
}
