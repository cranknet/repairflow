import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { ReturnsClient } from '@/components/returns/returns-client';
import { ReturnsListHeader } from '@/components/returns/returns-list-header';

export default async function ReturnsPage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  // Fetch all returns with ticket information
  const returns = await prisma.return.findMany({
    include: {
      ticket: {
        select: {
          id: true,
          ticketNumber: true,
          status: true,
          finalPrice: true,
          estimatedPrice: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Serialize dates for client component
  const serializedReturns = returns.map((returnRecord) => ({
    ...returnRecord,
    createdAt: returnRecord.createdAt.toISOString(),
    updatedAt: returnRecord.updatedAt.toISOString(),
    ticket: {
      ...returnRecord.ticket,
    },
  }));

  return (
    <MainLayout>
      <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
        <div className="space-y-6">
          <ReturnsListHeader />
          <ReturnsClient
            returns={serializedReturns}
            userRole={session.user.role}
          />
        </div>
      </Suspense>
    </MainLayout>
  );
}

