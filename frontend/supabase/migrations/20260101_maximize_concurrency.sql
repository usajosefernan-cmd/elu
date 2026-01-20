
-- 20260101_maximize_concurrency.sql

-- 1. Index for fast polling (status check + FIFO ordering)
CREATE INDEX IF NOT EXISTS idx_queue_manager_status_created_at 
ON queue_manager (status, created_at);

-- 2. Index for finding old user rows quickly only if not already there
CREATE INDEX IF NOT EXISTS idx_queue_manager_user_id 
ON queue_manager (user_id);
