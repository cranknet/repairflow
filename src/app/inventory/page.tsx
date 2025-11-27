import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { InventoryPageClient } from '@/components/inventory/inventory-page-client';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const where: any = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { sku: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  let parts = await prisma.part.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  // Filter for low stock in memory if needed
  if (params.filter === 'low_stock') {
    parts = parts.filter((part) => part.quantity <= part.reorderLevel);
  }

  return (
    <MainLayout>
      <InventoryPageClient parts={parts} filter={params.filter} search={params.search} />
    </MainLayout>
  );
}

