-- LUXCANVAS PHASE 6: PROJECTS & DOCUMENT ARCHITECTURE
-- 2026-01-15: Adding structure for Project Management + GitHub Linking

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

-- RLS for Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = owner_id);


-- 2. DOCUMENTS TABLE (Links to Project)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    current_content TEXT, -- Cache of latest version
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_edited_by UUID REFERENCES auth.users(id)
);

-- RLS for Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view docs of own projects" ON public.documents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.projects WHERE id = public.documents.project_id AND owner_id = auth.uid())
    );

CREATE POLICY "Users can insert docs to own projects" ON public.documents
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.projects WHERE id = public.documents.project_id AND owner_id = auth.uid())
    );

CREATE POLICY "Users can update docs of own projects" ON public.documents
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.projects WHERE id = public.documents.project_id AND owner_id = auth.uid())
    );

-- 3. MIGRATE VERSIONS (Soft Link to Hard Link)
-- Add document_id to existing versions table
ALTER TABLE public.document_versions 
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE;

-- (Optional) We don't drop 'document_title' yet to preserve legacy data until full migration script runs in backend logic.
-- Ideally we would:
-- 1. Create a "Default Project" for each user.
-- 2. Create "Document" entries for each unique 'document_title' in versions.
-- 3. Update 'document_versions.document_id'.
