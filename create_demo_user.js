/**
 * Script to create demo user in Supabase
 * Run this with Node.js after setting up your Supabase credentials
 * 
 * Usage:
 * 1. Install dependencies: npm install @supabase/supabase-js
 * 2. Set environment variables:
 *    export SUPABASE_URL=your_supabase_url
 *    export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 * 3. Run: node create_demo_user.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('\nTo get your service role key:');
  console.error('1. Go to Supabase Dashboard → Project Settings → API');
  console.error('2. Copy the "service_role" key (not the anon key)');
  console.error('3. Set it as: export SUPABASE_SERVICE_ROLE_KEY=your_key');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const DEMO_EMAIL = 'demo@skr.com';
const DEMO_PASSWORD = '123456';

async function createDemoUser() {
  try {
    console.log('Creating demo user...');
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === DEMO_EMAIL);
    
    if (existingUser) {
      console.log(`User ${DEMO_EMAIL} already exists with ID: ${existingUser.id}`);
      
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', existingUser.id)
        .single();
      
      if (profile) {
        console.log('Profile already exists for this user.');
        console.log('Profile:', profile);
        return;
      }
      
      // Create profile for existing user
      console.log('Creating profile for existing user...');
      await createProfile(existingUser.id);
      return;
    }
    
    // Create new user
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        name: 'Demo User'
      }
    });
    
    if (userError) {
      throw userError;
    }
    
    console.log(`✅ User created successfully! ID: ${newUser.user.id}`);
    
    // Create profile
    await createProfile(newUser.user.id);
    
    console.log('\n✅ Demo user and profile created successfully!');
    console.log(`\nLogin credentials:`);
    console.log(`Email: ${DEMO_EMAIL}`);
    console.log(`Password: ${DEMO_PASSWORD}`);
    
  } catch (error) {
    console.error('Error creating demo user:', error.message);
    process.exit(1);
  }
}

async function createProfile(userId) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      type: 'project', // or 'investor' if you prefer
      name: 'Demo Project',
      bio: 'This is a demo account for testing the Seeker app',
      niches: ['SaaS', 'AI/ML', 'FinTech'],
      likes_today: 20,
      is_premium: false
    })
    .select()
    .single();
  
  if (profileError) {
    // Profile might already exist, try updating instead
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        name: 'Demo Project',
        bio: 'This is a demo account for testing the Seeker app',
        niches: ['SaaS', 'AI/ML', 'FinTech'],
        likes_today: 20,
        is_premium: false
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('✅ Profile updated:', updatedProfile);
  } else {
    console.log('✅ Profile created:', profile);
  }
}

createDemoUser();
