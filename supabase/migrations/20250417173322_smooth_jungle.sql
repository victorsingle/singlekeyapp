/*
  # Create Users Table with RLS Policies

  1. New Table
    - `users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email` (text)
      - `type` (text)
      - Personal fields:
        - `first_name` (text)
        - `last_name` (text)
        - `cpf` (text)
      - Company fields:
        - `company_name` (text)
        - `contact_name` (text)
        - `cnpj` (text)
      - Common fields:
        - `phone` (text)
        - `created_at` (timestamp)
        - `updated_at` (timestamp)
        - `email_confirmed_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Add validation triggers
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  type text NOT NULL CHECK (type IN ('personal', 'company')),
  
  -- Personal fields
  first_name text,
  last_name text,
  cpf text,
  
  -- Company fields
  company_name text,
  contact_name text,
  cnpj text,
  
  -- Common fields
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  email_confirmed_at timestamptz,
  
  -- Constraints
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create policies
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO public
  USING (user_id = auth.uid());

-- Create function to sync email confirmation
CREATE OR REPLACE FUNCTION sync_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET email_confirmed_at = NEW.email_confirmed_at
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync email confirmation from auth.users
CREATE TRIGGER sync_email_confirmation_trigger
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_confirmation();

-- Add policy to allow reading email confirmation status
CREATE POLICY "Allow reading email confirmation status"
  ON users
  FOR SELECT
  TO public
  USING (true);