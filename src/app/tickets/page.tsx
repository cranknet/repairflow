import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { TicketSearch } from '@/components/tickets/ticket-search';

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
    where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
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
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: TICKETS_PER_PAGE,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / TICKETS_PER_PAGE);

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
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tickets</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage repair tickets</p>
          </div>
          <Link href="/tickets/new">
            <Button>Create New Ticket</Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
              <TicketSearch />
            </Suspense>
            <div className="flex gap-2 flex-wrap">
              <Link href="/tickets">
                <Button variant={!params.status ? 'default' : 'outline'}>All</Button>
              </Link>
              <Link href="/tickets?status=active">
                <Button variant={params.status === 'active' ? 'default' : 'outline'}>
                  Active
                </Button>
              </Link>
              <Link href="/tickets?status=IN_PROGRESS">
                <Button variant={params.status === 'IN_PROGRESS' ? 'default' : 'outline'}>
                  In Progress
                </Button>
              </Link>
              <Link href="/tickets?status=WAITING_FOR_PARTS">
                <Button variant={params.status === 'WAITING_FOR_PARTS' ? 'default' : 'outline'}>
                  Waiting for Parts
                </Button>
              </Link>
              <Link href="/tickets?status=REPAIRED">
                <Button variant={params.status === 'REPAIRED' ? 'default' : 'outline'}>
                  Repaired
                </Button>
              </Link>
              <Link href="/tickets?status=COMPLETED">
                <Button variant={params.status === 'COMPLETED' ? 'default' : 'outline'}>
                  Completed
                </Button>
              </Link>
              <Link href="/tickets?status=CANCELLED">
                <Button variant={params.status === 'CANCELLED' ? 'default' : 'outline'}>
                  Cancelled
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Tickets ({totalCount})
              {params.search && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  - Filtered by &quot;{params.search}&quot;
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No tickets found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Ticket #
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Device
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Priority
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Estimated Price
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Created
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="font-medium text-primary-600 hover:underline"
                          >
                            {ticket.ticketNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4">{ticket.customer.name}</td>
                        <td className="py-3 px-4">
                          {ticket.deviceBrand} {ticket.deviceModel}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              ticket.status
                            )}`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ticket.priority === 'URGENT'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : ticket.priority === 'HIGH'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">${ticket.estimatedPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/tickets/${ticket.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {skip + 1} to {Math.min(skip + TICKETS_PER_PAGE, totalCount)} of {totalCount} tickets
                </div>
                <div className="flex gap-2">
                  <Link
                    href={{
                      pathname: '/tickets',
                      query: {
                        ...(params.status && { status: params.status }),
                        ...(params.search && { search: params.search }),
                        page: currentPage > 1 ? currentPage - 1 : 1,
                      },
                    }}
                  >
                    <Button variant="outline" size="sm" disabled={currentPage === 1}>
                      Previous
                    </Button>
                  </Link>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Link
                          key={pageNum}
                          href={{
                            pathname: '/tickets',
                            query: {
                              ...(params.status && { status: params.status }),
                              ...(params.search && { search: params.search }),
                              page: pageNum,
                            },
                          }}
                        >
                          <Button
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                  <Link
                    href={{
                      pathname: '/tickets',
                      query: {
                        ...(params.status && { status: params.status }),
                        ...(params.search && { search: params.search }),
                        page: currentPage < totalPages ? currentPage + 1 : totalPages,
                      },
                    }}
                  >
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages}>
                      Next
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

