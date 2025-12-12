import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TicketsPageClient } from '@/components/tickets/tickets-page-client';

const TICKETS_PER_PAGE = 10;

async function getTickets(where: any, skip: number) {
  const tickets = await prisma.ticket.findMany({
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
      payments: {
        select: {
          amount: true,
        },
      },
      satisfactionRatings: {
        select: {
          id: true,
          rating: true,
          comment: true,
          phoneNumber: true,
          verifiedBy: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: TICKETS_PER_PAGE,
  });

  return tickets.map((ticket) => {
    // Calculate total paid and outstanding amount
    const totalPaid = ticket.payments.reduce((sum, p) => sum + p.amount, 0);
    const finalPrice = ticket.finalPrice ?? ticket.estimatedPrice;
    const outstandingAmount = Math.max(0, finalPrice - totalPaid);

    return {
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
      totalPaid,
      outstandingAmount,
      satisfactionRating: ticket.satisfactionRatings && ticket.satisfactionRatings.length > 0
        ? {
          id: ticket.satisfactionRatings[0].id,
          rating: ticket.satisfactionRatings[0].rating,
          comment: ticket.satisfactionRatings[0].comment,
          phoneNumber: ticket.satisfactionRatings[0].phoneNumber,
          verifiedBy: ticket.satisfactionRatings[0].verifiedBy,
          createdAt: ticket.satisfactionRatings[0].createdAt.toISOString(),
        }
        : null,
    };
  });
}

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

  const where: any = {
    deletedAt: null, // Exclude soft-deleted tickets
  };
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

  // Initiate promises WITHOUT awaiting them
  const ticketsPromise = getTickets(where, skip);
  const totalCountPromise = prisma.ticket.count({ where });

  return (
    <TicketsPageClient
      ticketsPromise={ticketsPromise}
      totalCountPromise={totalCountPromise}
      currentPage={currentPage}
      status={params.status}
      search={params.search}
      userRole={session.user.role}
    />
  );
}