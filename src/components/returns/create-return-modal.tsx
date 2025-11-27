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
    items: [] as Array<{ partId: string; quantity: number; reason: string; condition: 'GOOD' | 'DAMAGED' }>,
  });

  useEffect(() => {
    if (isOpen && ticket) {
      // Reset form when modal opens
      setReturnData({ reason: '', items: [] });
    }
  }, [isOpen, ticket]);

  const handleAddReturnItem = () => {
    if (!ticket.parts || ticket.parts.length === 0) {
      toast({
        title: t('error'),
        description: 'This ticket has no parts to return',
        variant: 'destructive',
      });
      return;
    }

    const firstPart = ticket.parts[0];
    setReturnData({
      ...returnData,
      items: [
        ...returnData.items,
        {
          partId: firstPart.partId,
          quantity: 1,
          reason: '',
          condition: 'GOOD' as const,
        },
      ],
    });
  };

  const handleRemoveReturnItem = (index: number) => {
    setReturnData({
      ...returnData,
      items: returnData.items.filter((_, i) => i !== index),
    });
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

    if (returnData.items.length === 0) {
      toast({
        title: t('error'),
        description: 'Please add at least one item to return',
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
          items: returnData.items,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create return');
      }

      toast({
        title: t('success'),
        description: 'Return request created successfully',
      });

      setReturnData({ reason: '', items: [] });
      onClose();
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to create return request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Return for {ticket.ticketNumber}</DialogTitle>
          <DialogDescription>
            Create a return request for parts from this ticket
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
              <Label>Items to Return</Label>
              <Button onClick={handleAddReturnItem} size="sm" variant="outlined" type="button">
                Add Item
              </Button>
            </div>

            {returnData.items.length === 0 ? (
              <p className="text-sm text-gray-500">No items added. Click &quot;Add Item&quot; to add parts.</p>
            ) : (
              <div className="space-y-2">
                {returnData.items.map((item, index) => {
                  const part = ticket.parts?.find((p: any) => p.partId === item.partId);
                  const partInfo = part?.part;
                  const estimatedLoss = item.condition === 'DAMAGED' && partInfo?.unitPrice
                    ? partInfo.unitPrice * item.quantity
                    : 0;
                  
                  return (
                    <div key={index} className={`border rounded-lg p-3 space-y-2 ${item.condition === 'DAMAGED' ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : ''}`}>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Part</Label>
                          <select
                            value={item.partId}
                            onChange={(e) => {
                              const newItems = [...returnData.items];
                              newItems[index].partId = e.target.value;
                              setReturnData({ ...returnData, items: newItems });
                            }}
                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                          >
                            {(ticket.parts || []).map((p: any) => (
                              <option key={p.partId} value={p.partId}>
                                {p.part.name} (Used: {p.quantity})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            max={part?.quantity || 1}
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...returnData.items];
                              newItems[index].quantity = parseInt(e.target.value) || 1;
                              setReturnData({ ...returnData, items: newItems });
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Condition *</Label>
                        <select
                          value={item.condition}
                          onChange={(e) => {
                            const newItems = [...returnData.items];
                            newItems[index].condition = e.target.value as 'GOOD' | 'DAMAGED';
                            setReturnData({ ...returnData, items: newItems });
                          }}
                          className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                        >
                          <option value="GOOD">Good (Restore to inventory)</option>
                          <option value="DAMAGED">Damaged (Loss)</option>
                        </select>
                        {item.condition === 'DAMAGED' && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            ⚠️ This part will be marked as a loss and will not be restored to inventory
                          </p>
                        )}
                      </div>
                      {estimatedLoss > 0 && (
                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded p-2">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            Estimated Loss: ${estimatedLoss.toFixed(2)}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label>Item Reason (optional)</Label>
                        <Input
                          value={item.reason}
                          onChange={(e) => {
                            const newItems = [...returnData.items];
                            newItems[index].reason = e.target.value;
                            setReturnData({ ...returnData, items: newItems });
                          }}
                          placeholder="Reason for returning this item..."
                        />
                      </div>
                      <Button
                        onClick={() => handleRemoveReturnItem(index)}
                        size="sm"
                        variant="ghost"
                        type="button"
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmitReturn} disabled={isSubmitting}>
            {isSubmitting ? t('loading') : 'Submit Return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

