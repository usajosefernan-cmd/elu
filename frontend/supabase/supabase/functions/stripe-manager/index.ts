import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Stripe Manager Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Initialize Stripe
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16', // Use a fixed version or latest
            httpClient: Stripe.createFetchHttpClient(),
        });

        const { action, payload } = await req.json();

        if (action === 'list_products') {
            const products = await stripe.products.list({
                limit: 100,
                active: true,
                expand: ['data.default_price']
            });

            // Also fetch prices separately if needed or just rely on expand
            // Let's format it nicer for frontend
            const formatted = products.data.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                active: p.active,
                image: p.images[0],
                price: p.default_price
            }));

            return new Response(JSON.stringify({ data: formatted }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (action === 'get_subscriptions') {
            const subs = await stripe.subscriptions.list({
                limit: 20,
                status: 'active',
                expand: ['data.customer']
            });
            return new Response(JSON.stringify({ data: subs.data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Action not found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
