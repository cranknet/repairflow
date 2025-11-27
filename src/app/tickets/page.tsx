import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { TicketSearch } from '@/components/tickets/ticket-search';
import { TicketFilters } from '@/components/tickets/ticket-filters';
import { TicketsListHeader } from '@/components/tickets/tickets-list-header';
import { NoTicketsFound } from '@/components/tickets/no-tickets-found';
import { PageHeader } from '@/components/layout/page-header';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';
import { TicketsTable } from '@/components/tickets/tickets-table';

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
        <PageHeader
          titleKey="tickets"
          descriptionKey="manageTickets"
          actionButton={{
            labelKey: 'createNewTicket',
            href: '/tickets/new',
          }}
        />

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <TranslatedCardTitle translationKey="searchAndFilters" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
              <TicketSearch />
            </Suspense>
            <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
              <TicketFilters currentStatus={params.status} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <TicketsListHeader count={totalCount} searchQuery={params.search} />
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <NoTicketsFound />
            ) : (
              <TicketsTable tickets={tickets} />
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

