# Troubleshooting Guide

## Common Errors and Solutions

### 1. "next-auth/middleware is deprecated" Error

**Solution**: This has been fixed. Make sure you:
- Restart the dev server after changes
- Clear `.next` folder: `rm -rf .next` (or `Remove-Item -Recurse -Force .next` on Windows)
- Restart: `npm run dev`

### 2. Environment Variables Not Set

**Error**: `Environment variable not found: DATABASE_URL` or `NEXTAUTH_SECRET`

**Solution**: Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

Generate NEXTAUTH_SECRET:
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
```

### 3. Database Connection Issues

**Error**: `PrismaClientInitializationError` or database not found

**Solution**:
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Module Not Found Errors

**Error**: `Can't resolve '@heroicons/react'` or similar

**Solution**:
```bash
npm install --legacy-peer-deps
```

### 5. Middleware Runtime Errors

**Error**: Edge runtime errors with Prisma

**Solution**: The middleware has been updated to handle edge runtime properly. If you still see errors:
- Clear `.next` folder
- Restart dev server
- Check that `src/lib/auth.config.ts` uses dynamic imports

### 6. TypeScript Errors

**Error**: Type errors in build

**Solution**:
```bash
npm run build
```
This will show all type errors. Fix them one by one.

### 7. Login Not Working

**Error**: Can't login or redirected to login page

**Solution**:
- Check that database is seeded: `npm run db:seed`
- Verify credentials: admin/admin123 or staff/staff123
- Check browser console for errors
- Verify NEXTAUTH_SECRET is set

### 8. Build Succeeds but Runtime Errors

**Solution**:
1. Stop the dev server (Ctrl+C)
2. Delete `.next` folder
3. Restart: `npm run dev`

## Quick Fix Commands

```bash
# Full reset
rm -rf .next node_modules
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Windows PowerShell:
```powershell
Remove-Item -Recurse -Force .next, node_modules -ErrorAction SilentlyContinue
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

