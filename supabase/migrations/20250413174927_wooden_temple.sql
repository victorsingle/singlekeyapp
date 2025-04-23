/*
  # Initial Schema for SingleKey OKR Platform

  1. New Tables
    - `okr_cycles`
      - `id` (uuid, primary key)
      - `name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text)
      - `strategic_theme` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `okrs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `cycle_id` (uuid, foreign key)
      - `context` (text)
      - `objective` (text)
      - `type` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `key_results`
      - `id` (uuid, primary key)
      - `okr_id` (uuid, foreign key)
      - `text` (text)
      - `metric` (text)
      - `initial_value` (numeric)
      - `target_value` (numeric)
      - `unit` (text)
      - `progress` (numeric)
      - `status` (text)
      - `owner_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum types for status and OKR type
CREATE TYPE okr_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE okr_type AS ENUM ('moonshot', 'roofshot');

-- Create OKR Cycles table
CREATE TABLE IF NOT EXISTS okr_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status okr_status NOT NULL DEFAULT 'draft',
  strategic_theme text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create OKRs table
CREATE TABLE IF NOT EXISTS okrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id uuid REFERENCES okr_cycles(id) ON DELETE CASCADE,
  context text,
  objective text NOT NULL,
  type okr_type NOT NULL,
  status okr_status NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Key Results table
CREATE TABLE IF NOT EXISTS key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id uuid REFERENCES okrs(id) ON DELETE CASCADE,
  text text NOT NULL,
  metric text,
  initial_value numeric,
  target_value numeric,
  unit text,
  progress numeric DEFAULT 0,
  status okr_status NOT NULL DEFAULT 'draft',
  owner_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE okr_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own cycles"
  ON okr_cycles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles"
  ON okr_cycles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles"
  ON okr_cycles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own OKRs"
  ON okrs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OKRs"
  ON okrs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OKRs"
  ON okrs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own key results"
  ON key_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM okrs
      WHERE okrs.id = key_results.okr_id
      AND okrs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert key results for own OKRs"
  ON key_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM okrs
      WHERE okrs.id = key_results.okr_id
      AND okrs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own key results"
  ON key_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM okrs
      WHERE okrs.id = key_results.okr_id
      AND okrs.user_id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_okr_cycles_updated_at
    BEFORE UPDATE ON okr_cycles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_okrs_updated_at
    BEFORE UPDATE ON okrs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at
    BEFORE UPDATE ON key_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();