'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export function ReturnHandler({ ticket }: { ticket: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnData, setReturnData] = useState({
    reason: '',
    items: [] as Array<{ partId: string; quantity: number; reason: string; condition: 'GOOD' | 'DAMAGED' }>,
  });

  const handleAddReturnItem = () => {
    if (ticket.parts.length === 0) {
      toast({
        title: 'No Parts',
        description: 'This ticket has no parts to return',
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
        title: 'Error',
        description: 'Please provide a reason for the return',
      });
      return;
    }

    if (returnData.items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to return',
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

      if (!response.ok) throw new Error('Failed to create return');

      toast({
        title: 'Success',
        description: 'Return request created successfully',
      });

      setReturnData({ reason: '', items: [] });
      setShowReturnForm(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create return request',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveReturn = async (returnId: string) => {
    try {
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      if (!response.ok) throw new Error('Failed to approve return');

      toast({
        title: 'Success',
        description: 'Return approved. Good parts restored to inventory, damaged parts recorded as loss.',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve return',
      });
    }
  };

  const handleRejectReturn = async (returnId: string) => {
    try {
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (!response.ok) throw new Error('Failed to reject return');

      toast({
        title: 'Success',
        description: 'Return rejected',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject return',
      });
    }
  };

  // Only allow returns when repair is completed (REPAIRED) and customer has paid
  const canCreateReturn = ticket.status === 'REPAIRED' && ticket.paid === true;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Returns</h3>
        {!showReturnForm && canCreateReturn && (
          <Button onClick={() => setShowReturnForm(true)} size="sm" variant="outlined">
            Create Return
          </Button>
        )}
        {!canCreateReturn && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Returns can only be created after repair is completed and customer has paid
          </p>
        )}
      </div>

      {/* Return Form */}
      {showReturnForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Return</CardTitle>
            <CardDescription>Return parts from this ticket</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="return-reason">Reason *</Label>
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
                    const part = ticket.parts.find((p: any) => p.partId === item.partId);
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

            <div className="flex gap-2">
              <Button onClick={handleSubmitReturn} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Return'}
              </Button>
              <Button
                onClick={() => {
                  setShowReturnForm(false);
                  setReturnData({ reason: '', items: [] });
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

      {/* Existing Returns */}
      {ticket.returns && ticket.returns.length > 0 && (
        <div className="space-y-2">
          {(ticket.returns || []).map((returnRecord: any) => (
            <Card key={returnRecord.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Return #{returnRecord.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(returnRecord.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        returnRecord.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : returnRecord.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {returnRecord.status}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Reason:</span> {returnRecord.reason}
                  </p>
                  <div>
                    <p className="text-sm font-medium mb-1">Items:</p>
                    <div className="space-y-1">
                      {returnRecord.items.map((item: any) => {
                        const condition = item.condition || 'GOOD';
                        const conditionColor = condition === 'DAMAGED' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
                        return (
                          <div key={item.id} className="text-sm text-gray-600 dark:text-gray-400">
                            • {item.part.name} - Qty: {item.quantity}
                            <span className={`ml-2 font-medium ${conditionColor}`}>
                              ({condition})
                            </span>
                            {item.reason && ` - ${item.reason}`}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {returnRecord.status === 'PENDING' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleApproveReturn(returnRecord.id)}
                        size="sm"
                        variant="outlined"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectReturn(returnRecord.id)}
                        size="sm"
                        variant="outlined"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

