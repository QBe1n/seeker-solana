-- Fix: Update constraint to allow 'project' and update 'startup' to 'project'
-- Run this SQL in Supabase SQL Editor step by step

-- STEP 1: Check current constraint definition
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles' 
AND con.conname LIKE '%type%';

-- STEP 2: Check current type values
SELECT DISTINCT type, COUNT(*) as count 
FROM profiles 
GROUP BY type;

-- STEP 3: Drop the existing constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_type_check;

-- STEP 4: Create new constraint with 'project' instead of 'startup'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_type_check 
CHECK (type IN ('builder', 'project', 'investor'));

-- STEP 5: Now update 'startup' to 'project'
UPDATE profiles 
SET type = 'project' 
WHERE type = 'startup';

-- STEP 6: Verify the update
SELECT DISTINCT type, COUNT(*) as count 
FROM profiles 
GROUP BY type;

-- STEP 7: Verify constraint is working
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles' 
AND con.conname = 'profiles_type_check';

-- STEP 8: Check profiles that investor should see now
SELECT id, type, name, niches 
FROM profiles 
WHERE type IN ('builder', 'project') 
ORDER BY created_at DESC 
LIMIT 20;

