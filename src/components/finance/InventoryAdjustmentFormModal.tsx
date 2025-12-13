'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PartFormModal } from './PartFormModal';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
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
    unitPrice: number;
}

interface Ticket {
    id: string;
    ticketNumber: string;
    customer: {
        name: string;
    };
}

interface InventoryAdjustmentFormModalProps {
    isOpen?: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function InventoryAdjustmentFormModal({ isOpen = true, onClose, onSuccess }: InventoryAdjustmentFormModalProps) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        partId: '',
        qtyChange: '',
        cost: '',
        costPerUnit: '',
        reason: '',
        ticketId: '',
        addToTicket: false,
    });
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [parts, setParts] = useState<Part[]>([]);
    const [loadingParts, setLoadingParts] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPartModal, setShowPartModal] = useState(false);

    useEffect(() => {
        fetchParts();
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
            const response = await fetch('/api/tickets?limit=100&status=REPAIRED,IN_PROGRESS');
            if (response.ok) {
                const data = await response.json();
                setTickets(data.tickets || data || []);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoadingTickets(false);
        }
    };

    const fetchParts = async () => {
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
            setParts([...parts, { id: part.id, name: part.name, sku: part.sku, unitPrice: 0 }]);
            setFormData({ ...formData, partId: part.id });
        }
        setShowPartModal(false);
    };

    const handleQtyChange = (value: string) => {
        setFormData({ ...formData, qtyChange: value });
        if (formData.cost && value && parseFloat(value) !== 0) {
            const costPerUnit = parseFloat(formData.cost) / Math.abs(parseFloat(value));
            setFormData(prev => ({ ...prev, qtyChange: value, costPerUnit: costPerUnit.toFixed(2) }));
        }
    };

    const handleCostChange = (value: string) => {
        setFormData({ ...formData, cost: value });
        if (value && formData.qtyChange && parseFloat(formData.qtyChange) !== 0) {
            const costPerUnit = parseFloat(value) / Math.abs(parseFloat(formData.qtyChange));
            setFormData(prev => ({ ...prev, cost: value, costPerUnit: costPerUnit.toFixed(2) }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const qtyChange = parseInt(formData.qtyChange);
            if (qtyChange === 0) {
                throw new Error(t('finance.inventoryAdjustmentForm.qtyChangeCannotBeZero'));
            }

            const response = await fetch('/api/v2/inventory-adjustments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partId: formData.partId,
                    qtyChange: qtyChange,
                    cost: parseFloat(formData.cost) || 0,
                    costPerUnit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : undefined,
                    reason: formData.reason.trim(),
                    ticketId: formData.addToTicket && formData.ticketId ? formData.ticketId : undefined,
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
                throw new Error(data.error || 'Failed to create inventory adjustment');
            }

            onSuccess();
        } catch (error: any) {
            console.error('Error creating inventory adjustment:', error);
            setError(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const selectedPart = parts.find(p => p.id === formData.partId);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('finance.inventoryAdjustmentForm.title')}</DialogTitle>
                        <DialogDescription>
                            {t('finance.inventoryAdjustmentForm.description') || 'Add or remove inventory with cost tracking'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Alert */}
                        {error && (
                            <div className="p-3 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 text-error-600 dark:text-error-400 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Part Selection */}
                        <div className="space-y-2">
                            <div className="flex-between">
                                <Label htmlFor="adj-part">
                                    {t('finance.inventoryAdjustmentForm.part')} <span className="text-error-500">*</span>
                                </Label>
                                <button
                                    type="button"
                                    onClick={() => setShowPartModal(true)}
                                    className="text-primary text-xs hover:underline flex items-center gap-1"
                                >
                                    <PlusIcon className="h-3.5 w-3.5" />
                                    {t('finance.inventoryAdjustmentForm.addPart')}
                                </button>
                            </div>
                            {loadingParts ? (
                                <div className="px-4 py-3 border border-input rounded-lg bg-muted/50 text-muted-foreground text-center text-sm">
                                    {t('finance.inventoryAdjustmentForm.loadingParts')}
                                </div>
                            ) : (
                                <select
                                    id="adj-part"
                                    required
                                    value={formData.partId}
                                    onChange={(e) => setFormData({ ...formData, partId: e.target.value })}
                                    className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                                >
                                    <option value="">{t('finance.inventoryAdjustmentForm.selectPart')}</option>
                                    {parts.map((part) => (
                                        <option key={part.id} value={part.id}>
                                            {part.name} ({part.sku})
                                        </option>
                                    ))}
                                </select>
                            )}
                            {selectedPart && selectedPart.unitPrice > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {t('finance.currentStock')}: ${selectedPart.unitPrice.toFixed(2)} per unit
                                </p>
                            )}
                        </div>

                        {/* Qty Change & Total Cost - 2 column */}
                        <div className="grid-form">
                            <div className="space-y-2">
                                <Label htmlFor="adj-qty">
                                    {t('finance.qtyChange')} <span className="text-error-500">*</span>
                                </Label>
                                <Input
                                    id="adj-qty"
                                    type="number"
                                    required
                                    value={formData.qtyChange}
                                    onChange={(e) => handleQtyChange(e.target.value)}
                                    placeholder={t('finance.inventoryAdjustmentForm.qtyChangePlaceholder')}
                                    helperText={t('finance.inventoryAdjustmentForm.qtyChangeHint')}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adj-cost">
                                    {t('finance.inventory.totalCost')} <span className="text-error-500">*</span>
                                </Label>
                                <Input
                                    id="adj-cost"
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    value={formData.cost}
                                    onChange={(e) => handleCostChange(e.target.value)}
                                    placeholder="0.00"
                                    leadingIcon={<span className="text-muted-foreground">$</span>}
                                />
                            </div>
                        </div>

                        {/* Cost Per Unit */}
                        <div className="space-y-2">
                            <Label htmlFor="adj-cpu">{t('finance.costPerUnit')}</Label>
                            <Input
                                id="adj-cpu"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.costPerUnit}
                                onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                                placeholder={t('finance.inventoryAdjustmentForm.costPerUnitPlaceholder')}
                                leadingIcon={<span className="text-muted-foreground">$</span>}
                                helperText={t('finance.inventoryAdjustmentForm.costPerUnitHint')}
                            />
                        </div>

                        {/* Add to Ticket Option */}
                        <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.addToTicket}
                                    onChange={(e) => setFormData({ ...formData, addToTicket: e.target.checked, ticketId: e.target.checked ? formData.ticketId : '' })}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary focus:ring-offset-0"
                                />
                                <span className="text-sm font-medium text-foreground">
                                    {t('finance.addPartToTicket') || 'Add part to ticket'}
                                </span>
                            </label>

                            {formData.addToTicket && (
                                <div className="mt-3">
                                    <select
                                        required={formData.addToTicket}
                                        value={formData.ticketId}
                                        onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                                        className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                                        disabled={loadingTickets}
                                    >
                                        <option value="">{t('finance.selectTicket') || 'Select a ticket...'}</option>
                                        {tickets.map((ticket) => (
                                            <option key={ticket.id} value={ticket.id}>
                                                {ticket.ticketNumber} - {ticket.customer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {t('finance.addPartToTicketHint') || 'When enabled, the part will be added to the selected ticket'}
                            </p>
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <Label htmlFor="adj-reason">
                                {t('finance.reason')} <span className="text-error-500">*</span>
                            </Label>
                            <Textarea
                                id="adj-reason"
                                required
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder={t('finance.inventoryAdjustmentForm.reasonPlaceholder')}
                                rows={3}
                            />
                        </div>

                        <DialogFooter className="pt-4 gap-3">
                            <Button type="button" variant="outline" onClick={onClose}>
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                        {t('finance.inventoryAdjustmentForm.creating')}
                                    </span>
                                ) : (
                                    t('finance.inventoryAdjustmentForm.createAdjustment')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {showPartModal && (
                <PartFormModal
                    isOpen={showPartModal}
                    onClose={() => setShowPartModal(false)}
                    onSuccess={handlePartCreated}
                />
            )}
        </>
    );
}
