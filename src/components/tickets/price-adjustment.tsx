'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface PriceAdjustmentProps {
  ticket: any;
  userRole: string;
}

export function PriceAdjustment({ ticket, userRole }: PriceAdjustmentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [newPrice, setNewPrice] = useState(
    ticket.finalPrice !== null && ticket.finalPrice !== undefined 
      ? ticket.finalPrice 
      : ticket.estimatedPrice
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show price adjustment if repair is finished (REPAIRED)
  const canAdjustPrice =
    ticket.status === 'REPAIRED' &&
    (userRole === 'ADMIN' || userRole === 'STAFF');

  if (!canAdjustPrice) {
    return null;
  }

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the price adjustment',
      });
      return;
    }

    const price = parseFloat(newPrice.toString());
    if (isNaN(price) || price < 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid price',
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
        throw new Error(errorData.error || 'Failed to adjust price');
      }

      toast({
        title: 'Success',
        description: 'Price adjusted successfully',
      });

      setShowForm(false);
      setReason('');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust price',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          variant="outlined"
          size="sm"
        >
          Adjust Price
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Adjust Price</CardTitle>
            <CardDescription>Update the final price for this ticket</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-price">Current Price</Label>
              <Input
                id="current-price"
                value={ticket.finalPrice ? `$${ticket.finalPrice.toFixed(2)}` : `$${ticket.estimatedPrice.toFixed(2)} (Estimated)`}
                disabled
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-price">New Price ($) *</Label>
              <Input
                id="new-price"
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="adjustment-reason">Reason for Adjustment *</Label>
              <textarea
                id="adjustment-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 mt-1"
                placeholder="Explain why the price is being adjusted..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Adjustment'}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setReason('');
                  setNewPrice(ticket.finalPrice || ticket.estimatedPrice);
                }}
                variant="outlined"
                type="button"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

