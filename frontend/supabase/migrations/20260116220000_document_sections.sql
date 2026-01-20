-- Migration: document_sections table
-- Description: Implementa secciones atómicas con orden explícito para documentos estructurados.
-- Author: LuxCanvas Architect (Antigravity Agent)
-- Date: 2026-01-16

-- Tabla de secciones atómicas
CREATE TABLE IF NOT EXISTS public.document_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    
    -- Estructura
    order_index INT NOT NULL DEFAULT 0,     -- Orden de renderizado (100, 200, 300...)
    section_title TEXT NOT NULL,            -- Título del encabezado (sin los #)
    content TEXT NOT NULL DEFAULT '',       -- Cuerpo de la sección
    level INT NOT NULL DEFAULT 2,           -- Nivel de encabezado (## = 2, ### = 3)
    
    -- Metadatos calculados
    word_count INT GENERATED ALWAYS AS (
        COALESCE(array_length(regexp_split_to_array(NULLIF(content, ''), '\s+'), 1), 0)
    ) STORED,
    
    -- Control
    is_locked BOOLEAN DEFAULT FALSE,        -- Proteger secciones críticas
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Unicidad compuesta: un título por documento
    CONSTRAINT unique_section_per_doc UNIQUE (document_id, section_title)
);

-- Índice para reconstrucción rápida ordenada
CREATE INDEX IF NOT EXISTS idx_sections_doc_order 
ON public.document_sections(document_id, order_index);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_section_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_section_updated ON public.document_sections;
CREATE TRIGGER trg_section_updated
BEFORE UPDATE ON public.document_sections
FOR EACH ROW EXECUTE FUNCTION update_section_timestamp();

-- RLS Policies
ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sections" 
ON public.document_sections FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert sections" 
ON public.document_sections FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sections" 
ON public.document_sections FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete sections" 
ON public.document_sections FOR DELETE 
TO authenticated 
USING (true);

-- Comment
COMMENT ON TABLE public.document_sections IS 'Secciones atómicas con orden explícito para documentos estructurados en LuxCanvas.';
