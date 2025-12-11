# Backup & Restore Procedures

## Automated Backups

### SQLite

Add to crontab for daily backups:
```bash
# Daily backup at 2 AM
0 2 * * * cp /path/to/repairflow/dev.db /path/to/backups/dev.db.$(date +\%Y\%m\%d)
```

### MySQL

```bash
# Daily backup at 2 AM
0 2 * * * mysqldump -u user -p'password' repairflow > /path/to/backups/repairflow-$(date +\%Y\%m\%d).sql
```

## Manual Backup

### SQLite
```bash
# Create timestamped backup
cp dev.db dev.db.backup-$(date +%Y%m%d-%H%M%S)
```

### MySQL
```bash
mysqldump -u user -p repairflow > backup-$(date +%Y%m%d-%H%M%S).sql
```

## Restore

### SQLite
```bash
# Stop the application first
cp dev.db.backup-YYYYMMDD-HHMMSS dev.db
npx prisma generate
# Restart application
```

### MySQL
```bash
mysql -u user -p repairflow < backup-YYYYMMDD-HHMMSS.sql
```

## Uploaded Files

Device photos are stored in:
- Database (as base64 in `deviceBefore`/`deviceAfter` fields)

For external storage backups:
```bash
tar -czvf uploads-backup-$(date +%Y%m%d).tar.gz ./uploads/
```

## Retention Policy

| Type | Retention |
|------|-----------|
| Daily backups | 7 days |
| Weekly backups | 4 weeks |
| Monthly backups | 12 months |

## Verification

After restore, verify:
```bash
./scripts/release-smoke.sh http://localhost:3000
```

## Disaster Recovery

1. Provision new server/hosting
2. Deploy latest stable Docker image
3. Restore latest backup
4. Update DNS/routing
5. Run smoke tests
6. Monitor for issues
