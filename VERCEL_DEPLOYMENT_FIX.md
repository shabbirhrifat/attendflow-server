# Vercel Deployment Fix - Prisma Client Generation

## Problem

The AttendFlow server was failing on Vercel with the error:

```
Cannot find module '.prisma/client/default'
```

This error occurred because Prisma Client was not being generated during the Vercel build process.

## Root Causes

1. **Missing Prisma Generation in Build Script**

   - The `build` script only ran `tsc` (TypeScript compilation)
   - Prisma Client generation was not included in the build process

2. **Prisma in Wrong Dependencies Section**

   - `prisma` was in `devDependencies`
   - Vercel doesn't install devDependencies in production builds

3. **No Post-Install Hook**
   - No automatic Prisma Client generation after npm install

## Solutions Implemented

### 1. Updated `package.json` Scripts

**Before:**

```json
"build": "tsc"
```

**After:**

```json
"build": "npm run schema:merge && prisma generate && tsc",
"postinstall": "npm run schema:merge && prisma generate"
```

**Changes:**

- Added schema merging before Prisma generation
- Added `prisma generate` to build script
- Added `postinstall` hook to auto-generate Prisma Client after dependencies install

### 2. Moved Prisma to Production Dependencies

**Before:**

```json
"devDependencies": {
  "prisma": "^7.2.0"
}
```

**After:**

```json
"dependencies": {
  "prisma": "^7.2.0"
}
```

**Reason:** Vercel needs Prisma CLI available during the build process to generate the Prisma Client.

### 3. Updated `vercel.json` Configuration

**Before:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "/dist/server.js",
      "use": "@vercel/node"
    }
  ]
}
```

**After:**

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url"
  }
}
```

**Changes:**

- Added explicit `buildCommand`
- Fixed `src` path (removed leading slash)
- Added environment variable configuration

### 4. Created `.vercelignore`

Added a `.vercelignore` file to exclude unnecessary files from deployment:

- Development files
- IDE configurations
- Build artifacts (will be rebuilt)
- Prisma migrations (not needed in production)

## Deployment Process

The updated build process now follows these steps:

1. **Install Dependencies**

   ```bash
   npm install
   ```

   - Installs all dependencies including `prisma`
   - Runs `postinstall` hook → merges schemas → generates Prisma Client

2. **Build**

   ```bash
   npm run build
   ```

   - Merges Prisma schemas
   - Generates Prisma Client
   - Compiles TypeScript to JavaScript

3. **Deploy**
   - Vercel deploys the built application with generated Prisma Client

## Environment Variables Required

Make sure these environment variables are set in Vercel:

1. **DATABASE_URL** - PostgreSQL connection string
2. **JWT_SECRET** - Secret for JWT token generation
3. **NODE_ENV** - Set to "production"
4. Any other environment variables from your `.env` file

## Verification Steps

After deployment, verify:

1. ✅ Build logs show "Prisma Client generated successfully"
2. ✅ No "Cannot find module '.prisma/client'" errors
3. ✅ Server starts without errors
4. ✅ API endpoints respond correctly
5. ✅ Database connections work

## Next Steps

1. Monitor the Vercel deployment logs
2. Test all API endpoints
3. Verify database connectivity
4. Check application functionality

## Common Issues & Solutions

### Issue: "Prisma Client not generated"

**Solution:** Ensure `postinstall` script runs successfully

### Issue: "Database connection failed"

**Solution:** Verify `DATABASE_URL` environment variable in Vercel

### Issue: "Module not found" errors

**Solution:** Check that all required dependencies are in `dependencies`, not `devDependencies`

## Files Modified

1. ✅ `package.json` - Updated build scripts and moved prisma to dependencies
2. ✅ `vercel.json` - Added buildCommand and environment configuration
3. ✅ `.vercelignore` - Created to optimize deployment

## Commit Message

```
fix: Configure Prisma Client generation for Vercel deployment

- Add schema merge and Prisma generate to build script
- Add postinstall hook for automatic Prisma Client generation
- Move prisma from devDependencies to dependencies
- Update vercel.json with explicit buildCommand
- Create .vercelignore to optimize deployment size
```

---

**Status:** ✅ Changes committed and pushed to repository
**Expected Result:** Vercel will automatically trigger a new deployment with these fixes
