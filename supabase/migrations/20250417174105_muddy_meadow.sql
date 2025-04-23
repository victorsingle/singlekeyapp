/*
  # Fix RLS policies for users table

  1. Changes
    - Enable RLS on users table
    - Add policy for unauthenticated users to insert during signup
    - Add policy for authenticated users to read/update their own data
    - Add policy for authenticated users to delete their own data

  2. Security
    - Ensures users can only access their own data
    - Allows new user registration
    - Maintains data isolation between users
*/

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Usuário pode inserir seus próprios dados" ON users;
DROP POLICY IF EXISTS "Usuário pode ver seus próprios dados" ON users;
DROP POLICY IF EXISTS "Usuário pode editar seus próprios dados" ON users;
DROP POLICY IF EXISTS "Usuário pode deletar seus próprios dados" ON users;
DROP POLICY IF EXISTS "Allow reading email confirmation status" ON users;

-- Create new policies

-- Allow new user registration (no auth required for insert)
CREATE POLICY "Allow user registration"
ON users
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own data
CREATE POLICY "Users can delete own data"
ON users
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);