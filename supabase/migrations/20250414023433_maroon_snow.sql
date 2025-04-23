/*
  # Add OKR Links for Relationship Mapping

  1. New Tables
    - `okr_links`
      - `id` (uuid, primary key)
      - `source_id` (uuid, foreign key to key_results)
      - `target_okr_id` (uuid, foreign key to okrs)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Add validation constraints

  3. Changes
    - Add link_type to okr_links table
    - Add constraints to enforce valid connections
*/

-- Create link_type enum
CREATE TYPE okr_link_type AS ENUM (
  'tactical_to_strategic',
  'operational_to_tactical'
);

-- Create OKR Links table
CREATE TABLE IF NOT EXISTS okr_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
  target_okr_id uuid NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
  link_type okr_link_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Prevent duplicate connections
  UNIQUE(source_id, target_okr_id),
  
  -- Ensure source and target are different
  CONSTRAINT different_source_target CHECK (source_id != target_okr_id)
);

-- Enable RLS
ALTER TABLE okr_links ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_okr_links_updated_at
    BEFORE UPDATE ON okr_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create policies
CREATE POLICY "Users can read own links"
  ON okr_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own links"
  ON okr_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links"
  ON okr_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links"
  ON okr_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to validate link types
CREATE OR REPLACE FUNCTION validate_okr_link()
RETURNS TRIGGER AS $$
DECLARE
  source_okr_type okr_type;
  target_okr_type okr_type;
BEGIN
  -- Get the types of the connected OKRs
  SELECT o.type INTO target_okr_type
  FROM okrs o
  WHERE o.id = NEW.target_okr_id;
  
  SELECT o.type INTO source_okr_type
  FROM okrs o
  JOIN key_results kr ON kr.okr_id = o.id
  WHERE kr.id = NEW.source_id;
  
  -- Validate connections based on link_type
  IF NEW.link_type = 'tactical_to_strategic' AND 
     (source_okr_type != 'tactical' OR target_okr_type != 'strategic') THEN
    RAISE EXCEPTION 'Invalid tactical to strategic connection';
  END IF;
  
  IF NEW.link_type = 'operational_to_tactical' AND
     (source_okr_type != 'operational' OR target_okr_type != 'tactical') THEN
    RAISE EXCEPTION 'Invalid operational to tactical connection';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for link validation
CREATE TRIGGER validate_okr_link_trigger
  BEFORE INSERT OR UPDATE ON okr_links
  FOR EACH ROW
  EXECUTE FUNCTION validate_okr_link();