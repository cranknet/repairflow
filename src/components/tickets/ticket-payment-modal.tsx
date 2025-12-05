'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';

interface TicketPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    ticketNumber: string;
    customer: {
      name: string;
    };
    deviceBrand: string;
    deviceModel: string;
    finalPrice?: number | null;
    estimatedPrice: number;
    outstandingAmount?: number;
    totalPaid?: number;
  };
  onSuccess: () => void;
}

export function TicketPaymentModal({
  isOpen,
  onClose,
  ticket,
  onSuccess,
}: TicketPaymentModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'card' | 'mobile' | 'other'>('cash');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{
    amount?: string;
    reason?: string;
  }>({});

  // Calculate outstanding amount
  const outstandingAmount = ticket.outstandingAmount ??
    ((ticket.finalPrice ?? ticket.estimatedPrice) - (ticket.totalPaid ?? 0));

  // Prefill amount with outstanding when modal opens
  useEffect(() => {
    if (isOpen && outstandingAmount > 0) {
      setAmount(outstandingAmount.toFixed(2));
    } else if (isOpen) {
      setAmount('0.00');
    }
  }, [isOpen, outstandingAmount]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setMethod('cash');
      setReference('');
      setReason('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { amount?: string; reason?: string } = {};

    // Validate amount
    if (!amount || amount.trim() === '') {
      newErrors.amount = t('tickets.pay_validation_amount_required');
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = t('tickets.pay_validation_amount_invalid');
      } else if (amountNum > outstandingAmount + 0.01) {
        // Small tolerance for rounding
        newErrors.amount = t('tickets.pay_validation_amount_exceeds');
      }
    }

    // Validate reason if amount differs from outstanding
    const amountNum = parseFloat(amount);
    if (!isNaN(amountNum) && Math.abs(amountNum - outstandingAmount) > 0.01) {
      if (!reason || reason.trim().length < 5) {
        newErrors.reason = t('tickets.pay_validation_reason_required');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method,
          reference: reference.trim() || undefined,
          reason: reason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = error.error || t('tickets.pay_failed');

        if (response.status === 403) {
          errorMessage = t('tickets.pay_forbidden');
        } else if (response.status === 400) {
          errorMessage = error.error || errorMessage;
        }

        throw new Error(errorMessage);
      }

      toast({
        title: t('success'),
        description: t('tickets.pay_success'),
      });

      onSuccess();
      onClose();
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('tickets.pay_failed'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalPrice = ticket.finalPrice ?? ticket.estimatedPrice;
  const totalPaid = ticket.totalPaid ?? 0;
  const amountNum = parseFloat(amount);
  const amountDiffers = !isNaN(amountNum) && Math.abs(amountNum - outstandingAmount) > 0.01;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('tickets.modal.pay_title').replace('{ticketNumber}', ticket.ticketNumber)}
          </DialogTitle>
          <DialogDescription>
            {t('tickets.modal.pay_summary')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Ticket Summary */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('ticketNumber')}:</span>
              <span className="font-medium">{ticket.ticketNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('customer')}:</span>
              <span className="font-medium">{ticket.customer.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('device')}:</span>
              <span className="font-medium">
                {ticket.deviceBrand} {ticket.deviceModel}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {t('finalPrice') || 'Repair Price'}:
              </span>
              <span className="font-medium">${finalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {t('tickets.modal.pay_outstanding')}:
              </span>
              <span className="font-medium text-primary-600">
                ${outstandingAmount.toFixed(2)}
              </span>
            </div>
            {totalPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('paid') || 'Total Paid'}:
                </span>
                <span className="font-medium">${totalPaid.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="payment-amount">
              {t('tickets.modal.pay_amount_label')} *
            </Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0"
              max={outstandingAmount + 0.01}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                // Clear amount error when user types
                if (errors.amount) {
                  setErrors({ ...errors, amount: undefined });
                }
              }}
              errorText={errors.amount}
              className="mt-1"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="payment-method">
              {t('tickets.modal.pay_method_label')} *
            </Label>
            <Select value={method} onValueChange={(value: any) => setMethod(value)}>
              <SelectTrigger id="payment-method" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t('tickets.modal.pay_method_cash')}</SelectItem>
                <SelectItem value="card">{t('tickets.modal.pay_method_card')}</SelectItem>
                <SelectItem value="mobile">{t('tickets.modal.pay_method_mobile')}</SelectItem>
                <SelectItem value="other">{t('tickets.modal.pay_method_other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference (Optional) */}
          <div>
            <Label htmlFor="payment-reference">
              {t('tickets.modal.pay_reference_label')}
            </Label>
            <Input
              id="payment-reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t('tickets.modal.pay_reference_label')}
              className="mt-1"
            />
          </div>

          {/* Reason (Required if amount differs) */}
          {amountDiffers && (
            <div>
              <Label htmlFor="payment-reason">
                {t('tickets.modal.pay_reason_label')} *
              </Label>
              <Textarea
                id="payment-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  // Clear reason error when user types
                  if (errors.reason) {
                    setErrors({ ...errors, reason: undefined });
                  }
                }}
                errorText={errors.reason}
                className="mt-1"
                rows={3}
                required
              />
            </div>
          )}

          {/* Confirmation Text */}
          {!isNaN(amountNum) && amountNum > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('tickets.modal.pay_confirmation_text')
                  .replace('{amount}', `$${amountNum.toFixed(2)}`)
                  .replace('{ticketNumber}', ticket.ticketNumber)
                  .replace('{method}', t(`tickets.modal.pay_method_${method}`))}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('loading') : t('tickets.modal.pay_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

