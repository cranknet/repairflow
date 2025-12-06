import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TicketDetailsClient } from '@/components/tickets/ticket-details-client';
import { TicketDetailHeader } from '@/components/tickets/ticket-detail-header';
import { TicketSidebar } from '@/components/tickets/ticket-sidebar';
import { TicketMainContent } from '@/components/tickets/ticket-main-content';

export default async function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          _count: {
            select: { tickets: true },
          },
          tickets: {
            select: {
              id: true,
              ticketNumber: true,
              status: true,
              deviceBrand: true,
              deviceModel: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
      parts: {
        include: {
          part: true,
        },
      },
      priceAdjustments: {
        include: {
          user: {
            select: {
              name: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      returns: {
        orderBy: { createdAt: 'desc' },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">search_off</span>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ticket Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The ticket you're looking for doesn't exist.</p>
        <a
          href="/tickets"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Tickets
        </a>
      </div>
    );
  }

  // Calculate payment amounts
  const totalPaid = ticket.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const finalPrice = ticket.finalPrice ?? ticket.estimatedPrice;
  const outstandingAmount = Math.max(0, finalPrice - totalPaid);

  // Prepare ticket object for client components
  const enrichedTicket = {
    ...ticket,
    totalPaid,
    outstandingAmount,
    parts: ticket.parts?.map(p => ({
      id: p.id,
      partId: p.partId,
      quantity: p.quantity,
      part: {
        id: p.part.id,
        name: p.part.name,
        sku: p.part.sku,
        unitPrice: p.part.unitPrice,
        quantity: p.part.quantity,
      },
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <TicketDetailHeader
        ticketNumber={ticket.ticketNumber}
        createdAt={ticket.createdAt}
      />

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        <TicketDetailsClient ticket={enrichedTicket} userRole={session.user.role} />
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content - Left Column (2/3 on desktop) */}
        <div className="flex-1 lg:w-2/3 order-2 lg:order-1">
          <TicketMainContent ticket={enrichedTicket} userRole={session.user.role} />
        </div>

        {/* Sidebar - Right Column (1/3 on desktop) */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0 order-1 lg:order-2">
          <div className="lg:sticky lg:top-6">
            <TicketSidebar ticket={enrichedTicket} userRole={session.user.role} />
          </div>
        </div>
      </div>
    </div>
  );
}
