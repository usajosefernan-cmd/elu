-- 20260117_add_dependencies.sql
-- Implementación de la Estrategia Integrada (Grafo de Dependencias + Smart Diff)

-- 1. Create Dependencies Table
CREATE TABLE IF NOT EXISTS public.section_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL, -- La sección que TIENE la dependencia
    depends_on_section_id UUID NOT NULL, -- La sección de la que DEPENDE
    dependency_type TEXT DEFAULT 'reference', -- 'reference', 'data', 'blocker'
    impact_weight INTEGER DEFAULT 5, -- 1-10, qué tanto afecta un cambio
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Foreign Keys (Assuming document_sections exists based on previous code context)
    CONSTRAINT fk_section_source FOREIGN KEY (section_id) REFERENCES public.document_sections(id) ON DELETE CASCADE,
    CONSTRAINT fk_section_target FOREIGN KEY (depends_on_section_id) REFERENCES public.document_sections(id) ON DELETE CASCADE,
    
    -- Avoid duplicates
    UNIQUE(section_id, depends_on_section_id)
);

-- 2. Add Review Flags to Document Sections
-- Esto permite el flujo de "Propagación de Impacto"
ALTER TABLE public.document_sections 
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS review_reason TEXT,
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ DEFAULT now();

-- 3. Indexes for Performance (Graph Traversal)
CREATE INDEX IF NOT EXISTS idx_dependencies_source ON public.section_dependencies(section_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_target ON public.section_dependencies(depends_on_section_id);
CREATE INDEX IF NOT EXISTS idx_sections_needs_review ON public.document_sections(document_id) WHERE needs_review = true;

-- 4. RLS Policies (Enable Read/Write for Authenticated Users)
ALTER TABLE public.section_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.section_dependencies
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.section_dependencies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.section_dependencies
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.section_dependencies
    FOR DELETE USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.section_dependencies IS 'Grafo de dependencias entre secciones para la Estrategia Integrada de Ideas.';
