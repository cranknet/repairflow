import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting supplier migration...');

  // 1. Get distinct supplier names from existing parts
  // Note: Using raw query since Prisma doesn't have a direct way to get distinct values from a nullable field
  const rows: Array<{ supplier: string | null }> = await prisma.$queryRaw`
    SELECT DISTINCT supplier FROM "Part" WHERE supplier IS NOT NULL AND supplier <> ''
  `;

  if (rows.length === 0) {
    console.log('ℹ️  No supplier strings found in parts. Nothing to migrate.');
    return;
  }

  console.log(`📋 Found ${rows.length} distinct supplier names to migrate`);

  let migratedCount = 0;
  let updatedPartsCount = 0;

  for (const r of rows) {
    const name = r.supplier?.trim();
    if (!name) continue;

    try {
      // Upsert supplier (find first by name, or create if not exists)
      let supplier = await prisma.supplier.findFirst({
        where: { name },
      });

      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: { name },
        });
        migratedCount++;
        console.log(`  ✅ Created supplier: ${name}`);
      } else {
        console.log(`  ℹ️  Supplier already exists: ${name}`);
      }

      // Update parts that still have the string
      const updateResult = await prisma.part.updateMany({
        where: { supplierName: name },
        data: { supplierId: supplier.id },
      });

      if (updateResult.count > 0) {
        updatedPartsCount += updateResult.count;
        console.log(`  📦 Updated ${updateResult.count} part(s) to reference supplier: ${name}`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing supplier "${name}":`, error);
    }
  }

  console.log('\n✅ Supplier migration complete!');
  console.log(`   - Created ${migratedCount} new supplier(s)`);
  console.log(`   - Updated ${updatedPartsCount} part(s) with supplierId`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

