# Supplier Model - Finance Branch

## Overview

This document describes the Supplier model implementation and migration process for the finance branch. The Supplier model allows parts to reference suppliers through a proper relational model while maintaining backwards compatibility with existing supplier string fields.

## Schema Changes

### Part Model
- Added `supplierId String?` - Foreign key to Supplier model (nullable for backwards compatibility)
- Added `supplierName String? @map("supplier")` - Backwards-compatible supplier name field
- Added `supplier Supplier?` - Relation to Supplier model

### Supplier Model
The Supplier model includes:
- `id` - Primary key
- `name` - Supplier name
- `contactPerson` - Optional contact person
- `email` - Optional email
- `phone` - Optional phone
- `address` - Optional address
- `notes` - Optional notes

## Rollout Plan

### Phase 1: Schema Migration
1. Add schema changes with `supplierId` nullable and `supplierName` field
2. Run `npx prisma generate` to update Prisma Client
3. Run `npx prisma migrate dev --name add-supplier-string-column` to create migration
4. Deploy backend with new schema

### Phase 2: Data Migration
1. Run migration script to create suppliers from existing `Part.supplier` values
2. Update parts to set `supplierId` based on supplier name matching
3. Verify migration results

### Phase 3: API Updates
1. Deploy backend with new suppliers API endpoints (already exists)
2. Deploy backend with updated parts API (POST endpoint with supplier support)
3. Update frontend to use `supplierId` and suppliers API

### Phase 4: Cleanup (Future)
1. After verification period, remove `supplierName` column
2. Make `supplierId` non-nullable if desired
3. Run final migration

## Migration Commands

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Create Database Migration
```bash
npx prisma migrate dev --name add-supplier-string-column
```

### 3. Run Seed Data
```bash
npx prisma db seed
# or
npx ts-node prisma/seed.ts
```

### 4. Run Supplier Migration Script
```bash
npx ts-node scripts/migrate-suppliers.ts
# or if using tsx
npx tsx scripts/migrate-suppliers.ts
```

## API Endpoints

### Suppliers API
- `GET /api/suppliers` - List all suppliers (with search support)
- `POST /api/suppliers` - Create a new supplier

### Parts API
- `GET /api/parts` - List all parts
- `POST /api/parts` - Create a new part

#### Part Creation Request Body
```json
{
  "name": "iPhone 14 Screen Replacement",
  "sku": "IPH14-SCR-001",
  "description": "Original quality screen replacement",
  "quantity": 15,
  "reorderLevel": 5,
  "unitPrice": 89.99,
  "supplierId": "clx123..." // Optional: use supplier ID directly
  // OR
  "supplier": "TechParts Inc." // Optional: supplier name (will find or create)
}
```

**Note:** If both `supplierId` and `supplier` are provided, `supplierId` takes precedence. If only `supplier` name is provided, the API will find an existing supplier by name or create a new one.

## Migration Script Details

The migration script (`scripts/migrate-suppliers.ts`) performs the following:

1. Queries all distinct supplier names from `Part.supplier` column
2. For each supplier name:
   - Finds existing supplier by name, or creates new supplier if not found
   - Updates all parts with that supplier name to set `supplierId`
3. Provides console output showing progress and results

The script is safe to run multiple times (idempotent) as it uses upsert logic.

## Backwards Compatibility

- The `supplierName` field (mapped to `supplier` column) is maintained for backwards compatibility
- Existing code that reads `Part.supplier` will continue to work
- New code should use `supplierId` and the `supplier` relation
- Both fields are kept in sync during part creation

## Verification Steps

After running migrations, verify the setup:

```sql
-- Check suppliers were created
SELECT id, name FROM Supplier;

-- Check parts reference suppliers
SELECT sku, supplierId, supplier FROM Part LIMIT 10;

-- Verify supplier counts
SELECT s.name, COUNT(p.id) as part_count
FROM Supplier s
LEFT JOIN Part p ON p.supplierId = s.id
GROUP BY s.id, s.name;
```

## Troubleshooting

### Migration script finds no suppliers
- This is normal if there are no existing parts with supplier strings
- The script will output a message and exit gracefully

### Parts not updating with supplierId
- Check that supplier names match exactly (case-sensitive)
- Verify the `supplier` column exists in the database
- Check console output for any error messages

### API errors when creating parts
- Ensure authentication is working
- Verify SKU is unique
- Check that supplier validation is passing
- Review server logs for detailed error messages

## Future Considerations

1. **Make supplierId required**: After migration period, consider making `supplierId` non-nullable
2. **Remove supplierName field**: Once all code uses `supplierId`, remove the backwards-compatible field
3. **Add supplier management UI**: Create frontend components for managing suppliers
4. **Add supplier validation**: Consider adding unique constraint on supplier name if needed

