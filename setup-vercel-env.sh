#!/bin/bash

# Vercel Environment Variables Setup Script
# This script helps you add environment variables to Vercel

echo "🚀 Vercel Environment Variables Setup"
echo "======================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "📦 Install it with: npm i -g vercel"
    exit 1
fi

echo "📝 This script will help you add environment variables to Vercel."
echo "⚠️  You'll be prompted to enter each value."
echo ""

# Function to add environment variable
add_env() {
    local key=$1
    local description=$2
    
    echo "➡️  Adding: $key"
    echo "   Description: $description"
    
    # Add to production
    vercel env add "$key" production
    
    # Optionally add to preview and development
    read -p "   Add to Preview environment too? (y/n): " add_preview
    if [ "$add_preview" = "y" ]; then
        vercel env add "$key" preview
    fi
    
    read -p "   Add to Development environment too? (y/n): " add_dev
    if [ "$add_dev" = "y" ]; then
        vercel env add "$key" development
    fi
    
    echo "   ✅ Done!"
    echo ""
}

# Add each environment variable
echo "1️⃣  Database Configuration"
add_env "DATABASE_URL" "PostgreSQL connection string"

echo "2️⃣  JWT Access Token Configuration"
add_env "JWT_ACCESS_SECRET" "Secret key for access tokens"
echo "   💡 Tip: Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""

echo "3️⃣  JWT Access Token Expiry"
vercel env add "JWT_ACCESS_EXPIRES" production
echo "   💡 Recommended value: 7d"

echo "4️⃣  JWT Refresh Token Configuration"
add_env "JWT_REFRESH_SECRET" "Secret key for refresh tokens"

echo "5️⃣  JWT Refresh Token Expiry"
vercel env add "JWT_REFRESH_EXPIRES" production
echo "   💡 Recommended value: 30d"

echo "6️⃣  JWT Reset Token Configuration"
add_env "JWT_RESET_SECRET" "Secret key for password reset tokens"

echo "7️⃣  JWT Email Verification Configuration"
add_env "JWT_EMAIL_SECRET" "Secret key for email verification tokens"

echo "8️⃣  Email Configuration"
add_env "EMAIL_USER" "Gmail address for sending emails"
add_env "EMAIL_PASS" "Gmail app password (not your regular password)"

echo "9️⃣  Node Environment"
vercel env add "NODE_ENV" production
echo "   💡 Value should be: production"

echo "🔟  CORS Origins (Optional)"
read -p "Do you want to add ALLOWED_ORIGINS? (y/n): " add_cors
if [ "$add_cors" = "y" ]; then
    add_env "ALLOWED_ORIGINS" "Comma-separated list of allowed origins"
    echo "   💡 Example: https://frontend.vercel.app,https://dashboard.vercel.app"
fi

echo ""
echo "✅ All environment variables have been added!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify variables: vercel env ls"
echo "   2. Deploy: vercel --prod"
echo ""
