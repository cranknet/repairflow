import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TicketDetailsClient } from '@/components/tickets/ticket-details-client';
import { TicketTabs } from '@/components/tickets/ticket-tabs';
import { CustomerProfileButton } from '@/components/customers/customer-profile-button';
import { CustomerContactActions } from '@/components/customers/customer-contact-actions';
import { TicketDetailHeader } from '@/components/tickets/ticket-detail-header';

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
            take: 10, // Limit to recent 10 tickets
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
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket Not Found</h1>
        <Link href="/tickets">
          <Button className="mt-4">Back to Tickets</Button>
        </Link>
      </div>
    );
  }

  // Calculate payment amounts
  const totalPaid = ticket.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const finalPrice = ticket.finalPrice ?? ticket.estimatedPrice;
  const outstandingAmount = Math.max(0, finalPrice - totalPaid);

  // Prepare ticket object for client component with computed values
  const enrichedTicket = {
    ...ticket,
    totalPaid,
    outstandingAmount,
    // Transform parts to match expected interface
    parts: ticket.parts?.map(p => ({
      id: p.id,
      partId: p.partId,
      quantity: p.quantity,
      part: {
        id: p.part.id,
        name: p.part.name,
        sku: p.part.sku,
        unitPrice: p.part.unitPrice,
      },
    })),
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <TicketDetailHeader
        ticketNumber={ticket.ticketNumber}
        createdAt={ticket.createdAt}
      />

      {/* Ticket Progress Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        <TicketDetailsClient ticket={enrichedTicket} userRole={session.user.role} />
      </div>

      {/* Customer Info Card */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Customer</p>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-medium text-lg">{ticket.customer.name}</p>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {ticket.customer.phone}
                </span>
                {ticket.customer.email && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    • {ticket.customer.email}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <CustomerContactActions
                phone={ticket.customer.phone}
                email={ticket.customer.email}
                customerName={ticket.customer.name}
                ticketData={{
                  ticketNumber: ticket.ticketNumber,
                  trackingCode: ticket.trackingCode,
                  finalPrice: ticket.finalPrice || undefined,
                }}
              />
              <CustomerProfileButton
                customer={{
                  ...ticket.customer,
                  createdAt: ticket.customer.createdAt.toISOString(),
                  tickets: ticket.customer.tickets?.map(t => ({
                    ...t,
                    createdAt: t.createdAt.toISOString(),
                  })),
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content with Tabs */}
      <TicketTabs ticket={ticket} userRole={session.user.role} />
    </div>
  );
}

