-- Add chat_history column to documents table to persist Gemini conversations
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS chat_history JSONB;

-- Comment
COMMENT ON COLUMN public.documents.chat_history IS 'Historial de chat persistente (JSONB) para la sesión de LuxCanvas.';
