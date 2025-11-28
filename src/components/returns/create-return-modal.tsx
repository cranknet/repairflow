'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';

interface CreateReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any;
}

export function CreateReturnModal({ isOpen, onClose, ticket }: CreateReturnModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnData, setReturnData] = useState({
    reason: '',
    refundAmount: 0,
  });

  useEffect(() => {
    if (isOpen && ticket) {
      // Reset form when modal opens
      const maxRefund = ticket.finalPrice || ticket.estimatedPrice || 0;
      setReturnData({ 
        reason: '', 
        refundAmount: maxRefund 
      });
    }
  }, [isOpen, ticket]);

  const handleUseFullAmount = () => {
    const maxRefund = ticket?.finalPrice || ticket?.estimatedPrice || 0;
    setReturnData({ ...returnData, refundAmount: maxRefund });
  };

  const handleSubmitReturn = async () => {
    if (!returnData.reason.trim()) {
      toast({
        title: t('error'),
        description: 'Please provide a reason for the return',
        variant: 'destructive',
      });
      return;
    }

    if (returnData.refundAmount <= 0) {
      toast({
        title: t('error'),
        description: 'Refund amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    const maxRefund = ticket?.finalPrice || ticket?.estimatedPrice || 0;
    if (returnData.refundAmount > maxRefund) {
      toast({
        title: t('error'),
        description: `Refund amount cannot exceed ticket price (${maxRefund})`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          reason: returnData.reason,
          refundAmount: returnData.refundAmount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create return');
      }

      toast({
        title: t('success'),
        description: t('returnRequestCreatedSuccessfully'),
      });

      setReturnData({ reason: '', refundAmount: 0 });
      onClose();
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('failedToCreateReturnRequest'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ticket) return null;

  const maxRefund = ticket.finalPrice || ticket.estimatedPrice || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Return for {ticket.ticketNumber}</DialogTitle>
          <DialogDescription>
            Create a return request for this ticket. The ticket will be marked as returned.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="return-reason">{t('reason')} *</Label>
            <textarea
              id="return-reason"
              value={returnData.reason}
              onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
              rows={3}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 mt-1"
              placeholder="Reason for return..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="refund-amount">Refund Amount *</Label>
              <Button 
                onClick={handleUseFullAmount} 
                size="sm" 
                variant="outlined" 
                type="button"
              >
                Use Full Amount
              </Button>
            </div>
            <div className="space-y-2">
              <Input
                id="refund-amount"
                type="number"
                min="0"
                max={maxRefund}
                step="0.01"
                value={returnData.refundAmount}
                onChange={(e) => setReturnData({ ...returnData, refundAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ticket price: ${maxRefund.toFixed(2)} (Maximum refund: ${maxRefund.toFixed(2)})
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmitReturn} disabled={isSubmitting}>
            {isSubmitting ? t('loading') : t('submitReturn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
