# Rollback Procedures

## Quick Reference

| Severity | Action | Time |
|----------|--------|------|
| Critical | Full rollback | < 5 min |
| High | Partial rollback | < 15 min |
| Low | Hotfix forward | As needed |

## Application Rollback

### Docker Deployment

```bash
# Stop current container
docker stop repairflow

# Start previous version
docker run -d \
  --name repairflow \
  -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e AUTH_SECRET="$AUTH_SECRET" \
  repairflow:v{previous-version}
```

### Shared Hosting

1. Keep previous deployment in a backup folder (e.g., `repairflow-backup-v1.0.0`)
2. To rollback:
   ```bash
   mv public_html/repairflow public_html/repairflow-failed
   mv repairflow-backup-v1.0.0 public_html/repairflow
   ```
3. Restart Node.js application in cPanel

## Database Rollback

### Before Deployment
Always create a backup before deploying:

```bash
# SQLite
cp dev.db dev.db.backup-$(date +%Y%m%d-%H%M%S)

# MySQL
mysqldump -u user -p repairflow > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Restore from Backup

```bash
# SQLite
cp dev.db.backup-YYYYMMDD-HHMMSS dev.db
npx prisma generate

# MySQL
mysql -u user -p repairflow < backup-YYYYMMDD-HHMMSS.sql
```

## Canary Rollback Triggers

Automatically rollback canary deployment if:
- Error rate > 5% over 5 minutes
- Response time p99 > 2 seconds
- Health check failures > 3 consecutive

## Post-Rollback Checklist

- [ ] Verify health endpoints respond
- [ ] Run smoke tests
- [ ] Check error logs
- [ ] Notify team
- [ ] Create incident report
- [ ] Plan hotfix

## Contact

For critical issues during rollback:
1. Check `#repairflow-ops` channel
2. Escalate to on-call engineer
