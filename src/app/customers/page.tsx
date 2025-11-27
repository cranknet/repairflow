import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { CustomersPageClient } from '@/components/customers/customers-page-client';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
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
      { phone: { contains: params.search } },
      { email: { contains: params.search } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      _count: {
        select: { tickets: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <MainLayout>
      <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
        <CustomersPageClient customers={customers} search={params.search} />
      </Suspense>
    </MainLayout>
  );
}

