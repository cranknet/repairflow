'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TicketSearch } from '@/components/tickets/ticket-search';
import { TicketFilters } from '@/components/tickets/ticket-filters';
import { TicketsListHeader } from '@/components/tickets/tickets-list-header';
import { NoTicketsFound } from '@/components/tickets/no-tickets-found';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';
import { TicketsTable } from '@/components/tickets/tickets-table';
import { NewTicketModal } from '@/components/tickets/new-ticket-modal';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';

interface Ticket {
  id: string;
  ticketNumber: string;
  status: string;
  priority: string;
  deviceBrand: string;
  deviceModel: string;
  estimatedPrice: number;
  createdAt: Date | string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  assignedTo: {
    name: string;
    username: string;
  } | null;
}

interface TicketsPageClientProps {
  tickets: Ticket[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  status?: string;
  search?: string;
}

export function TicketsPageClient({ 
  tickets, 
  totalCount, 
  currentPage, 
  totalPages,
  status,
  search 
}: TicketsPageClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('tickets')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('manageTickets')}</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>{t('createNewTicket')}</Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <TranslatedCardTitle translationKey="searchAndFilters" />
          </CardHeader>
          <CardContent className="space-y-4">
            <TicketSearch />
            <TicketFilters currentStatus={status} />
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <TicketsListHeader count={totalCount} searchQuery={search} />
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
                  Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} tickets
                </div>
                <div className="flex gap-2">
                  <Link
                    href={{
                      pathname: '/tickets',
                      query: {
                        ...(status && { status }),
                        ...(search && { search }),
                        page: currentPage > 1 ? currentPage - 1 : 1,
                      },
                    }}
                  >
                    <Button variant="outlined" size="sm" disabled={currentPage === 1}>
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
                              ...(status && { status }),
                              ...(search && { search }),
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
                        ...(status && { status }),
                        ...(search && { search }),
                        page: currentPage < totalPages ? currentPage + 1 : totalPages,
                      },
                    }}
                  >
                    <Button variant="outlined" size="sm" disabled={currentPage === totalPages}>
                      Next
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <NewTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

