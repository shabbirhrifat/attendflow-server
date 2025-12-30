# Environment Variables Setup for Vercel

## Required Environment Variables

You need to add these environment variables in your Vercel project settings:

### 1. Database Configuration

```
DATABASE_URL=postgresql://username:password@host:5432/database_name?schema=public
```

**Example for Neon/Supabase:**

```
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 2. JWT Configuration

```
JWT_ACCESS_SECRET=your_strong_random_secret_key_for_access_tokens
JWT_ACCESS_EXPIRES=7d
JWT_REFRESH_SECRET=your_strong_random_secret_key_for_refresh_tokens
JWT_REFRESH_EXPIRES=30d
JWT_RESET_SECRET=your_strong_random_secret_key_for_reset_tokens
JWT_EMAIL_SECRET=your_strong_random_secret_key_for_email_verification
```

### 3. Email Configuration

```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 4. Server Configuration

```
NODE_ENV=production
PORT=5000
```

### 5. CORS Configuration (Optional)

```
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-dashboard-domain.vercel.app
```

## How to Add Environment Variables in Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project (attendflow-server)
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environment**: Select `Production`, `Preview`, and `Development`
5. Click **Save**

### Method 2: Using Vercel CLI

```bash
# Add environment variables one by one
vercel env add DATABASE_URL production
vercel env add JWT_ACCESS_SECRET production
vercel env add JWT_REFRESH_SECRET production
vercel env add JWT_RESET_SECRET production
vercel env add JWT_EMAIL_SECRET production
vercel env add EMAIL_USER production
vercel env add EMAIL_PASS production
vercel env add NODE_ENV production
```

### Method 3: Bulk Import from .env file

```bash
# This will prompt you to add all variables from your .env file
vercel env pull .env.production
```

## Quick Setup Commands

```bash
# 1. First, add your environment variables using the dashboard or CLI

# 2. Then deploy
vercel --prod
```

## Generating Strong JWT Secrets

Use these commands to generate secure random secrets:

```bash
# Generate JWT secrets (run 4 times for each secret)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or use online tools:

- https://generate-secret.vercel.app/64

## Verification

After adding environment variables, verify them:

```bash
# List all environment variables
vercel env ls

# Pull environment variables to local
vercel env pull .env.local
```

## Important Notes

1. ✅ **Never commit `.env` files to git**
2. ✅ **Use strong, random secrets for JWT keys**
3. ✅ **Use SSL-enabled database URLs in production**
4. ✅ **Add environment variables for all three environments** (Production, Preview, Development)
5. ✅ **Update CORS origins to match your frontend domains**

## Troubleshooting

### Error: "Environment Variable references Secret which does not exist"

**Solution:** Remove the `env` section from `vercel.json` and add variables through dashboard instead.

### Error: "DATABASE_URL is not defined"

**Solution:** Make sure you've added `DATABASE_URL` in Vercel dashboard under Environment Variables.

### Error: "Prisma Client initialization failed"

**Solution:** Ensure your `DATABASE_URL` is correct and the database is accessible from Vercel's servers.

## Next Steps After Adding Variables

1. Add all required environment variables in Vercel dashboard
2. Run `vercel --prod` to deploy
3. Check deployment logs for any errors
4. Test your API endpoints

---

**Status:** Environment variables must be configured before deployment
