# LuxScaler Supabase MCP Toolkit

This directory contains the "Agentic MCP" tools for managing Supabase operations.
These scripts wrap standard `npx supabase` commands or custom logic (like the migration tunnel) to provide a reliable, authenticated interface for AI Agents.

## Tools

### `list_projects.ps1`

**Purpose:** Lists available Supabase projects and verifies environment connectivity.
**Usage:** `.\scripts\mcp\list_projects.ps1`

### `sync_types.ps1`

**Purpose:** Generates TypeScript types from the database and updates `src/types/supabase.ts`.
**Usage:** `.\scripts\mcp\sync_types.ps1`

### `deploy_function.ps1`

**Purpose:** Deploys a specific Edge Function.
**Usage:** `.\scripts\mcp\deploy_function.ps1 -FunctionName <name>`

### `apply_migration.ps1`

**Purpose:** Applies a SQL migration using the "Migration Runner" Edge Function Tunnel.
**Usage:** `.\scripts\mcp\apply_migration.ps1 -SqlFile <path_to_sql_file>`
