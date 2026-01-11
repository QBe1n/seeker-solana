-- Fix: Update 'startup' type to 'project' in Supabase
-- Run this SQL in Supabase SQL Editor

-- 1. First check current constraint
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles' 
AND con.conname LIKE '%type%';

-- 2. Check all unique type values before update
SELECT DISTINCT type, COUNT(*) as count 
FROM profiles 
GROUP BY type;

-- 3. Temporarily disable constraint if needed (optional, try without first)
-- ALTER TABLE profiles DISABLE TRIGGER ALL;

-- 4. Update 'startup' to 'project'
UPDATE profiles 
SET type = 'project' 
WHERE type = 'startup';

-- 5. Verify the update
SELECT DISTINCT type, COUNT(*) as count 
FROM profiles 
GROUP BY type;

-- 6. Verify constraint still works
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles' 
AND con.conname LIKE '%type%';

-- 7. Check profiles that investor should see now
SELECT id, type, name, niches 
FROM profiles 
WHERE type IN ('builder', 'project') 
ORDER BY created_at DESC 
LIMIT 20;

