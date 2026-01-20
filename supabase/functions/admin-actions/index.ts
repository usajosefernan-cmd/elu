import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, payload } = await req.json()

    if (action === 'get_dashboard_stats') {
      // 1. Count Users
      const { count: userCount, error: userError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
      
      if (userError) throw userError

      // 2. Count Generations (processing_jobs)
      const { count: genCount, error: genError } = await supabase
        .from('processing_jobs')
        .select('*', { count: 'exact', head: true })

      if (genError) throw genError

      // 3. Waitlist count
      const { count: waitlistCount } = await supabase
        .from('beta_waitlist') // Assuming table exists or will exist
        .select('*', { count: 'exact', head: true })

      return new Response(
        JSON.stringify({
          stats: {
            users: userCount || 0,
            generations: genCount || 0,
            variations: (genCount || 0) * 4, // Estimate
            waitlist: waitlistCount || 0,
            total_cost: (genCount || 0) * 0.12 // Mock cost calculation
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get_generations_log') {
        const { page = 0, limit = 10 } = payload
        const from = page * limit
        const to = from + limit - 1

        const { data, count, error } = await supabase
            .from('processing_jobs')
            .select('*, user_profiles(email)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) throw error

        return new Response(
            JSON.stringify({ data, count }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
