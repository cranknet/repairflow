import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { PartsStockPageClient } from '@/components/inventory/parts-stock-page-client';

export default async function InventoryStockPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; supplierId?: string }>;
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

  if (params.supplierId) {
    where.supplierId = params.supplierId;
  }

  const parts = await prisma.part.findMany({
    where,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Also fetch suppliers for filter dropdown
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <MainLayout>
      <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
        <PartsStockPageClient 
          parts={parts} 
          suppliers={suppliers}
          search={params.search}
          supplierId={params.supplierId}
          userRole={session.user.role}
        />
      </Suspense>
    </MainLayout>
  );
}

