/**
 * Add Demo User to Local Supabase Database
 * 
 * Usage:
 *   1. Make sure local Supabase is running: supabase start
 *   2. Run: node add_demo_user_local.js
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

// Get local Supabase credentials
function getLocalSupabaseConfig() {
  try {
    const status = execSync('supabase status --output json', { encoding: 'utf-8' });
    const config = JSON.parse(status);
    
    return {
      url: config.APIUrl,
      anonKey: config.anonKey,
      serviceRoleKey: config.serviceRoleKey,
      dbUrl: config.DBUrl
    };
  } catch (error) {
    console.error('❌ Error: Could not get Supabase status. Is Supabase running?');
    console.error('   Run: supabase start');
    console.error('\nIf you prefer manual setup:');
    console.error('   1. Get URL and keys from: supabase status');
    console.error('   2. Set environment variables:');
    console.error('      export SUPABASE_URL=http://localhost:54321');
    console.error('      export SUPABASE_SERVICE_ROLE_KEY=<your-key>');
    process.exit(1);
  }
}

const DEMO_EMAIL = 'demo@skr.com';
const DEMO_PASSWORD = '123456';

async function createDemoUser() {
  const config = getLocalSupabaseConfig();
  
  console.log('🚀 Adding demo user to local Supabase...');
  console.log(`📍 Supabase URL: ${config.url}`);
  
  // Use service role key for admin operations
  const supabase = createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Check if user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }
    
    let userId = users?.find(u => u.email === DEMO_EMAIL)?.id;
    
    if (userId) {
      console.log(`✅ User already exists: ${userId}`);
    } else {
      // Create new user
      console.log('📧 Creating auth user...');
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: 'Demo User'
        }
      });
      
      if (userError) {
        throw userError;
      }
      
      userId = newUser.user.id;
      console.log(`✅ User created: ${userId}`);
    }
    
    // Create client with anon key for regular operations
    const client = createClient(config.url, config.anonKey);
    
    // Check if profile exists
    const { data: existingProfile } = await client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (existingProfile) {
      console.log('✅ Profile already exists');
      console.log('\n📋 Demo Account:');
      console.log(`   Email: ${DEMO_EMAIL}`);
      console.log(`   Password: ${DEMO_PASSWORD}`);
      return;
    }
    
    // Create profile
    console.log('📝 Creating profile...');
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .insert({
        user_id: userId,
        type: 'project',
        name: 'Demo Project',
        bio: 'This is a demo account for testing the Seeker app',
        niches: ['SaaS', 'AI/ML', 'FinTech'],
        likes_today: 20,
        is_premium: false
      })
      .select()
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    console.log('✅ Profile created!');
    console.log('\n📋 Demo Account Ready:');
    console.log(`   Email: ${DEMO_EMAIL}`);
    console.log(`   Password: ${DEMO_PASSWORD}`);
    console.log(`   Profile: ${profile.name}`);
    console.log('\n🌐 Login at: http://localhost:5173');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.details) console.error('Details:', error.details);
    process.exit(1);
  }
}

createDemoUser();
