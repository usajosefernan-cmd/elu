ALTER TABLE "public"."variations" ADD COLUMN IF NOT EXISTS "usage_meta" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."variations" ADD COLUMN IF NOT EXISTS "cost_cogs" double precision DEFAULT 0;
ALTER TABLE "public"."variations" ADD COLUMN IF NOT EXISTS "engineering_report" jsonb DEFAULT '{}'::jsonb;
