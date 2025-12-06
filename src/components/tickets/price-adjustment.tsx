'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';

// Type definitions for ticket with price adjustments
interface PriceAdjustmentUser {
  name: string | null;
  username: string;
}

interface TicketPriceAdjustment {
  id: string;
  ticketId: string;
  userId: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  createdAt: Date | string;
  user: PriceAdjustmentUser;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  status: string;
  estimatedPrice: number;
  finalPrice: number | null;
  paid: boolean;
  priceAdjustments?: TicketPriceAdjustment[];
}

interface PriceAdjustmentProps {
  ticket: Ticket;
  userRole: string;
}

export function PriceAdjustment({ ticket, userRole }: PriceAdjustmentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [newPrice, setNewPrice] = useState(
    ticket.finalPrice !== null && ticket.finalPrice !== undefined
      ? ticket.finalPrice
      : ticket.estimatedPrice
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permission check for admin/staff
  const canManagePrice = userRole === 'ADMIN' || userRole === 'STAFF';

  // Only show price adjustment if repair is finished (REPAIRED)
  const canAdjustPrice = ticket.status === 'REPAIRED' && canManagePrice;

  // Toggle paid status handler
  // If not REPAIRED, don't show anything (price adjustment is only for REPAIRED tickets)
  if (!canAdjustPrice) {
    return null;
  }

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: t('error'),
        description: t('provideReasonForPriceAdjustment'),
      });
      return;
    }

    const price = parseFloat(newPrice.toString());
    if (isNaN(price) || price < 0) {
      toast({
        title: t('error'),
        description: t('enterValidPrice'),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalPrice: price,
          priceAdjustmentReason: reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('failedToAdjustPrice'));
      }

      toast({
        title: t('success'),
        description: t('priceAdjustedSuccessfully'),
      });

      setShowForm(false);
      setReason('');
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('failedToAdjustPrice');
      toast({
        title: t('error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Price Adjustment Form */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          size="sm"
        >
          {t('adjustPrice')}
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('adjustPrice')}</CardTitle>
            <CardDescription>{t('updateFinalPriceForTicket')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-price">{t('currentPrice')}</Label>
              <Input
                id="current-price"
                value={ticket.finalPrice ? `$${ticket.finalPrice.toFixed(2)}` : `$${ticket.estimatedPrice.toFixed(2)} (${t('estimated')})`}
                disabled
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-price">{t('newPrice')} ($) *</Label>
              <Input
                id="new-price"
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewPrice(value === '' ? 0 : parseFloat(value) || 0);
                }}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="adjustment-reason">{t('reasonForAdjustment')} *</Label>
              <textarea
                id="adjustment-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 mt-1"
                placeholder={t('explainPriceAdjustment')}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? t('saving') : t('saveAdjustment')}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setReason('');
                  setNewPrice(ticket.finalPrice || ticket.estimatedPrice);
                }}
                variant="outline"
                type="button"
              >
                {t('cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

