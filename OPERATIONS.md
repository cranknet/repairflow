# Operations Guide

## Daily Operations

### Health Monitoring

Check application health at:
- `/api/health` - Overall health with database check
- `/api/ready` - Readiness for traffic
- `/api/live` - Process liveness

### Log Access

#### Docker
```bash
docker logs repairflow -f
docker logs repairflow --since 1h
```

#### Shared Hosting
Check cPanel → Error Logs or:
```bash
tail -f ~/logs/error.log
```

## Common Tasks

### User Management

Reset admin password:
```bash
npm run reset-admin-password
```

### Database

View database:
```bash
npx prisma studio
```

Reset development data:
```bash
npm run db:reset
```

### Translations

Check missing translations:
```bash
npm run i18n:check
```

Auto-fix missing keys:
```bash
npm run i18n:fix:auto
```

## Performance

### Bundle Analysis
```bash
npm run analyze
```

### Database Queries
Use Prisma Studio or connect directly to check slow queries.

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues.

## Backups

See [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) for backup procedures.
