import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

// SQL with escaped quotes (no $$ delimiters) for TypeScript compatibility
const COMPLETE_SEED_SQL = `
-- LUXCANVAS PHASE 6: PROJECTS & DOCUMENT ARCHITECTURE
-- 1. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    github_repo_url TEXT,
    github_branch TEXT DEFAULT 'main',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
    DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
    DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
    DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
    
    CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = owner_id);
    CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
    CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = owner_id);
    CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = owner_id);
END $$;

-- 2. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    current_content TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_edited_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view docs of own projects" ON public.documents;
    DROP POLICY IF EXISTS "Users can insert docs to own projects" ON public.documents;
    DROP POLICY IF EXISTS "Users can update docs of own projects" ON public.documents;

    CREATE POLICY "Users can view docs of own projects" ON public.documents 
        FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE id = public.documents.project_id AND owner_id = auth.uid()));

    CREATE POLICY "Users can insert docs to own projects" ON public.documents 
        FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = public.documents.project_id AND owner_id = auth.uid()));

    CREATE POLICY "Users can update docs of own projects" ON public.documents 
        FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE id = public.documents.project_id AND owner_id = auth.uid()));
END $$;

-- 3. LINK VERSIONS TO DOCUMENTS
ALTER TABLE public.document_versions 
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_versions_document_id ON public.document_versions(document_id);

COMMENT ON TABLE public.projects IS 'Contenedor principal de LuxCanvas (Repositorios/Proyectos)';
`;


Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const databaseUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!databaseUrl) {
      throw new Error("SUPABASE_DB_URL not configured");
    }

    const sql = postgres(databaseUrl, { max: 1 });

    const { query } = await req.json();
    if (!query) {
      throw new Error("Missing 'query' in request body");
    }

    console.log("[MIGRATION-RUNNER] Executing DYNAMIC SQL...");
    console.log("Length:", query.length);

    const result = await sql.unsafe(query);

    console.log("[MIGRATION-RUNNER] SUCCESS");
    await sql.end();

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[MIGRATION-RUNNER] ERROR:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

