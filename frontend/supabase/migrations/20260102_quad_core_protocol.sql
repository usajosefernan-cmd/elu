
-- 20260102_quad_core_protocol.sql

-- 1. JOBS TABLE (Session)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    status TEXT CHECK (status IN ('pending', 'processing', 'stitching', 'completed', 'failed')),
    input_url TEXT NOT NULL,
    final_url TEXT,
    meta JSONB DEFAULT '{}'::jsonb, -- Stores seed, style, cost_cogs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. JOB TILES TABLE (Quadrants)
CREATE TABLE IF NOT EXISTS job_tiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    quadrant VARCHAR(10), -- 'Q1', 'Q2', 'Q3', 'Q4'
    storage_path TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RLS POLICIES (Security)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_tiles ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own jobs
CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Allow users to view tiles of their jobs
CREATE POLICY "Users can view own tiles" ON job_tiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_tiles.job_id AND jobs.user_id = auth.uid())
);

-- 4. REALTIME
-- Enable Realtime for these tables so frontend can poll them effectively
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table job_tiles;
