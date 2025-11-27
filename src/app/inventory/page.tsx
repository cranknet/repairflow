import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { InventoryFilters } from '@/components/inventory/inventory-filters';
import { InventoryListHeader } from '@/components/inventory/inventory-list-header';
import { NoPartsFound } from '@/components/inventory/no-parts-found';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';
import { InventoryTable } from '@/components/inventory/inventory-table';

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
      <div className="space-y-6 pt-6">
        <PageHeader
          titleKey="inventory"
          descriptionKey="manageInventory"
          actionButton={{
            labelKey: 'addPart',
            href: '/inventory/new',
          }}
        />

        {/* Filters */}
        <Card>
          <CardHeader>
            <TranslatedCardTitle translationKey="filters" />
          </CardHeader>
          <CardContent>
            <InventoryFilters currentFilter={params.filter} />
          </CardContent>
        </Card>

        {/* Parts List */}
        <Card>
          <CardHeader>
            <InventoryListHeader count={parts.length} />
          </CardHeader>
          <CardContent>
            {parts.length === 0 ? (
              <NoPartsFound />
            ) : (
              <InventoryTable parts={parts} />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

