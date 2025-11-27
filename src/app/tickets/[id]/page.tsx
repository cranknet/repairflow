import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { TicketDetailsClient } from '@/components/tickets/ticket-details-client';
import { TicketPrintButtons } from '@/components/tickets/ticket-print-buttons';
import { TicketTabs } from '@/components/tickets/ticket-tabs';
import { CustomerProfileButton } from '@/components/customers/customer-profile-button';
import { CustomerContactActions } from '@/components/customers/customer-contact-actions';

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
        include: {
          items: {
            include: {
              part: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!ticket) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket Not Found</h1>
          <Link href="/tickets">
            <Button className="mt-4">Back to Tickets</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'WAITING_FOR_PARTS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ticket.ticketNumber}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Created {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
          
          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="ml-auto flex items-center gap-2">
              <TicketPrintButtons ticket={ticket} />
              <TicketDetailsClient ticket={ticket} userRole={session.user.role} />
              <Link href="/tickets">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to List
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Customer Info Card */}
        <Card>
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
    </MainLayout>
  );
}

