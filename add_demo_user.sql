-- Add Demo User to Supabase Database
-- Run this SQL in Supabase SQL Editor
--
-- IMPORTANT: You must create the auth user FIRST using one of these methods:
--
-- Method 1: Via Supabase Dashboard (Easiest)
--   1. Go to Authentication → Users → Add User
--   2. Email: demo@skr.com
--   3. Password: 123456
--   4. Auto Confirm User: Yes (check this box)
--   5. Click "Create User"
--   6. Copy the User ID (UUID) from the created user
--
-- Method 2: Via Supabase CLI or Management API
--   Use: supabase.auth.admin.createUser()
--
-- After creating the auth user, run the SQL below to create the profile.
-- Replace 'USER_ID_HERE' with the actual UUID from the auth user you just created.

-- STEP 1: Check if user already exists
SELECT id, email 
FROM auth.users 
WHERE email = 'demo@skr.com';

-- STEP 2: If user exists, get their ID and use it below
-- If user doesn't exist, create it via Dashboard first, then run STEP 3

-- STEP 3: Create profile for demo user
-- Replace 'USER_ID_HERE' with the actual user_id from auth.users
INSERT INTO profiles (
  user_id,
  type,
  name,
  bio,
  niches,
  likes_today,
  is_premium,
  created_at
) VALUES (
  'USER_ID_HERE', -- Replace with actual user_id UUID from auth.users
  'project', -- or 'investor' depending on what you want
  'Demo Project',
  'This is a demo account for testing the Seeker app',
  ARRAY['SaaS', 'AI/ML', 'FinTech'], -- Array of niches
  20, -- Daily likes (20 for free tier)
  false, -- Premium status
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  bio = EXCLUDED.bio,
  niches = EXCLUDED.niches,
  updated_at = NOW();

-- STEP 4: Verify the profile was created
SELECT 
  p.id,
  p.user_id,
  p.type,
  p.name,
  p.bio,
  p.niches,
  p.likes_today,
  p.is_premium,
  u.email
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'demo@skr.com';

-- Alternative: Create user via SQL (requires service_role key or special permissions)
-- This is more advanced and may not work depending on your Supabase setup
-- Uncomment and modify if you have the necessary permissions:

/*
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create auth user (this requires admin privileges)
  new_user_id := auth.uid();
  
  -- Insert into auth.users directly (requires service_role)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'demo@skr.com',
    crypt('123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;
  
  -- Now create the profile
  INSERT INTO profiles (
    user_id,
    type,
    name,
    bio,
    niches,
    likes_today,
    is_premium
  ) VALUES (
    new_user_id,
    'project',
    'Demo Project',
    'This is a demo account for testing the Seeker app',
    ARRAY['SaaS', 'AI/ML', 'FinTech'],
    20,
    false
  );
END $$;
*/
