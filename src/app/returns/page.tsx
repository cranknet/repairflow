import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { ReturnsListHeader } from '@/components/returns/returns-list-header';
import { ReturnsTable } from '@/components/returns/returns-table';
import { NoReturnsFound } from '@/components/returns/no-returns-found';
import { ReturnsClient } from '@/components/returns/returns-client';

export default async function ReturnsPage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const returns = await prisma.return.findMany({
    include: {
      ticket: {
        select: {
          id: true,
          ticketNumber: true,
          status: true,
          paid: true,
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
          parts: {
            include: {
              part: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      },
      items: {
        include: {
          part: {
            select: {
              name: true,
              sku: true,
              unitPrice: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch completed and paid tickets for creating new returns
  const eligibleTickets = await prisma.ticket.findMany({
    where: {
      status: 'COMPLETED',
      paid: true,
      parts: {
        some: {},
      },
    },
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      parts: {
        include: {
          part: {
            select: {
              id: true,
              name: true,
              sku: true,
              unitPrice: true,
            },
          },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
    take: 50, // Limit to recent 50 tickets
  });

  return (
    <MainLayout>
      <div className="space-y-6 pt-6">
        <ReturnsListHeader />
        <ReturnsClient returns={returns} eligibleTickets={eligibleTickets} />
      </div>
    </MainLayout>
  );
}

