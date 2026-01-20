ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS user_mode TEXT CHECK (user_mode IN ('auto', 'user', 'pro', 'prolux'));

CREATE OR REPLACE FUNCTION is_admin(user_id UUID) RETURNS BOOLEAN AS $$
DECLARE
    u_mode TEXT;
BEGIN
    SELECT user_mode INTO u_mode FROM user_profiles WHERE id = user_id;
    RETURN u_mode = 'prolux';
END;
$$ LANGUAGE plpgsql;
