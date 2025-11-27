'use client';

import { useState } from 'react';
import { ReturnsTable } from './returns-table';
import { NoReturnsFound } from './no-returns-found';
import { CreateReturnModal } from './create-return-modal';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { PlusIcon } from '@heroicons/react/24/outline';

interface ReturnsClientProps {
  returns: any[];
  eligibleTickets: any[];
}

export function ReturnsClient({ returns, eligibleTickets }: ReturnsClientProps) {
  const { t } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const handleCreateReturn = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowCreateModal(true);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Create Return Section */}
        {eligibleTickets.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Create New Return</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select a completed and paid ticket to create a return
                </p>
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {eligibleTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex-1">
                    <div className="font-medium">{ticket.ticketNumber}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {ticket.customer.name} • {ticket.parts.length} part(s)
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCreateReturn(ticket)}
                    size="sm"
                    variant="outlined"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create Return
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Returns List */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Return Requests</h3>
          {returns.length > 0 ? (
            <ReturnsTable returns={returns} />
          ) : (
            <NoReturnsFound />
          )}
        </div>
      </div>

      <CreateReturnModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
      />
    </>
  );
}

