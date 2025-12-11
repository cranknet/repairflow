# RepairFlow Release Guide

## Pre-Release Checklist

- [ ] All tests pass (`npm test && npm run test:e2e`)
- [ ] i18n check passes (`npm run i18n:check`)
- [ ] No critical security vulnerabilities (`npm audit`)
- [ ] Build succeeds (`npm run build`)
- [ ] Changelog updated
- [ ] Version bumped (`npm run version:patch|minor|major`)

## Release Process

### 1. Create Release Branch
```bash
git checkout -b release/v1.x.x
```

### 2. Final Verification
```bash
# Run full test suite
npm run test
npm run test:e2e

# Check i18n
npm run i18n:check

# Security audit
npm audit

# Build
npm run build
```

### 3. Tag and Push
```bash
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x
```

### 4. Docker Build
```bash
docker build -t repairflow:v1.x.x .
docker tag repairflow:v1.x.x repairflow:latest
```

### 5. Deploy

#### Shared Hosting (FTP/cPanel)
1. Build the application: `npm run build`
2. Upload the following to your hosting:
   - `.next/` directory
   - `node_modules/` (or run `npm ci --production` on server)
   - `public/`
   - `prisma/`
   - `package.json`
   - `next.config.js`
3. Configure Node.js app in cPanel
4. Set environment variables
5. Run database migration: `npx prisma db push`
6. Start the app: `npm start`

#### Docker Deployment
```bash
docker run -d \
  --name repairflow \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  -e AUTH_SECRET="your-secret" \
  -e AUTH_URL="https://yourdomain.com" \
  repairflow:v1.x.x
```

### 6. Post-Deploy Verification
```bash
./scripts/release-smoke.sh https://yourdomain.com
```

## Version Numbering

We follow Semantic Versioning:
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Rollback

See [ROLLBACK.md](./ROLLBACK.md) for rollback procedures.
