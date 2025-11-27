'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Part {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

interface PartItem {
  partId: string;
  quantity: number;
}

interface ReturnItem {
  partId: string;
  quantity: number;
  reason?: string;
}

interface RepairedStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    parts: PartItem[];
    returnItems: ReturnItem[];
    returnReason?: string;
  }) => Promise<void>;
  ticketId: string;
  existingParts?: any[];
}

export function RepairedStatusModal({
  isOpen,
  onClose,
  onConfirm,
  ticketId,
  existingParts = [],
}: RepairedStatusModalProps) {
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [requiresPart, setRequiresPart] = useState<boolean | null>(null);
  const [selectedParts, setSelectedParts] = useState<PartItem[]>([]);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingParts, setIsLoadingParts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchParts();
      // If ticket already has parts, pre-populate
      if (existingParts.length > 0) {
        setRequiresPart(true);
        setSelectedParts(
          existingParts.map((tp: any) => ({
            partId: tp.partId,
            quantity: tp.quantity,
          }))
        );
      }
    } else {
      // Reset state when modal closes
      setRequiresPart(null);
      setSelectedParts([]);
      setReturnItems([]);
      setReturnReason('');
    }
  }, [isOpen, existingParts]);

  const fetchParts = async () => {
    setIsLoadingParts(true);
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setParts(data.filter((p: Part) => p.quantity > 0)); // Only show parts with available stock
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setIsLoadingParts(false);
    }
  };

  const handleAddPart = () => {
    setSelectedParts([...selectedParts, { partId: '', quantity: 1 }]);
  };

  const handleRemovePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, field: 'partId' | 'quantity', value: string | number) => {
    const newParts = [...selectedParts];
    newParts[index] = {
      ...newParts[index],
      [field]: field === 'quantity' ? Number(value) : value,
    };
    setSelectedParts(newParts);
  };

  const handleAddReturnItem = () => {
    if (selectedParts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add parts first before creating returns',
      });
      return;
    }
    setReturnItems([...returnItems, { partId: selectedParts[0].partId, quantity: 1 }]);
  };

  const handleRemoveReturnItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const handleReturnItemChange = (
    index: number,
    field: 'partId' | 'quantity' | 'reason',
    value: string | number
  ) => {
    const newItems = [...returnItems];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' ? Number(value) : value,
    };
    setReturnItems(newItems);
  };

  const handleConfirm = async () => {
    if (requiresPart === null) {
      toast({
        title: 'Error',
        description: 'Please indicate if the repair required a part',
      });
      return;
    }

    if (requiresPart) {
      // Validate parts
      for (const part of selectedParts) {
        if (!part.partId) {
          toast({
            title: 'Error',
            description: 'Please select a part for all entries',
          });
          return;
        }
        if (part.quantity < 1) {
          toast({
            title: 'Error',
            description: 'Quantity must be at least 1',
          });
          return;
        }

        // Check if part has enough quantity
        const partData = parts.find((p) => p.id === part.partId);
        if (partData && part.quantity > partData.quantity) {
          toast({
            title: 'Error',
            description: `Insufficient quantity for ${partData.name}. Available: ${partData.quantity}`,
          });
          return;
        }
      }

      if (selectedParts.length === 0) {
        toast({
          title: 'Error',
          description: 'Please add at least one part',
        });
        return;
      }

      // Validate return items if any
      for (const item of returnItems) {
        if (!item.partId) {
          toast({
            title: 'Error',
            description: 'Please select a part for all return items',
          });
          return;
        }
        if (item.quantity < 1) {
          toast({
            title: 'Error',
            description: 'Return quantity must be at least 1',
          });
          return;
        }

        // Check if return quantity doesn't exceed used quantity
        const usedPart = selectedParts.find((p) => p.partId === item.partId);
        if (!usedPart || item.quantity > usedPart.quantity) {
          toast({
            title: 'Error',
            description: 'Return quantity cannot exceed used quantity',
          });
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      await onConfirm({
        parts: requiresPart ? selectedParts : [],
        returnItems: returnItems.length > 0 ? returnItems : [],
        returnReason: returnItems.length > 0 ? returnReason : undefined,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update ticket status',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Ticket as Repaired</DialogTitle>
          <DialogDescription>
            Add parts used in the repair and handle any returns if needed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Does repair require a part? */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Did this repair require a part?
            </label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={requiresPart === true ? 'default' : 'outlined'}
                onClick={() => setRequiresPart(true)}
                size="sm"
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={requiresPart === false ? 'default' : 'outlined'}
                onClick={() => {
                  setRequiresPart(false);
                  setSelectedParts([]);
                  setReturnItems([]);
                }}
                size="sm"
              >
                No
              </Button>
            </div>
          </div>

          {/* Parts Section */}
          {requiresPart === true && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Parts Used</label>
                <Button type="button" onClick={handleAddPart} size="sm" variant="outlined">
                  Add Part
                </Button>
              </div>

              {selectedParts.length === 0 ? (
                <p className="text-sm text-gray-500">No parts added. Click "Add Part" to add parts used in the repair.</p>
              ) : (
                <div className="space-y-3">
                  {selectedParts.map((part, index) => {
                    const partData = parts.find((p) => p.id === part.partId);
                    return (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Select
                              value={part.partId}
                              onValueChange={(value) => handlePartChange(index, 'partId', value)}
                            >
                              <SelectTrigger label="Part" id={`part-${index}`}>
                                <SelectValue placeholder="Select a part" />
                              </SelectTrigger>
                              <SelectContent>
                                {parts.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} (Stock: {p.quantity}) - ${p.unitPrice.toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Input
                              id={`quantity-${index}`}
                              label="Quantity"
                              type="number"
                              min="1"
                              max={partData?.quantity || 1}
                              value={part.quantity.toString()}
                              onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                            />
                          </div>
                        </div>
                        {partData && (
                          <div className="text-sm text-gray-600">
                            Total: ${(partData.unitPrice * part.quantity).toFixed(2)}
                          </div>
                        )}
                        <Button
                          type="button"
                          onClick={() => handleRemovePart(index)}
                          size="sm"
                          variant="outlined"
                          className="w-full"
                        >
                          Remove Part
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Return Items Section */}
              {selectedParts.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Parts to Return (Optional)</label>
                    <Button type="button" onClick={handleAddReturnItem} size="sm" variant="outlined">
                      Add Return Item
                    </Button>
                  </div>

                  {returnItems.length > 0 && (
                    <div className="space-y-3">
                      {returnItems.map((item, index) => {
                        const partData = parts.find((p) => p.id === item.partId);
                        const usedPart = selectedParts.find((p) => p.partId === item.partId);
                        const maxReturn = usedPart?.quantity || 0;
                        return (
                          <div key={index} className="border rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Select
                                  value={item.partId}
                                  onValueChange={(value) => handleReturnItemChange(index, 'partId', value)}
                                >
                                  <SelectTrigger label="Part" id={`return-part-${index}`}>
                                    <SelectValue placeholder="Select a part" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedParts.map((sp) => {
                                      const spData = parts.find((p) => p.id === sp.partId);
                                      return (
                                        <SelectItem key={sp.partId} value={sp.partId}>
                                          {spData?.name || 'Unknown'} (Used: {sp.quantity})
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Input
                                  id={`return-quantity-${index}`}
                                  label="Return Quantity"
                                  type="number"
                                  min="1"
                                  max={maxReturn}
                                  value={item.quantity.toString()}
                                  onChange={(e) => handleReturnItemChange(index, 'quantity', e.target.value)}
                                  helperText={`Max: ${maxReturn}`}
                                />
                              </div>
                            </div>
                            <Textarea
                              id={`return-reason-${index}`}
                              label="Return Reason (Optional)"
                              rows={2}
                              value={item.reason || ''}
                              onChange={(e) => handleReturnItemChange(index, 'reason', e.target.value)}
                              placeholder="Reason for returning this part..."
                            />
                            <Button
                              type="button"
                              onClick={() => handleRemoveReturnItem(index)}
                              size="sm"
                              variant="outlined"
                              className="w-full"
                            >
                              Remove Return Item
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {returnItems.length > 0 && (
                    <Textarea
                      id="return-reason-general"
                      label="General Return Reason"
                      rows={2}
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="General reason for returns..."
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outlined" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Mark as Repaired'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

