'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { SupplierFormModal } from './SupplierFormModal';

interface Supplier {
    id: string;
    name: string;
}

interface PartFormModalProps {
    onClose: () => void;
    onSuccess: (part?: { id: string; name: string; sku: string }) => void;
}

export function PartFormModal({ onClose, onSuccess }: PartFormModalProps) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        quantity: '0',
        reorderLevel: '5',
        unitPrice: '0',
        supplierId: '',
        supplier: '', // Fallback supplier name
    });
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSupplierModal, setShowSupplierModal] = useState(false);

    useEffect(() => {
        fetchSuppliers();
    }, []);

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
            const response = await fetch('/api/parts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    sku: formData.sku.trim(),
                    description: formData.description.trim() || undefined,
                    quantity: parseInt(formData.quantity) || 0,
                    reorderLevel: parseInt(formData.reorderLevel) || 5,
                    unitPrice: parseFloat(formData.unitPrice) || 0,
                    supplierId: formData.supplierId || undefined,
                    supplier: formData.supplier.trim() || undefined,
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
                throw new Error(data.error || 'Failed to create part');
            }

            const part = await response.json();
            onSuccess(part);
        } catch (error: any) {
            console.error('Error creating part:', error);
            setError(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-scrim/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-surface rounded-xl shadow-md-level3 w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-surface border-b border-outline-variant px-6 py-4 flex items-center justify-between">
                        <h2 className="text-headline-small font-bold text-on-surface">{t('finance.partForm.title')}</h2>
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
                            <label className="block text-label-large text-on-surface mb-2">
                                {t('finance.partForm.name')} <span className="text-error">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('finance.partForm.namePlaceholder')}
                                className="w-full px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-label-large text-on-surface mb-2">
                                {t('finance.partForm.sku')} <span className="text-error">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                placeholder={t('finance.partForm.skuPlaceholder')}
                                className="w-full px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-label-large text-on-surface mb-2">
                                {t('finance.partForm.description')}
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t('finance.partForm.descriptionPlaceholder')}
                                rows={3}
                                className="w-full px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-label-large text-on-surface mb-2">
                                    {t('finance.partForm.quantity')} <span className="text-error">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-label-large text-on-surface mb-2">
                                    {t('finance.partForm.reorderLevel')} <span className="text-error">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.reorderLevel}
                                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                                    className="w-full px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-label-large text-on-surface mb-2">
                                {t('finance.partForm.unitPrice')} <span className="text-error">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    value={formData.unitPrice}
                                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-label-large text-on-surface">
                                    {t('finance.partForm.supplier')}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowSupplierModal(true)}
                                    className="text-primary text-label-medium hover:underline flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    {t('finance.partForm.addSupplier')}
                                </button>
                            </div>
                            {loadingSuppliers ? (
                                <div className="px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface-variant text-center">
                                    {t('finance.partForm.loadingSuppliers')}
                                </div>
                            ) : (
                                <>
                                    <select
                                        value={formData.supplierId}
                                        onChange={(e) => {
                                            setFormData({ ...formData, supplierId: e.target.value, supplier: '' });
                                        }}
                                        className="w-full px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">{t('finance.partForm.noSupplier')}</option>
                                        {suppliers.map((supplier) => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="mt-2 text-body-small text-on-surface-variant">
                                        {t('finance.partForm.supplierFallback')}
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.supplier}
                                        onChange={(e) => {
                                            setFormData({ ...formData, supplier: e.target.value, supplierId: '' });
                                        }}
                                        placeholder={t('finance.partForm.supplierNamePlaceholder')}
                                        className="w-full px-4 py-3 mt-2 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                        disabled={!!formData.supplierId}
                                    />
                                </>
                            )}
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
                                        {t('finance.partForm.creating')}
                                    </span>
                                ) : (
                                    t('finance.partForm.createPart')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showSupplierModal && (
                <div className="fixed inset-0 z-[60]">
                    <SupplierFormModal
                        onClose={() => setShowSupplierModal(false)}
                        onSuccess={handleSupplierCreated}
                    />
                </div>
            )}
        </>
    );
}

