---
description: How to safely create and apply database migrations using Prisma
---

# Database Migration Workflow

This workflow ensures safe, versioned, and reversible database schema changes.

## Prerequisites
- Prisma CLI installed (`npm install -g prisma`)
- Database connection configured in `.env`
- Clean git working tree

## Workflow Steps

### 1. Create a New Branch
```bash
git checkout -b db/your-migration-name
```

### 2. Modify the Prisma Schema
Edit `prisma/schema.prisma` with your changes.

**Best Practices:**
- Add nullable columns first for zero-downtime deployments
- Use descriptive field names
- Add appropriate indexes for query performance

### 3. Generate Migration (Development)
```bash
// turbo
npx prisma migrate dev --name your_migration_name
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your development database
- Regenerate the Prisma Client

### 4. Review the Generated Migration
Check the generated SQL in `prisma/migrations/[timestamp]_your_migration_name/migration.sql`

**Verify:**
- [ ] SQL statements are correct
- [ ] No data loss risk
- [ ] Indexes are created appropriately

### 5. Test Locally
```bash
// turbo
npm run dev
```

Verify your application works correctly with the new schema.

### 6. Regenerate Prisma Client (if needed)
```bash
// turbo
npx prisma generate
```

### 7. Stage and Commit
```bash
git add prisma/
git commit -m "feat(db): add migration for [description]"
```

### 8. Push and Create PR
```bash
git push -u origin db/your-migration-name
```

### 9. Apply to Staging
After PR review, apply to staging:
```bash
npx prisma migrate deploy
```

### 10. Verify and Apply to Production
- Backup production database
- Apply migration during maintenance window if needed
- Verify data integrity

## Zero-Downtime Migration Pattern (Expand & Contract)

For breaking changes, use the expand-and-contract pattern:

1. **Expand Phase (Migration 1):**
   - Add new nullable column
   - Deploy application with dual-write logic

2. **Backfill Phase:**
   - Run data migration script to populate new column

3. **Contract Phase (Migration 2):**
   - Make new column required
   - Remove old column
   - Deploy application without dual-write

## Rollback Procedure

If a migration fails:

### Development
```bash
// turbo
npx prisma migrate reset
```

### Production
- Restore from backup
- Create a new down migration to reverse changes

## Common Commands Reference

| Command | Purpose |
|---------|---------|
| `npx prisma migrate dev` | Create and apply migration (dev) |
| `npx prisma migrate deploy` | Apply pending migrations (prod) |
| `npx prisma migrate reset` | Reset database and apply all migrations |
| `npx prisma migrate status` | Check migration status |
| `npx prisma db push` | Push schema without creating migration |
| `npx prisma generate` | Regenerate Prisma Client |

## Best Practices Checklist

- [ ] Never modify existing migration files
- [ ] Test migrations on staging before production
- [ ] Backup production before applying migrations
- [ ] Use transactions for data migrations
- [ ] Document breaking changes in PR description
- [ ] Coordinate with team for production deployments
