#!/bin/bash

# Setup Local Supabase for Seeker App
# This script sets up a local Supabase instance using Docker

echo "🚀 Setting up local Supabase instance..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    brew install supabase/tap/supabase || {
        echo "❌ Failed to install Supabase CLI via Homebrew."
        echo "   Alternative: npm install -g supabase"
        exit 1
    }
fi

# Initialize Supabase if not already done
if [ ! -f "supabase/config.toml" ]; then
    echo "📝 Initializing Supabase project..."
    supabase init
fi

# Start local Supabase
echo "🎯 Starting local Supabase instance..."
supabase start

echo ""
echo "✅ Local Supabase is running!"
echo ""
echo "📋 Connection details:"
supabase status
echo ""
echo "📝 Add these to your .env file:"
echo "VITE_SUPABASE_URL=$(supabase status | grep 'API URL' | awk '{print $3}')"
echo "VITE_SUPABASE_ANON_KEY=$(supabase status | grep 'anon key' | awk '{print $3}')"
echo ""
echo "🔑 To add demo user, run: ./add_demo_user_local.sh"
