/*
  # Fix RLS policies for OKRs and OKR links

  1. Changes
    - Add missing RLS policies for okrs table
    - Add missing RLS policies for okr_links table
    - Ensure proper user access control

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read their own records
      - Create new records with their user_id
      - Update their own records
      - Delete their own records
*/

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can read own OKRs" ON okrs;
DROP POLICY IF EXISTS "Users can insert own OKRs" ON okrs;
DROP POLICY IF EXISTS "Users can update own OKRs" ON okrs;
DROP POLICY IF EXISTS "Users can delete own OKRs" ON okrs;

DROP POLICY IF EXISTS "Users can read own links" ON okr_links;
DROP POLICY IF EXISTS "Users can insert own links" ON okr_links;
DROP POLICY IF EXISTS "Users can update own links" ON okr_links;
DROP POLICY IF EXISTS "Users can delete own links" ON okr_links;

-- Enable RLS
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_links ENABLE ROW LEVEL SECURITY;

-- Policies for okrs table
CREATE POLICY "Users can read own OKRs"
  ON okrs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own OKRs"
  ON okrs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own OKRs"
  ON okrs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own OKRs"
  ON okrs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for okr_links table
CREATE POLICY "Users can read own links"
  ON okr_links
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM okrs
      WHERE (okrs.id = okr_links.source_okr_id OR okrs.id = okr_links.target_okr_id)
      AND okrs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own links"
  ON okr_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM okrs
      WHERE okrs.id = okr_links.source_okr_id
      AND okrs.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM okrs
      WHERE okrs.id = okr_links.target_okr_id
      AND okrs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own links"
  ON okr_links
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM okrs
      WHERE (okrs.id = okr_links.source_okr_id OR okrs.id = okr_links.target_okr_id)
      AND okrs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM okrs
      WHERE okrs.id = okr_links.source_okr_id
      AND okrs.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM okrs
      WHERE okrs.id = okr_links.target_okr_id
      AND okrs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own links"
  ON okr_links
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM okrs
      WHERE (okrs.id = okr_links.source_okr_id OR okrs.id = okr_links.target_okr_id)
      AND okrs.user_id = auth.uid()
    )
  );