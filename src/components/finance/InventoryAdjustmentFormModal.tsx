'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { PartFormModal } from './PartFormModal';

interface Part {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
}

interface InventoryAdjustmentFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function InventoryAdjustmentFormModal({ onClose, onSuccess }: InventoryAdjustmentFormModalProps) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        partId: '',
        qtyChange: '',
        cost: '',
        costPerUnit: '',
        reason: '',
    });
    const [parts, setParts] = useState<Part[]>([]);
    const [loadingParts, setLoadingParts] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPartModal, setShowPartModal] = useState(false);

    useEffect(() => {
        fetchParts();
    }, []);

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
        // Auto-calculate cost per unit if both cost and qtyChange are provided
        if (formData.cost && value && parseFloat(value) !== 0) {
            const costPerUnit = parseFloat(formData.cost) / Math.abs(parseFloat(value));
            setFormData(prev => ({ ...prev, qtyChange: value, costPerUnit: costPerUnit.toFixed(2) }));
        }
    };

    const handleCostChange = (value: string) => {
        setFormData({ ...formData, cost: value });
        // Auto-calculate cost per unit if both cost and qtyChange are provided
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
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.details) {
                    // Zod validation errors
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
            <div className="fixed inset-0 bg-scrim/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-surface rounded-xl shadow-md-level3 w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-surface border-b border-outline-variant px-6 py-4 flex items-center justify-between">
                        <h2 className="text-headline-small font-bold text-on-surface">{t('finance.inventoryAdjustmentForm.title')}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-on-surface/8 transition-colors"
                            aria-label="Close"
                        >
                            <span className="material-symbols-outlined text-on-surface-variant">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="p-4 bg-error-container text-on-error-container rounded-lg text-body-medium">
                                {error}
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-label-large text-on-surface">
                                    {t('finance.inventoryAdjustmentForm.part')} <span className="text-error">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPartModal(true)}
                                    className="text-primary text-label-medium hover:underline flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    {t('finance.inventoryAdjustmentForm.addPart')}
                                </button>
                            </div>
                            {loadingParts ? (
                                <div className="px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface-variant text-center">
                                    {t('finance.inventoryAdjustmentForm.loadingParts')}
                                </div>
                            ) : (
                                <select
                                    required
                                    value={formData.partId}
                                    onChange={(e) => setFormData({ ...formData, partId: e.target.value })}
                                    className="w-full px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">{t('finance.inventoryAdjustmentForm.selectPart')}</option>
                                    {parts.map((part) => (
                                        <option key={part.id} value={part.id}>
                                            {part.name} ({part.sku})
                                        </option>
                                    ))}
                                </select>
                            )}
                            {selectedPart && (
                                <div className="mt-2 text-body-small text-on-surface-variant">
                                    {t('finance.currentStock')}: {selectedPart.unitPrice > 0 && `$${selectedPart.unitPrice.toFixed(2)} per unit`}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-label-large text-on-surface mb-2">
                                {t('finance.qtyChange')} <span className="text-error">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    value={formData.qtyChange}
                                    onChange={(e) => handleQtyChange(e.target.value)}
                                    placeholder={t('finance.inventoryAdjustmentForm.qtyChangePlaceholder')}
                                    className="w-full px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <div className="mt-1 text-body-small text-on-surface-variant">
                                    {t('finance.inventoryAdjustmentForm.qtyChangeHint')}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-label-large text-on-surface mb-2">
                                {t('finance.inventory.totalCost')} <span className="text-error">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    value={formData.cost}
                                    onChange={(e) => handleCostChange(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-label-large text-on-surface mb-2">
                                {t('finance.costPerUnit')}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.costPerUnit}
                                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                                    placeholder={t('finance.inventoryAdjustmentForm.costPerUnitPlaceholder')}
                                    className="w-full pl-8 pr-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="mt-1 text-body-small text-on-surface-variant">
                                {t('finance.inventoryAdjustmentForm.costPerUnitHint')}
                            </div>
                        </div>

                        <div>
                            <label className="block text-label-large text-on-surface mb-2">
                                {t('finance.reason')} <span className="text-error">*</span>
                            </label>
                            <textarea
                                required
                                minLength={3}
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder={t('finance.inventoryAdjustmentForm.reasonPlaceholder')}
                                rows={3}
                                className="w-full px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-outline text-on-surface rounded-full hover:bg-on-surface/8 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-full hover:shadow-md-level2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        {t('finance.inventoryAdjustmentForm.creating')}
                                    </span>
                                ) : (
                                    t('finance.inventoryAdjustmentForm.createAdjustment')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showPartModal && (
                <div className="fixed inset-0 z-[60]">
                    <PartFormModal
                        onClose={() => setShowPartModal(false)}
                        onSuccess={handlePartCreated}
                    />
                </div>
            )}
        </>
    );
}

