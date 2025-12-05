import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      tickets: {
        include: {
          assignedTo: {
            select: {
              name: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Not Found</h1>
        <Link href="/customers">
          <Button className="mt-4">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">Customer Details</p>
        </div>
        <Link href="/customers">
          <Button variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to List
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
              {customer.email && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              )}
              {customer.address && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                  <p className="font-medium">{customer.address}</p>
                </div>
              )}
              {customer.notes && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                  <p className="font-medium">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ticket History ({customer.tickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.tickets.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No tickets yet</p>
              ) : (
                <div className="space-y-4">
                  {customer.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 last:border-0"
                    >
                      <div>
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="font-medium text-primary-600 hover:underline"
                        >
                          {ticket.ticketNumber}
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {ticket.deviceBrand} {ticket.deviceModel} - {ticket.deviceIssue}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${ticket.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : ticket.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
