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

interface RepairedStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    parts: PartItem[];
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
    }
  }, [isOpen, existingParts]);

  const fetchParts = async () => {
    setIsLoadingParts(true);
    try {
      // Fetch parts directly from database via a simple API
      const response = await fetch('/api/parts');
      if (response.ok) {
        const data = await response.json();
        setParts(data);
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
        if (!part.partId || part.partId.trim() === '') {
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

      }

      if (selectedParts.length === 0) {
        toast({
          title: 'Error',
          description: 'Please add at least one part',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      await onConfirm({
        parts: requiresPart ? selectedParts : [],
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
                                    {p.name} {p.unitPrice ? `- $${p.unitPrice.toFixed(2)}` : ''}
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
                                value={part.quantity.toString()}
                                onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                              />
                          </div>
                        </div>
                        {partData && partData.unitPrice && (
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

