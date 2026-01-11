-- SQL queries to check Supabase profiles table
-- Run these in Supabase SQL Editor

-- 1. Check all profiles and their types
SELECT id, type, name, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 20;

-- 2. Count profiles by type
SELECT type, COUNT(*) as count 
FROM profiles 
GROUP BY type;

-- 3. Check if there are any profiles with type 'startup' instead of 'project'
SELECT id, type, name 
FROM profiles 
WHERE type LIKE '%startup%' OR type LIKE '%Startup%';

-- 4. Check all unique type values
SELECT DISTINCT type 
FROM profiles;

-- 5. If you have 'startup' type, you might need to update them to 'project':
-- UPDATE profiles SET type = 'project' WHERE type = 'startup';
-- (Uncomment the line above if needed)

-- 6. Check for investor profiles (since user is investor)
SELECT id, type, name 
FROM profiles 
WHERE type = 'investor';

-- 7. Check what investor should see (builders and projects)
SELECT id, type, name, niches 
FROM profiles 
WHERE type IN ('builder', 'project') 
ORDER BY created_at DESC 
LIMIT 20;

