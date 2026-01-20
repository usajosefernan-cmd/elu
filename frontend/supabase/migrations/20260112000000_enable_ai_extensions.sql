-- Enable support for vector embeddings (AI Search)
create extension if not exists vector with schema extensions;

-- Enable job scheduling (Maintenance tasks)
create extension if not exists pg_cron with schema extensions;

-- Enable network requests (Webhooks/Edge Functions)
create extension if not exists pg_net with schema extensions;

-- NOTE: Ensure your project is on a plan that supports these extensions.
