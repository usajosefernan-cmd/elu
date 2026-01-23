// LuxScaler v40.0 - Save Preset with Seed + Temperature
// Supabase Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      name, 
      seed, 
      temperature, 
      sliders,
      sliders_config,  // Alternative name
      user_id,
      mode = "CREATIVE",
      thumbnail_url
    } = body;

    // Validate required fields
    if (!name) {
      return new Response(
        JSON.stringify({ success: false, error: "Name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (seed === undefined || seed === null) {
      return new Response(
        JSON.stringify({ success: false, error: "Seed is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (temperature === undefined || temperature === null) {
      return new Response(
        JSON.stringify({ success: false, error: "Temperature is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const slidersConfig = sliders || sliders_config || {};

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert preset
    const { data, error } = await supabase
      .from("user_presets")
      .insert([
        {
          user_id: user_id || null,
          name: name,
          seed: seed,
          temperature: temperature,
          sliders_config: slidersConfig,
          mode: mode,
          thumbnail_url: thumbnail_url || null
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("[save-preset] DB Error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        preset: data,
        message: `Preset "${name}" saved successfully with seed ${seed}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[save-preset] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
