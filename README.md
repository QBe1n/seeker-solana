# Seeker - Solana Talent Matching

Tinder for Solana ecosystem. Match builders, projects, and investors.

## Setup
```bash
npm install
npm run dev
```

## Deploy
```bash
vercel --prod
```

## Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Local Setup

This app runs with **local Supabase** instance (not cloud).

### Setup Local Supabase

```bash
# 1. Install Supabase CLI (if not installed)
brew install supabase/tap/supabase

# 2. Initialize and start local Supabase
./setup_local_supabase.sh

# Or manually:
supabase init
supabase start
```

After starting, add these to your `.env` file:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<get-from-supabase-status>
```

Get the anon key by running: `supabase status`

### Adding Demo User to Local Database

**Easy way (recommended):**
```bash
node add_demo_user_local.js
```

**Alternative (bash script):**
```bash
./add_demo_user_local.sh
```

**Manual way via Supabase Studio:**
1. Go to http://localhost:54323 (Supabase Studio)
2. Navigate to Authentication → Users → Add User
3. Email: `demo@skr.com`, Password: `123456`
4. Check "Auto Confirm User"
5. Copy the User ID and run the SQL from `add_demo_user.sql`

## Demo Account

**Email:** `demo@skr.com`  
**Password:** `123456`

### For Cloud Supabase (if needed)

**Method 1: Via Supabase Dashboard**

1. Go to your Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email and password, check "Auto Confirm User"
4. Copy User ID and run `add_demo_user.sql`

**Method 2: Using Script**

```bash
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
node create_demo_user.js
```