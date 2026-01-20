
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.run/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

declare const Deno: any;

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { action, payload } = await req.json()
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Needed for admin powers
        )

        // 1. Verify Caller is Admin
        const authHeader = req.headers.get('Authorization')!
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
        if (!profile?.is_admin) throw new Error('Forbidden: Admins Only')

        // --- READ ACTIONS (BYPASS RLS) ---

        if (action === 'get_dashboard_stats') {
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: genCount } = await supabase.from('generations').select('*', { count: 'exact', head: true });
            const { count: varCount } = await supabase.from('variations').select('*', { count: 'exact', head: true });
            const { count: waitCount } = await supabase.from('beta_waitlist').select('*', { count: 'exact', head: true }).eq('status', 'pending');

            let totalCost = 0;
            // Calculating cost safely
            try {
                const { data: costData } = await supabase.from('variations').select('cost_cogs');
                if (costData) {
                    totalCost = costData.reduce((acc: number, curr: any) => acc + (curr.cost_cogs || 0), 0);
                }
            } catch (e) {
                console.warn("Cost stats error:", e);
            }

            return new Response(JSON.stringify({
                stats: {
                    users: userCount || 0,
                    generations: genCount || 0,
                    variations: varCount || 0,
                    waitlist: waitCount || 0,
                    total_cost: totalCost
                }
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'get_generations_log') {
            const { page = 0, limit = 10 } = payload;
            const from = page * limit;
            const to = from + limit - 1;

            const { data, count, error } = await supabase.from('generations').select(`
            id, user_id, status, created_at, original_image_path, original_image_thumbnail,
            semantic_analysis,
            variations ( id, rating, style_id, prompt_payload, image_path )
        `, { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);

            if (error) throw error;

            return new Response(JSON.stringify({ data, count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'get_session_details') {
            const { sessionId } = payload;
            const { data, error } = await supabase.from('generations')
                .select(`*, variations ( * )`)
                .eq('id', sessionId)
                .single();

            if (error) throw error;
            return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // --- WRITE ACTIONS ---

        if (action === 'approve_waitlist') {
            const { email, name, waitlistId } = payload;
            const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + "!";

            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name: name }
            });

            if (createError) throw createError;

            await supabase.from('beta_waitlist').update({ status: 'approved' }).eq('id', waitlistId);
            await supabase.from('profiles').update({ tokens_balance: 500 }).eq('id', newUser.user.id);

            return new Response(JSON.stringify({
                success: true,
                credentials: { email, password: tempPassword },
                message: "User created."
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'delete_storage_files') {
            const { bucket, paths } = payload;
            if (!bucket || !paths || !Array.isArray(paths)) throw new Error("Invalid payload");

            const { data, error } = await supabase.storage.from(bucket).remove(paths);
            if (error) throw error;

            return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'delete_generation_force') {
            const { generationId } = payload;
            const { error } = await supabase.from('generations').delete().eq('id', generationId);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        throw new Error('Unknown Action')

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }
})
