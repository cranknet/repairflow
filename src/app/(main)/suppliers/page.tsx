import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { SuppliersPageClient } from '@/components/suppliers/suppliers-page-client';

export default async function SuppliersPage({
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
      { contactPerson: { contains: params.search } },
      { email: { contains: params.search } },
      { phone: { contains: params.search } },
    ];
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    include: {
      _count: {
        select: { parts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <MainLayout>
      <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
        <SuppliersPageClient suppliers={suppliers} search={params.search} userRole={session.user.role} />
      </Suspense>
    </MainLayout>
  );
}

