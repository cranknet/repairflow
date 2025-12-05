'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartFormModal } from '@/components/finance/PartFormModal';

interface Part {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  supplier: {
    id: string;
    name: string;
  } | null;
}

interface SelectedPart {
  partId: string;
  quantity: number;
  part: Part;
}

interface AddPartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  onSuccess: () => void;
  existingParts?: Array<{
    id: string;
    partId: string;
    quantity: number;
    part: Part;
  }>;
}

export function AddPartsModal({
  isOpen,
  onClose,
  ticketId,
  onSuccess,
  existingParts = [],
}: AddPartsModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [loadingParts, setLoadingParts] = useState(true);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPartModal, setShowPartModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchParts();
      // Initialize selected parts from existing parts
      const initialSelected = existingParts.map(tp => ({
        partId: tp.partId,
        quantity: tp.quantity,
        part: tp.part,
      }));
      setSelectedParts(initialSelected);
    }
  }, [isOpen, existingParts]);

  const fetchParts = async () => {
    setLoadingParts(true);
    try {
      const response = await fetch('/api/parts');
      if (response.ok) {
        const data = await response.json();
        setParts(data);
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoadingParts(false);
    }
  };

  const handlePartCreated = (part?: { id: string; name: string; sku: string }) => {
    if (part) {
      fetchParts();
    }
    setShowPartModal(false);
  };

  const filteredParts = parts.filter(part => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      part.name.toLowerCase().includes(query) ||
      part.sku.toLowerCase().includes(query) ||
      part.supplier?.name.toLowerCase().includes(query)
    );
  });

  const addPart = (part: Part) => {
    const existing = selectedParts.find(sp => sp.partId === part.id);
    if (existing) {
      setSelectedParts(selectedParts.map(sp =>
        sp.partId === part.id
          ? { ...sp, quantity: sp.quantity + 1 }
          : sp
      ));
    } else {
      setSelectedParts([...selectedParts, {
        partId: part.id,
        quantity: 1,
        part,
      }]);
    }
  };

  const removePart = (partId: string) => {
    setSelectedParts(selectedParts.filter(sp => sp.partId !== partId));
  };

  const updateQuantity = (partId: string, quantity: number) => {
    if (quantity <= 0) {
      removePart(partId);
      return;
    }
    setSelectedParts(selectedParts.map(sp =>
      sp.partId === partId
        ? { ...sp, quantity }
        : sp
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Add/update parts
      for (const selectedPart of selectedParts) {
        const existing = existingParts.find(ep => ep.partId === selectedPart.partId);
        const existingSelected = existingParts.find(ep => ep.partId === selectedPart.partId);
        
        if (existingSelected && existingSelected.quantity !== selectedPart.quantity) {
          // Update quantity - delete old and create new
          await fetch(`/api/tickets/${ticketId}/parts?ticketPartId=${existingSelected.id}`, {
            method: 'DELETE',
          });
        }
        
        if (!existingSelected || existingSelected.quantity !== selectedPart.quantity) {
          // Add new part or update quantity
          const response = await fetch(`/api/tickets/${ticketId}/parts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              partId: selectedPart.partId,
              quantity: selectedPart.quantity,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add part');
          }
        }
      }

      // Remove parts that were deselected
      for (const existingPart of existingParts) {
        if (!selectedParts.find(sp => sp.partId === existingPart.partId)) {
          await fetch(`/api/tickets/${ticketId}/parts?ticketPartId=${existingPart.id}`, {
            method: 'DELETE',
          });
        }
      }

      toast({
        title: t('success'),
        description: t('partsAddedToTicket') || 'Parts added to ticket successfully',
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToAddParts') || 'Failed to add parts',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalCost = selectedParts.reduce((sum, sp) => {
    return sum + (sp.part.unitPrice * sp.quantity);
  }, 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('addPartsToTicket') || 'Add Parts to Ticket'}</DialogTitle>
            <DialogDescription>
              {t('selectPartsUsedInRepair') || 'Select parts used in the repair process'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchParts') || 'Search parts...'}
                className="w-full px-4 py-2 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Available Parts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{t('availableParts') || 'Available Parts'}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPartModal(true)}
                  >
                    <span className="material-symbols-outlined text-sm mr-1">add</span>
                    {t('add')}
                  </Button>
                </div>
                <div className="border border-outline rounded-lg max-h-[400px] overflow-y-auto">
                  {loadingParts ? (
                    <div className="p-4 text-center text-on-surface-variant">
                      {t('loading') || 'Loading...'}
                    </div>
                  ) : filteredParts.length === 0 ? (
                    <div className="p-4 text-center text-on-surface-variant">
                      {t('noPartsFound') || 'No parts found'}
                    </div>
                  ) : (
                    <div className="divide-y divide-outline-variant">
                      {filteredParts.map(part => (
                        <div
                          key={part.id}
                          className="p-3 hover:bg-on-surface/4 cursor-pointer flex items-center justify-between"
                          onClick={() => addPart(part)}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{part.name}</p>
                            <p className="text-xs text-on-surface-variant font-mono">
                              {part.sku} {part.supplier && `• ${part.supplier.name}`}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {t('stock')}: {part.quantity} • ${part.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-primary text-sm">
                            add_circle
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Parts */}
              <div>
                <h3 className="font-medium mb-2">{t('selectedParts') || 'Selected Parts'}</h3>
                <div className="border border-outline rounded-lg max-h-[400px] overflow-y-auto">
                  {selectedParts.length === 0 ? (
                    <div className="p-4 text-center text-on-surface-variant">
                      {t('noPartsSelected') || 'No parts selected'}
                    </div>
                  ) : (
                    <div className="divide-y divide-outline-variant">
                      {selectedParts.map(selectedPart => {
                        const part = selectedPart.part;
                        return (
                          <div key={selectedPart.partId} className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{part.name}</p>
                                <p className="text-xs text-on-surface-variant font-mono">
                                  {part.sku}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removePart(selectedPart.partId)}
                                className="text-error hover:text-error/80"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-on-surface-variant">
                                {t('quantity')}:
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={selectedPart.quantity}
                                onChange={(e) => updateQuantity(selectedPart.partId, parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1 border border-outline rounded text-sm"
                              />
                              <span className="text-xs text-on-surface-variant ml-auto">
                                ${(part.unitPrice * selectedPart.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {selectedParts.length > 0 && (
                  <div className="mt-2 p-2 bg-primary-container rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{t('total')}:</span>
                      <span className="font-bold">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || selectedParts.length === 0}>
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  {t('saving') || 'Saving...'}
                </>
              ) : (
                t('save') || 'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showPartModal && (
        <PartFormModal
          onClose={() => setShowPartModal(false)}
          onSuccess={handlePartCreated}
        />
      )}
    </>
  );
}

