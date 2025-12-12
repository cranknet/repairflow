# Vercel PostgreSQL Database Connection Fix

## Problem
Getting error: `Can't reach database server at 95Fii.6x:5432` in Vercel production.

This corrupted hostname suggests the DATABASE_URL environment variable is either:
1. Not set in Vercel
2. Contains invalid characters
3. Being overridden or corrupted during build

## Solution Steps

### 1. Set Environment Variables in Vercel Dashboard

Go to: **Your Project → Settings → Environment Variables**

Add/Update these variables:

```bash
DATABASE_URL=postgresql://postgres:UD7Xu0jUvmxSG8qW@db.ksdzsipabpjfhtsdwrcd.supabase.co:5432/postgres?schema=public
DATABASE_PROVIDER=postgresql
```

**Important:**
- Select **Production** environment (and Preview if needed)
- Click "Save"
- DO NOT add quotes around the value in Vercel dashboard UI

### 2. Verify Supabase Connection String

1. Go to Supabase Dashboard → Project Settings → Database
2. Look for **Connection string → URI**
3. Make sure you're using the **Transaction mode** (port 5432), NOT Session mode (port 6543)
4. Replace `[YOUR-PASSWORD]` with your actual database password

### 3. Clear Build Cache and Redeploy

Option A - Via Vercel Dashboard:
1. Go to Deployments tab
2. Click on the ⋯ (three dots) on latest deployment
3. Select "Redeploy"
4. Check "Use existing Build Cache" → **UNCHECK IT** (clear cache)
5. Click "Redeploy"

Option B - Via Git:
```bash
git commit --allow-empty -m "Force redeploy with new env vars"
git push
```

### 4. Check Build Logs

After redeployment, check the build logs for:

```
[Database Setup] Detected Vercel environment, using PostgreSQL
[Database Setup] DATABASE_URL: postgresql://postgres:****@db.ksdzsipabpjfhtsdwrcd.supabase.co:5432/postgres?schema=public
[Database Setup] Schema updated successfully.
```

If you see errors here, the DATABASE_URL is still not set correctly.

## Common Issues

### Issue 1: Password contains special characters

If your password has: `@ # ! $ % ^ & * ( )`

You need to URL-encode them in the DATABASE_URL:
- `@` → `%40`
- `#` → `%23`
- `!` → `%21`
- `$` → `%24`
- `%` → `%25`
- `^` → `%5E`
- `&` → `%26`

Your password `UD7Xu0jUvmxSG8qW` looks clean (no special chars), but double-check.

### Issue 2: Wrong Supabase port

Prisma requires **Transaction mode (port 5432)**, NOT Session mode (port 6543).

✅ Correct: `db.ksdzsipabpjfhtsdwrcd.supabase.co:5432`
❌ Wrong: `db.ksdzsipabpjfhtsdwrcd.supabase.co:6543`

### Issue 3: Missing schema parameter

Always add `?schema=public` at the end:

```
postgresql://postgres:UD7Xu0jUvmxSG8qW@db.ksdzsipabpjfhtsdwrcd.supabase.co:5432/postgres?schema=public
```

### Issue 4: Environment variable not applied

After changing env vars in Vercel:
1. You MUST redeploy (changes don't auto-apply)
2. Clear build cache during redeploy
3. Wait for the full build to complete

## Verification

After deployment, check the function logs in Vercel:
1. Go to Deployments → Select your deployment
2. Click "View Function Logs"
3. Look for the Prisma connection attempt
4. Should see successful database queries

## Need More Help?

If still failing, share the **full build log** from Vercel (search for "[Database Setup]" lines).

The updated schema selection script now includes:
- Better environment detection
- DATABASE_URL validation
- Detailed logging to diagnose issues
- Auto-detection of PostgreSQL connection strings
