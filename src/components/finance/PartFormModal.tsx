'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SupplierFormModal } from './SupplierFormModal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Supplier {
    id: string;
    name: string;
}

interface Part {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    quantity: number;
    reorderLevel: number;
    unitPrice: number;
    supplierId: string | null;
    supplier: {
        id: string;
        name: string;
    } | null;
}

interface PartFormModalProps {
    part?: Part | null;
    onClose: () => void;
    onSuccess: (part?: { id: string; name: string; sku: string }) => void;
    isOpen?: boolean;
}

export function PartFormModal({ part, onClose, onSuccess, isOpen = true }: PartFormModalProps) {
    const { t } = useLanguage();
    const isEditing = !!part;
    const [formData, setFormData] = useState({
        name: part?.name || '',
        sku: part?.sku || '',
        description: part?.description || '',
        quantity: part?.quantity.toString() || '0',
        reorderLevel: part?.reorderLevel.toString() || '1',
        unitPrice: part?.unitPrice.toString() || '0',
        supplierId: part?.supplierId || part?.supplier?.id || '',
        supplier: '',
    });
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSupplierModal, setShowSupplierModal] = useState(false);

    const generateSKU = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let sku = '';
        for (let i = 0; i < 8; i++) {
            sku += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return sku;
    };

    useEffect(() => {
        fetchSuppliers();
        if (part) {
            setFormData({
                name: part.name,
                sku: part.sku,
                description: part.description || '',
                quantity: part.quantity.toString(),
                reorderLevel: part.reorderLevel.toString(),
                unitPrice: part.unitPrice.toString(),
                supplierId: part.supplierId || part.supplier?.id || '',
                supplier: '',
            });
        } else {
            setFormData(prev => ({ ...prev, sku: generateSKU() }));
        }
    }, [part]);

    const fetchSuppliers = async () => {
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

    const handleSupplierCreated = (supplier?: { id: string; name: string }) => {
        if (supplier) {
            setSuppliers([...suppliers, supplier]);
            setFormData({ ...formData, supplierId: supplier.id, supplier: '' });
        }
        setShowSupplierModal(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const url = isEditing ? `/api/parts/${part.id}` : '/api/parts';
            const method = isEditing ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    sku: formData.sku.trim(),
                    description: formData.description.trim() || undefined,
                    quantity: parseInt(formData.quantity) || 0,
                    reorderLevel: parseInt(formData.reorderLevel) || 1,
                    unitPrice: parseFloat(formData.unitPrice) || 0,
                    supplierId: formData.supplierId || undefined,
                    supplier: formData.supplier.trim() || undefined,
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
                throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} part`);
            }

            const updatedPart = await response.json();
            onSuccess(updatedPart);
        } catch (error: any) {
            console.error(`Error ${isEditing ? 'updating' : 'creating'} part:`, error);
            setError(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? (t('finance.partForm.editTitle') || 'Edit Part') : t('finance.partForm.title')}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? (t('finance.partForm.editDescription') || 'Update the part details below')
                                : (t('finance.partForm.description') || 'Add a new part to your inventory')
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Alert */}
                        {error && (
                            <div className="p-3 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 text-error-600 dark:text-error-400 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Part Name & SKU - 2 column on desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="part-name">
                                    {t('finance.partForm.name')} <span className="text-error-500">*</span>
                                </Label>
                                <Input
                                    id="part-name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('finance.partForm.namePlaceholder')}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="part-sku">
                                        {t('finance.partForm.sku')} <span className="text-error-500">*</span>
                                    </Label>
                                    {!isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, sku: generateSKU() })}
                                            className="text-primary text-xs hover:underline flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">refresh</span>
                                            {t('finance.partForm.regenerateSKU')}
                                        </button>
                                    )}
                                </div>
                                <Input
                                    id="part-sku"
                                    type="text"
                                    required
                                    maxLength={8}
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase().slice(0, 8) })}
                                    placeholder={t('finance.partForm.skuPlaceholder')}
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="part-description">{t('finance.partForm.description')}</Label>
                            <Textarea
                                id="part-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t('finance.partForm.descriptionPlaceholder')}
                                rows={2}
                            />
                        </div>

                        {/* Quantity & Reorder Level - 2 column */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="part-quantity">
                                    {t('finance.partForm.quantity')} <span className="text-error-500">*</span>
                                </Label>
                                <Input
                                    id="part-quantity"
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="part-reorder">
                                    {t('finance.partForm.reorderLevel')} <span className="text-error-500">*</span>
                                </Label>
                                <Input
                                    id="part-reorder"
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.reorderLevel}
                                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Unit Price */}
                        <div className="space-y-2">
                            <Label htmlFor="part-price">
                                {t('finance.partForm.unitPrice')} <span className="text-error-500">*</span>
                            </Label>
                            <Input
                                id="part-price"
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={formData.unitPrice}
                                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                                placeholder="0.00"
                                leadingIcon={<span className="text-muted-foreground">$</span>}
                            />
                        </div>

                        {/* Supplier Selection */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="part-supplier">{t('finance.partForm.supplier')}</Label>
                                <button
                                    type="button"
                                    onClick={() => setShowSupplierModal(true)}
                                    className="text-primary text-xs hover:underline flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    {t('finance.partForm.addSupplier')}
                                </button>
                            </div>
                            {loadingSuppliers ? (
                                <div className="px-4 py-3 border border-input rounded-lg bg-muted/50 text-muted-foreground text-center text-sm">
                                    {t('finance.partForm.loadingSuppliers')}
                                </div>
                            ) : (
                                <select
                                    id="part-supplier"
                                    value={formData.supplierId}
                                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value, supplier: '' })}
                                    className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                                >
                                    <option value="">{t('finance.partForm.noSupplier')}</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Fallback supplier name input */}
                            {!formData.supplierId && (
                                <div className="mt-2">
                                    <p className="text-xs text-muted-foreground mb-1.5">
                                        {t('finance.partForm.supplierFallback')}
                                    </p>
                                    <Input
                                        id="part-supplier-name"
                                        type="text"
                                        value={formData.supplier}
                                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                        placeholder={t('finance.partForm.supplierNamePlaceholder')}
                                        inputSize="small"
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-4 gap-3">
                            <Button type="button" variant="outline" onClick={onClose}>
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                        {isEditing ? (t('finance.partForm.updating') || 'Updating...') : t('finance.partForm.creating')}
                                    </span>
                                ) : (
                                    isEditing ? (t('finance.partForm.updatePart') || 'Update Part') : t('finance.partForm.createPart')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {showSupplierModal && (
                <SupplierFormModal
                    isOpen={showSupplierModal}
                    onClose={() => setShowSupplierModal(false)}
                    onSuccess={handleSupplierCreated}
                />
            )}
        </>
    );
}
