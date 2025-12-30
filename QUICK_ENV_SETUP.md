# Quick Environment Variables Setup for Vercel

# Copy and paste these commands one by one in your terminal

# IMPORTANT: Replace the placeholder values with your actual values before running!

# 1. Database URL (Get this from your database provider - Neon, Supabase, etc.)

vercel env add DATABASE_URL production

# 2. JWT Secrets (Generate random strings for these)

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

vercel env add JWT_ACCESS_SECRET production
vercel env add JWT_REFRESH_SECRET production
vercel env add JWT_RESET_SECRET production
vercel env add JWT_EMAIL_SECRET production

# 3. JWT Expiry Times (Use these exact values)

echo "7d" | vercel env add JWT_ACCESS_EXPIRES production
echo "30d" | vercel env add JWT_REFRESH_EXPIRES production

# 4. Email Configuration (Your Gmail and App Password)

vercel env add EMAIL_USER production
vercel env add EMAIL_PASS production

# 5. Node Environment (Use this exact value)

echo "production" | vercel env add NODE_ENV production

# 6. CORS Origins (Optional - your frontend URLs)

# Example: https://your-frontend.vercel.app,https://your-dashboard.vercel.app

vercel env add ALLOWED_ORIGINS production

# After adding all variables, verify:

vercel env ls

# Then deploy:

vercel --prod
