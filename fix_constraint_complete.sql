-- Complete Fix: Update constraint to allow 'builder', 'project', 'investor'
-- and update 'startup' to 'project'
-- Run this SQL in Supabase SQL Editor

-- STEP 1: Drop the existing constraint (only allows 'investor' and 'startup')
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_type_check;

-- STEP 2: Create new constraint with correct values: 'builder', 'project', 'investor'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_type_check 
CHECK (type IN ('builder', 'project', 'investor'));

-- STEP 3: Update 'startup' to 'project' in existing data
UPDATE profiles 
SET type = 'project' 
WHERE type = 'startup';

-- STEP 4: Verify the constraint
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles' 
AND con.conname = 'profiles_type_check';

-- STEP 5: Verify updated data
SELECT DISTINCT type, COUNT(*) as count 
FROM profiles 
GROUP BY type;

-- STEP 6: Test - Check what investor should see
SELECT id, type, name, niches 
FROM profiles 
WHERE type IN ('builder', 'project') 
ORDER BY created_at DESC 
LIMIT 20;

