'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CompletionSMSPrompt } from './completion-sms-prompt';
import { RepairedStatusModal } from './repaired-status-modal';

const STATUS_OPTIONS = [
  { value: 'RECEIVED', label: 'Received' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REPAIRED', label: 'Repaired' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURNED', label: 'Returned' },
];

export function TicketDetailsClient({ ticket, userRole }: { ticket: any; userRole: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [paid, setPaid] = useState(ticket.paid || false);
  const [showSMSPrompt, setShowSMSPrompt] = useState(false);
  const [showRepairedModal, setShowRepairedModal] = useState(false);

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
        title: 'Success',
        description: 'Ticket status updated',
      });
      setStatusNotes('');
      
      // Show SMS prompt if status changed to REPAIRED
      if (newStatus === 'REPAIRED' && ticket.status !== 'REPAIRED') {
        setShowSMSPrompt(true);
      }
      
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
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
        title: 'Success',
        description: `Payment status updated to ${paidStatus ? 'Paid' : 'Unpaid'}`,
      });
      setPaid(paidStatus);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus !== ticket.status) {
      // If changing to REPAIRED, show modal instead of directly updating
      if (newStatus === 'REPAIRED') {
        setShowRepairedModal(true);
      } else {
        updateStatus(newStatus, statusNotes);
      }
    }
  };

  const handleRepairedConfirm = async (data: {
    parts: Array<{ partId: string; quantity: number }>;
    returnItems: Array<{ partId: string; quantity: number; reason?: string }>;
    returnReason?: string;
  }) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REPAIRED',
          statusNotes: statusNotes || undefined,
          parts: data.parts,
          returnItems: data.returnItems.length > 0 ? data.returnItems : undefined,
          returnReason: data.returnReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: 'Success',
        description: 'Ticket marked as repaired',
      });
      setStatusNotes('');
      setShowRepairedModal(false);
      
      // Show SMS prompt
      setShowSMSPrompt(true);
      
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update ticket status',
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Manual Status Update */}
        <div className="min-w-[150px]">
          <select
            id="status-select"
            value={ticket.status}
            onChange={handleStatusChange}
            disabled={isUpdating}
            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
            title="Change ticket status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
                  Start Repair
                </Button>
              )}
              {ticket.status === 'IN_PROGRESS' && (
                <Button
                  onClick={() => setShowRepairedModal(true)}
                  disabled={isUpdating}
                  size="sm"
                >
                  Mark Repaired
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Repaired Status Modal */}
      <RepairedStatusModal
        isOpen={showRepairedModal}
        onClose={() => setShowRepairedModal(false)}
        onConfirm={handleRepairedConfirm}
        ticketId={ticket.id}
        existingParts={ticket.parts}
      />

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

