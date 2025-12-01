import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { TicketsPageClient } from '@/components/tickets/tickets-page-client';

const TICKETS_PER_PAGE = 10;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const currentPage = parseInt(params.page || '1', 10);
  const skip = (currentPage - 1) * TICKETS_PER_PAGE;

  const where: any = {};
  if (params.status === 'active') {
    where.status = { notIn: ['CANCELLED', 'RETURNED'] };
  } else if (params.status) {
    where.status = params.status;
  }
  if (params.search) {
    where.OR = [
      { ticketNumber: { contains: params.search } },
      { customer: { name: { contains: params.search } } },
      { deviceBrand: { contains: params.search } },
      { deviceModel: { contains: params.search } },
    ];
  }

  // Get total count and paginated tickets
  const [totalCount, tickets] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      include: {
        customer: true,
        assignedTo: {
          select: {
            name: true,
            username: true,
          },
        },
        returns: {
          where: {
            status: 'PENDING',
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: TICKETS_PER_PAGE,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / TICKETS_PER_PAGE);

  // Serialize tickets data for client component (convert Date objects to strings)
  const serializedTickets = tickets.map((ticket) => ({
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    completedAt: ticket.completedAt?.toISOString() || null,
    customer: {
      id: ticket.customer.id,
      name: ticket.customer.name,
      phone: ticket.customer.phone,
    },
    assignedTo: ticket.assignedTo
      ? {
        username: ticket.assignedTo.username,
        name: ticket.assignedTo.name || ticket.assignedTo.username,
      }
      : null,
    hasPendingReturn: ticket.returns && ticket.returns.length > 0,
  }));

  return (
    <MainLayout>
      <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
        <TicketsPageClient
          tickets={serializedTickets}
          totalCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          status={params.status}
          search={params.search}
          userRole={session.user.role}
        />
      </Suspense>
    </MainLayout>
  );
}

