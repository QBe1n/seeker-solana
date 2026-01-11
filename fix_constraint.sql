-- Fix Supabase profiles_type_check constraint
-- Run this SQL in Supabase SQL Editor

-- First, check current constraint definition
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles' 
AND con.conname LIKE '%type%';

-- Drop the existing constraint if it exists
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_type_check;

-- Create correct constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_type_check 
CHECK (type IN ('builder', 'project', 'investor'));

-- Verify the constraint
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles' 
AND con.conname = 'profiles_type_check';

