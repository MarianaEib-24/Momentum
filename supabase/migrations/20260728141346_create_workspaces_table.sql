/*
# Create workspaces table for per-user data persistence

1. Purpose
   Momentum is a workspace app (projects, habits, goals, journal, etc.).
   Each user's entire workspace is stored as a single JSON blob, scoped to
   the authenticated user. This replaces the old Express + lowdb file-based
   backend with Supabase auth + database persistence.

2. New Tables
   - `workspaces`
     - `id` (uuid, primary key, default gen_random_uuid())
     - `user_id` (uuid, NOT NULL, default auth.uid(), references auth.users ON DELETE CASCADE)
     - `payload` (jsonb, nullable — holds the full workspace data blob)
     - `created_at` (timestamptz, default now())
     - `updated_at` (timestamptz, default now())

3. Security (RLS)
   - RLS enabled on `workspaces`.
   - Four owner-scoped policies (SELECT / INSERT / UPDATE / DELETE), all
     scoped TO authenticated with auth.uid() = user_id ownership checks.
   - user_id defaults to auth.uid() so frontend inserts that omit user_id
     still satisfy the INSERT WITH CHECK policy.

4. Notes
   - One row per user (enforced by unique constraint on user_id).
   - The frontend upserts the entire payload on every save.
*/

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS workspaces_user_id_key ON workspaces (user_id);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_workspace" ON workspaces;
CREATE POLICY "select_own_workspace" ON workspaces FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_workspace" ON workspaces;
CREATE POLICY "insert_own_workspace" ON workspaces FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_workspace" ON workspaces;
CREATE POLICY "update_own_workspace" ON workspaces FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_workspace" ON workspaces;
CREATE POLICY "delete_own_workspace" ON workspaces FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
