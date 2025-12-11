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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PlusCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  LightBulbIcon,
  CubeIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

interface Supplier {
  id: string;
  name: string;
}

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
  ticketStatus?: string;
  deviceName?: string; // Device name for smart suggestions
}

export function AddPartsModal({
  isOpen,
  onClose,
  ticketId,
  onSuccess,
  existingParts = [],
  ticketStatus,
  deviceName,
}: AddPartsModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [loadingParts, setLoadingParts] = useState(true);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [changeToWaiting, setChangeToWaiting] = useState(ticketStatus === 'IN_PROGRESS');

  // Inline form state
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [isCreatingPart, setIsCreatingPart] = useState(false);
  const [formError, setFormError] = useState('');
  const [newPartForm, setNewPartForm] = useState({
    name: '',
    sku: '',
    description: '',
    quantity: '0',
    reorderLevel: '1',
    unitPrice: '0',
    supplierId: '',
  });

  const generateSKU = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sku = '';
    for (let i = 0; i < 8; i++) {
      sku += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sku;
  };

  useEffect(() => {
    if (isOpen) {
      fetchParts();
      const initialSelected = existingParts.map(tp => ({
        partId: tp.partId,
        quantity: tp.quantity,
        part: tp.part,
      }));
      setSelectedParts(initialSelected);
    }
  }, [isOpen, existingParts]);

  const fetchParts = async (): Promise<Part[]> => {
    setLoadingParts(true);
    try {
      const response = await fetch('/api/parts');
      if (response.ok) {
        const data = await response.json();
        setParts(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoadingParts(false);
    }
    return [];
  };

  const fetchSuppliers = async () => {
    if (suppliers.length > 0) return;
    setLoadingSuppliers(true);
    try {
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleOpenInlineForm = () => {
    setShowInlineForm(true);
    setFormError('');
    setNewPartForm({
      name: '',
      sku: generateSKU(),
      description: '',
      quantity: '0',
      reorderLevel: '1',
      unitPrice: '0',
      supplierId: '',
    });
    fetchSuppliers();
  };

  const handleCloseInlineForm = () => {
    setShowInlineForm(false);
    setFormError('');
  };

  const handleCreatePart = async () => {
    setFormError('');
    setIsCreatingPart(true);

    try {
      const response = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPartForm.name.trim(),
          sku: newPartForm.sku.trim(),
          description: newPartForm.description.trim() || undefined,
          quantity: parseInt(newPartForm.quantity) || 0,
          reorderLevel: parseInt(newPartForm.reorderLevel) || 1,
          unitPrice: parseFloat(newPartForm.unitPrice) || 0,
          supplierId: newPartForm.supplierId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.details) {
          const errorMessages = data.details.map((err: any) =>
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.error || 'Failed to create part');
      }

      const createdPart = await response.json();
      const updatedParts = await fetchParts();

      const newPart = updatedParts.find(p => p.id === createdPart.id);
      if (newPart) {
        setSelectedParts(prev => {
          const existing = prev.find(sp => sp.partId === newPart.id);
          if (existing) {
            return prev.map(sp =>
              sp.partId === newPart.id ? { ...sp, quantity: sp.quantity + 1 } : sp
            );
          }
          return [...prev, { partId: newPart.id, quantity: 1, part: newPart }];
        });
      }

      toast({
        title: t('success'),
        description: t('partCreated') || 'Part created successfully',
      });

      handleCloseInlineForm();
    } catch (error: any) {
      console.error('Error creating part:', error);
      setFormError(error.message || 'An error occurred');
    } finally {
      setIsCreatingPart(false);
    }
  };

  // Get suggested parts based on device name
  const suggestedParts = deviceName
    ? parts.filter(part => {
      const deviceWords = deviceName.toLowerCase().split(/\s+/);
      const partName = part.name.toLowerCase();
      // Match if part name contains any significant word from device name
      return deviceWords.some(word => word.length > 2 && partName.includes(word));
    }).slice(0, 3) // Limit to 3 suggestions
    : [];

  // Search results (only show when searching)
  const searchResults = searchQuery
    ? parts.filter(part => {
      const query = searchQuery.toLowerCase();
      return (
        part.name.toLowerCase().includes(query) ||
        part.sku.toLowerCase().includes(query) ||
        part.supplier?.name.toLowerCase().includes(query)
      );
    })
    : [];

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
      for (const selectedPart of selectedParts) {
        const existingSelected = existingParts.find(ep => ep.partId === selectedPart.partId);

        if (existingSelected && existingSelected.quantity !== selectedPart.quantity) {
          await fetch(`/api/tickets/${ticketId}/parts?ticketPartId=${existingSelected.id}`, {
            method: 'DELETE',
          });
        }

        if (!existingSelected || existingSelected.quantity !== selectedPart.quantity) {
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

      if (changeToWaiting && ticketStatus === 'IN_PROGRESS') {
        try {
          await fetch(`/api/tickets/${ticketId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'WAITING_FOR_PARTS' }),
          });
        } catch (e) {
          console.error('Failed to update status:', e);
        }
      }

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

  const isPartSelected = (partId: string) => selectedParts.some(sp => sp.partId === partId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addPartsToTicket') || 'Add Parts to Ticket'}</DialogTitle>
          <DialogDescription>
            {t('selectPartsUsedInRepair') || 'Select parts used in the repair process'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Inline Create Part Form */}
          {showInlineForm && (
            <div className="border border-primary/50 rounded-lg bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <PlusCircleIcon className="h-[18px] w-[18px] text-primary" />
                  {t('createNewPart') || 'Create New Part'}
                </h4>
                <button
                  type="button"
                  onClick={handleCloseInlineForm}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {formError && (
                <div className="p-2 bg-error/10 text-error text-sm rounded">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('partName') || 'Part Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPartForm.name}
                    onChange={(e) => setNewPartForm({ ...newPartForm, name: e.target.value })}
                    placeholder={t('enterPartName') || 'e.g., iPhone 14 Screen'}
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {t('sku') || 'SKU'} *
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewPartForm({ ...newPartForm, sku: generateSKU() })}
                      className="text-primary text-xs hover:underline flex items-center gap-0.5"
                    >
                      <ArrowPathIcon className="h-3 w-3" />
                      {t('regenerate') || 'Regenerate'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={newPartForm.sku}
                    onChange={(e) => setNewPartForm({ ...newPartForm, sku: e.target.value.toUpperCase().slice(0, 8) })}
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('initialQuantity') || 'Initial Quantity'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newPartForm.quantity}
                    onChange={(e) => setNewPartForm({ ...newPartForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('unitPrice') || 'Unit Price'} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={newPartForm.unitPrice}
                      onChange={(e) => setNewPartForm({ ...newPartForm, unitPrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('supplier') || 'Supplier'}
                  </label>
                  {loadingSuppliers ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground text-center border border-input rounded-lg">
                      {t('loading') || 'Loading...'}
                    </div>
                  ) : (
                    <select
                      value={newPartForm.supplierId}
                      onChange={(e) => setNewPartForm({ ...newPartForm, supplierId: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">{t('noSupplier') || 'No Supplier'}</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseInlineForm}
                  disabled={isCreatingPart}
                >
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreatePart}
                  disabled={isCreatingPart || !newPartForm.name.trim() || !newPartForm.sku.trim()}
                >
                  {isCreatingPart ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                      {t('creating') || 'Creating...'}
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1" />
                      {t('createAndSelect') || 'Create & Select'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Search Bar with Create Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-[18px] w-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchParts') || 'Search parts by name, SKU, or supplier...'}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {!showInlineForm && (
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenInlineForm}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                {t('createNew') || 'Create New'}
              </Button>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Search Results or Suggestions */}
            <div>
              {/* Show search results when searching */}
              {searchQuery ? (
                <>
                  <h3 className="font-medium text-sm mb-2 text-muted-foreground">
                    {t('searchResults') || 'Search Results'} ({searchResults.length})
                  </h3>
                  <div className="border border-border rounded-lg max-h-[300px] overflow-y-auto">
                    {loadingParts ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto" />
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        {t('noPartsFound') || 'No parts found'}
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {searchResults.map(part => (
                          <div
                            key={part.id}
                            className={`p-3 cursor-pointer flex items-center justify-between transition-colors ${isPartSelected(part.id)
                              ? 'bg-primary/10'
                              : 'hover:bg-muted/50'
                              }`}
                            onClick={() => addPart(part)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{part.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {part.sku} {part.supplier && `• ${part.supplier.name}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t('stock')}: {part.quantity} • ${part.unitPrice.toFixed(2)}
                              </p>
                            </div>
                            {isPartSelected(part.id) ? (
                              <CheckCircleIcon className="h-[18px] w-[18px] text-primary ml-2" />
                            ) : (
                              <PlusCircleIcon className="h-[18px] w-[18px] text-primary ml-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : suggestedParts.length > 0 ? (
                /* Show suggestions when not searching and device name matches */
                <>
                  <h3 className="font-medium text-sm mb-2 text-muted-foreground flex items-center gap-1">
                    <LightBulbIcon className="h-4 w-4 text-amber-500" />
                    {t('suggestedParts') || 'Suggested for'} &quot;{deviceName}&quot;
                  </h3>
                  <div className="border border-border rounded-lg">
                    <div className="divide-y divide-border">
                      {suggestedParts.map(part => (
                        <div
                          key={part.id}
                          className={`p-3 cursor-pointer flex items-center justify-between transition-colors ${isPartSelected(part.id)
                            ? 'bg-primary/10'
                            : 'hover:bg-muted/50'
                            }`}
                          onClick={() => addPart(part)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{part.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ${part.unitPrice.toFixed(2)} • {t('stock')}: {part.quantity}
                            </p>
                          </div>
                          {isPartSelected(part.id) ? (
                            <CheckCircleIcon className="h-[18px] w-[18px] text-primary ml-2" />
                          ) : (
                            <PlusCircleIcon className="h-[18px] w-[18px] text-primary ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('searchForMore') || 'Use search to find more parts'}
                  </p>
                </>
              ) : (
                /* Empty state when no search and no suggestions */
                <div className="border border-dashed border-border rounded-lg p-6 text-center">
                  <CubeIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('searchToFindParts') || 'Search to find parts or create a new one'}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Selected Parts */}
            <div>
              <h3 className="font-medium text-sm mb-2 text-muted-foreground">
                {t('selectedParts') || 'Selected Parts'} ({selectedParts.length})
              </h3>
              <div className="border border-border rounded-lg max-h-[300px] overflow-y-auto">
                {selectedParts.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    <ShoppingCartIcon className="h-6 w-6 mx-auto mb-1" />
                    <p>{t('noPartsSelected') || 'No parts selected'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {selectedParts.map(selectedPart => {
                      const part = selectedPart.part;
                      return (
                        <div key={selectedPart.partId} className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{part.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{part.sku}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePart(selectedPart.partId)}
                              className="text-error hover:text-error/80 ml-2"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">{t('qty') || 'Qty'}:</label>
                            <input
                              type="number"
                              min="1"
                              value={selectedPart.quantity}
                              onChange={(e) => updateQuantity(selectedPart.partId, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 border border-input rounded text-sm bg-background text-foreground text-center"
                            />
                            <span className="text-sm font-medium ml-auto">
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
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{t('total') || 'Total'}:</span>
                    <span className="font-bold text-lg">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status change option */}
        {ticketStatus === 'IN_PROGRESS' && selectedParts.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <input
              type="checkbox"
              id="change-to-waiting"
              checked={changeToWaiting}
              onChange={(e) => setChangeToWaiting(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="change-to-waiting" className="text-sm text-blue-800 dark:text-blue-200">
              {t('markAsWaitingForParts') || 'Mark ticket as "Waiting for Parts"'}
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                {t('saving') || 'Saving...'}
              </>
            ) : (
              t('save') || 'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
