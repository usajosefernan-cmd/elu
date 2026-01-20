-- Create user_presets table
CREATE TABLE IF NOT EXISTS public.user_presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_presets ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own presets" ON public.user_presets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presets" ON public.user_presets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presets" ON public.user_presets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presets" ON public.user_presets
    FOR DELETE USING (auth.uid() = user_id);
