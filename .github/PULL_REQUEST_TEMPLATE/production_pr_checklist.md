# Production Release PR

## Overview
<!-- Brief description of changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation
- [ ] Infrastructure/DevOps
- [ ] Performance improvement
- [ ] Security fix

## Related Issues
<!-- Link to related issues: Fixes #123 -->

---

## Pre-merge Checklist

### Code Quality
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] ESLint passes or only has acceptable warnings (`npm run lint`)
- [ ] No hardcoded secrets or API keys

### Testing
- [ ] Unit tests pass (`npm run test`)
- [ ] Integration tests pass
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Test coverage meets threshold

### i18n
- [ ] All new UI strings are translatable
- [ ] Translation keys added to `en.json`, `fr.json`, `ar.json`
- [ ] i18n check passes (`npm run i18n:check`)

### Security
- [ ] `npm audit` shows no critical/high vulnerabilities
- [ ] Sensitive data is not logged
- [ ] File uploads are validated

### Database
- [ ] Migrations are up to date
- [ ] Schema changes are backward compatible
- [ ] Rollback plan documented if needed

### Documentation
- [ ] README updated if applicable
- [ ] API documentation updated if applicable
- [ ] CHANGELOG updated

---

## Deployment Notes
<!-- Any special deployment instructions -->

## Rollback Plan
<!-- How to rollback if issues arise -->

## Screenshots/Recordings
<!-- If UI changes, include before/after screenshots -->
