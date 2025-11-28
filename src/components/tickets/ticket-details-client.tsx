'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CompletionSMSPrompt } from './completion-sms-prompt';
import { useLanguage } from '@/contexts/language-context';




export function TicketDetailsClient({ ticket, userRole }: { ticket: any; userRole: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [paid, setPaid] = useState(ticket.paid || false);
  const [showSMSPrompt, setShowSMSPrompt] = useState(false);

  const STATUS_OPTIONS = [
    { value: 'RECEIVED', label: t('received') },
    { value: 'IN_PROGRESS', label: t('inProgress') },
    { value: 'REPAIRED', label: t('repaired') },
    { value: 'CANCELLED', label: t('cancelled') },
    { value: 'RETURNED', label: t('returned') },
  ];

  const updateStatus = async (newStatus: string, notes?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          statusNotes: notes || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: t('success'),
        description: t('ticketStatusUpdated'),
      });
      setStatusNotes('');

      // Show SMS prompt if status changed to REPAIRED
      if (newStatus === 'REPAIRED' && ticket.status !== 'REPAIRED') {
        setShowSMSPrompt(true);
      }

      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToUpdateTicketStatus'),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePaidStatus = async (paidStatus: boolean) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: paidStatus }),
      });

      if (!response.ok) throw new Error('Failed to update paid status');

      toast({
        title: t('success'),
        description: `${t('paymentStatusUpdatedTo')} ${paidStatus ? t('paid') : t('unpaid')}`,
      });
      setPaid(paidStatus);
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToUpdatePaidStatus'),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus !== ticket.status) {
      updateStatus(newStatus, statusNotes);
    }
  };



  const isReturned = ticket.status === 'RETURNED';

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Manual Status Update */}
        <div className="min-w-[150px]">
          <select
            id="status-select"
            value={ticket.status}
            onChange={handleStatusChange}
            disabled={isUpdating || isReturned}
            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isReturned ? t('ticketReturnedCannotEdit') : t('changeTicketStatus')}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isReturned && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('ticketReturnedCannotEdit')}
            </p>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2">
          {ticket.status !== 'CANCELLED' && ticket.status !== 'RETURNED' && (
            <>
              {ticket.status === 'RECEIVED' && (
                <Button
                  onClick={() => updateStatus('IN_PROGRESS')}
                  disabled={isUpdating}
                  size="sm"
                >
                  {t('startRepair')}
                </Button>
              )}
              {ticket.status === 'IN_PROGRESS' && (
                <Button
                  onClick={() => updateStatus('REPAIRED')}
                  disabled={isUpdating}
                  size="sm"
                >
                  {t('markRepaired')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>



      {/* SMS Prompt Modal */}
      <CompletionSMSPrompt
        isOpen={showSMSPrompt}
        onClose={() => setShowSMSPrompt(false)}
        phoneNumber={ticket.customer.phone}
        customerName={ticket.customer.name}
        ticketData={{
          ticketNumber: ticket.ticketNumber,
          trackingCode: ticket.trackingCode,
          finalPrice: ticket.finalPrice || undefined,
        }}
      />
    </>
  );
}

