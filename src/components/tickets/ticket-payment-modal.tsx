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
import { useTicketPrint } from './ticket-print-context';

interface TicketPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    ticketNumber: string;
    status?: string;
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
  const { autoPrint } = useTicketPrint();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'card' | 'mobile' | 'other'>('cash');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{
    amount?: string;
    reason?: string;
    adjustment?: string;
  }>({});

  // Price adjustment mode state
  const [adjustmentMode, setAdjustmentMode] = useState<'add' | 'subtract'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Calculate values
  const finalPrice = ticket.finalPrice ?? ticket.estimatedPrice;
  const totalPaid = ticket.totalPaid ?? 0;
  const outstandingAmount = ticket.outstandingAmount ?? (finalPrice - totalPaid);
  const isFullyPaid = outstandingAmount <= 0;
  const isRepairedOrCompleted = ticket.status === 'REPAIRED' || ticket.status === 'COMPLETED';

  // Prefill amount with outstanding when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!isFullyPaid && outstandingAmount > 0) {
        setAmount(outstandingAmount.toFixed(2));
      } else {
        setAmount('0.00');
      }
      // Reset adjustment fields
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setAdjustmentMode('add');
    }
  }, [isOpen, outstandingAmount, isFullyPaid]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setMethod('cash');
      setReference('');
      setReason('');
      setErrors({});
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setAdjustmentMode('add');
    }
  }, [isOpen]);

  const validatePaymentForm = (): boolean => {
    const newErrors: { amount?: string; reason?: string } = {};

    if (!amount || amount.trim() === '') {
      newErrors.amount = t('tickets.pay_validation_amount_required');
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = t('tickets.pay_validation_amount_invalid');
      } else if (amountNum > outstandingAmount + 0.01) {
        newErrors.amount = t('tickets.pay_validation_amount_exceeds');
      }
    }

    const amountNum = parseFloat(amount);
    if (!isNaN(amountNum) && Math.abs(amountNum - outstandingAmount) > 0.01) {
      if (!reason || reason.trim().length < 5) {
        newErrors.reason = t('tickets.pay_validation_reason_required');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAdjustmentForm = (): boolean => {
    const newErrors: { adjustment?: string; reason?: string } = {};

    if (!adjustmentAmount || adjustmentAmount.trim() === '') {
      newErrors.adjustment = t('amountRequired') || 'Amount is required';
    } else {
      const adjNum = parseFloat(adjustmentAmount);
      if (isNaN(adjNum) || adjNum <= 0) {
        newErrors.adjustment = t('invalidAmount') || 'Please enter a valid amount';
      }
    }

    if (!adjustmentReason || adjustmentReason.trim().length < 5) {
      newErrors.reason = t('reasonRequired') || 'Please provide a reason (min 5 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = async () => {
    if (!validatePaymentForm()) {
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
      // Trigger auto-print
      await autoPrint();

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

  const handleAdjustmentSubmit = async () => {
    if (!validateAdjustmentForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const adjNum = parseFloat(adjustmentAmount);
      const adjustedAmount = adjustmentMode === 'add' ? adjNum : -adjNum;

      // Update the final price via PATCH
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceAdjustment: adjustedAmount,
          priceAdjustmentReason: adjustmentReason.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to adjust price');
      }

      const newFinalPrice = finalPrice + adjustedAmount;
      const action = adjustmentMode === 'add' ? 'increased' : 'decreased';

      toast({
        title: t('priceAdjusted') || 'Price Adjusted',
        description: `${t('ticketPrice') || 'Ticket price'} ${action} ${t('by') || 'by'} $${Math.abs(adjustedAmount).toFixed(2)}. ${t('newTotal') || 'New total'}: $${newFinalPrice.toFixed(2)}`,
      });

      onSuccess();
      onClose();
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to adjust price',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountNum = parseFloat(amount);
  const amountDiffers = !isNaN(amountNum) && Math.abs(amountNum - outstandingAmount) > 0.01;
  const adjustmentNum = parseFloat(adjustmentAmount) || 0;
  const newPricePreview = adjustmentMode === 'add'
    ? finalPrice + adjustmentNum
    : finalPrice - adjustmentNum;

  // Show adjustment mode for fully paid + repaired/completed tickets
  const showAdjustmentMode = isFullyPaid && isRepairedOrCompleted;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showAdjustmentMode
              ? (t('adjustPrice') || 'Adjust Price')
              : t('tickets.modal.pay_title').replace('{ticketNumber}', ticket.ticketNumber)
            }
          </DialogTitle>
          <DialogDescription>
            {showAdjustmentMode
              ? (t('adjustPriceDescription') || 'Add or subtract from the final price')
              : t('tickets.modal.pay_summary')
            }
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
            {!showAdjustmentMode && (
              <>
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
              </>
            )}
            {showAdjustmentMode && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('status') || 'Status'}:
                </span>
                <span className="font-medium text-green-600">
                  ✓ {t('fullyPaid') || 'Fully Paid'}
                </span>
              </div>
            )}
          </div>

          {/* ADJUSTMENT MODE: For fully paid, repaired/completed tickets */}
          {showAdjustmentMode ? (
            <>
              {/* Adjustment Alert */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg">info</span>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {t('adjustPriceInfo') || 'This ticket is fully paid. You can add or subtract from the final price if needed. The customer balance will be updated accordingly.'}
                  </p>
                </div>
              </div>

              {/* Adjustment Type Toggle */}
              <div>
                <Label>{t('adjustmentType') || 'Adjustment Type'}</Label>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentMode('add')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${adjustmentMode === 'add'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    <span className="font-medium">{t('addToPrice') || 'Add to Price'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentMode('subtract')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${adjustmentMode === 'subtract'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <span className="material-symbols-outlined">remove_circle</span>
                    <span className="font-medium">{t('subtractFromPrice') || 'Subtract'}</span>
                  </button>
                </div>
              </div>

              {/* Adjustment Amount */}
              <div>
                <Label htmlFor="adjustment-amount">
                  {t('adjustmentAmount') || 'Adjustment Amount'} *
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {adjustmentMode === 'add' ? '+$' : '-$'}
                  </span>
                  <Input
                    id="adjustment-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={adjustmentAmount}
                    onChange={(e) => {
                      setAdjustmentAmount(e.target.value);
                      if (errors.adjustment) {
                        setErrors({ ...errors, adjustment: undefined });
                      }
                    }}
                    placeholder="0.00"
                    className="pl-10"
                    errorText={errors.adjustment}
                    required
                  />
                </div>
              </div>

              {/* Adjustment Reason */}
              <div>
                <Label htmlFor="adjustment-reason">
                  {t('adjustmentReason') || 'Reason for Adjustment'} *
                </Label>
                <Textarea
                  id="adjustment-reason"
                  value={adjustmentReason}
                  onChange={(e) => {
                    setAdjustmentReason(e.target.value);
                    if (errors.reason) {
                      setErrors({ ...errors, reason: undefined });
                    }
                  }}
                  placeholder={t('adjustmentReasonPlaceholder') || 'e.g., Additional parts needed, Discount applied, etc.'}
                  className="mt-1"
                  rows={2}
                  errorText={errors.reason}
                  required
                />
              </div>

              {/* Preview */}
              {adjustmentNum > 0 && (
                <div className={`p-4 rounded-lg border-2 ${adjustmentMode === 'add'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('newPriceWillBe') || 'New price will be'}:
                      </p>
                      <p className="text-2xl font-bold">
                        ${newPricePreview.toFixed(2)}
                      </p>
                    </div>
                    <div className={`text-right ${adjustmentMode === 'add' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      <span className="text-lg font-medium">
                        {adjustmentMode === 'add' ? '+' : '-'}${adjustmentNum.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {adjustmentMode === 'subtract' && newPricePreview < totalPaid && (
                    <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-sm text-amber-800 dark:text-amber-200">
                      <span className="material-symbols-outlined text-sm align-middle mr-1">warning</span>
                      {t('refundNeeded') || 'Customer will be owed a refund of'}: ${(totalPaid - newPricePreview).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* PAYMENT MODE: Normal payment flow */
            <>
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
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button
            variant={showAdjustmentMode && adjustmentMode === 'subtract' ? 'destructive' : 'default'}
            onClick={showAdjustmentMode ? handleAdjustmentSubmit : handlePaymentSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t('loading')
              : showAdjustmentMode
                ? (t('applyAdjustment') || 'Apply Adjustment')
                : t('tickets.modal.pay_confirm')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
