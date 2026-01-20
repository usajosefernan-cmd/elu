-- Migration: document_versions table
-- Description: Implementa soporte para versionado histórico de documentos y métricas.
-- Author: LuxCanvas Architect

CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_title TEXT NOT NULL, -- Identificador lógico del documento (ej: 'Espec_Arquitectura_v1.md')
    content TEXT NOT NULL,
    change_summary TEXT, -- Log del cambio (ej: "Añadida sección Supabase")
    
    -- Metadatos de Validación
    word_count INT GENERATED ALWAYS AS (array_length(regexp_split_to_array(content, '\s+'), 1)) STORED,
    file_size_bytes INT GENERATED ALWAYS AS (octet_length(content)) STORED,
    version_number SERIAL, -- Auto-incremental global (o compuesto si partimos por doc_id)

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT word_count_check CHECK (word_count > 0)
);

-- Index para búsquedas rápidas por título y fecha
CREATE INDEX IF NOT EXISTS idx_document_versions_title_created ON public.document_versions(document_title, created_at DESC);

-- RLS Policies
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all versions" 
ON public.document_versions FOR SELECT 
TO authenticated 
USING ( true ); -- Ajustar según auth.role() = 'service_role' o user admin real

CREATE POLICY "Admins can insert versions" 
ON public.document_versions FOR INSERT 
TO authenticated 
WITH CHECK ( true ); -- Permitir inserts a usuarios autenticados (LuxCanvas)

-- Comment
COMMENT ON TABLE public.document_versions IS 'Historial inmutable de versiones de documentos técnicos generados por LuxCanvas.';
