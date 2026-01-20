ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS current_config JSONB;
