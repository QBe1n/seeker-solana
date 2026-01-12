#!/bin/bash

# Add Demo User to Local Supabase Database

DEMO_EMAIL="demo@skr.com"
DEMO_PASSWORD="123456"

echo "👤 Adding demo user to local Supabase..."

# Check if Supabase is running
if ! supabase status &> /dev/null; then
    echo "❌ Supabase is not running. Start it with: supabase start"
    exit 1
fi

# Get the database URL
DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')

if [ -z "$DB_URL" ]; then
    echo "❌ Could not get database URL. Is Supabase running?"
    exit 1
fi

# Create user using Supabase Auth Admin API
echo "📧 Creating auth user: $DEMO_EMAIL"

# Use Supabase Management API to create user
ACCESS_TOKEN=$(supabase status | grep "service_role key" | awk '{print $3}')
API_URL=$(supabase status | grep "API URL" | awk '{print $3}')

if [ -z "$ACCESS_TOKEN" ] || [ -z "$API_URL" ]; then
    echo "❌ Could not get Supabase credentials"
    exit 1
fi

# Create user via Management API
RESPONSE=$(curl -s -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $ACCESS_TOKEN" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$DEMO_EMAIL\",
    \"password\": \"$DEMO_PASSWORD\",
    \"email_confirm\": true,
    \"user_metadata\": {
      \"name\": \"Demo User\"
    }
  }")

USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
    echo "⚠️  User might already exist. Checking..."
    # Try to get existing user
    RESPONSE=$(curl -s -X GET "$API_URL/auth/v1/admin/users?email=$DEMO_EMAIL" \
      -H "apikey: $ACCESS_TOKEN" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -z "$USER_ID" ]; then
        echo "❌ Failed to create or find user"
        echo "Response: $RESPONSE"
        exit 1
    else
        echo "✅ User already exists with ID: $USER_ID"
    fi
else
    echo "✅ User created with ID: $USER_ID"
fi

# Create profile using SQL
echo "📝 Creating profile for user..."

psql "$DB_URL" <<EOF
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
  '$USER_ID',
  'project',
  'Demo Project',
  'This is a demo account for testing the Seeker app',
  ARRAY['SaaS', 'AI/ML', 'FinTech'],
  20,
  false,
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  bio = EXCLUDED.bio,
  niches = EXCLUDED.niches,
  updated_at = NOW();

-- Verify
SELECT p.id, p.name, p.type, u.email 
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = '$DEMO_EMAIL';
EOF

echo ""
echo "✅ Demo user setup complete!"
echo "📧 Email: $DEMO_EMAIL"
echo "🔑 Password: $DEMO_PASSWORD"
