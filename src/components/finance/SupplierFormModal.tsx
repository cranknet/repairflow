'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';

interface Supplier {
    id: string;
    name: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
}

interface SupplierFormModalProps {
    onClose: () => void;
    onSuccess: (supplier?: { id: string; name: string }) => void;
    supplier?: Supplier;
}

export function SupplierFormModal({ onClose, onSuccess, supplier }: SupplierFormModalProps) {
    const { t } = useLanguage();
    const isEditing = !!supplier;
    const [formData, setFormData] = useState({
        name: supplier?.name || '',
        contactPerson: supplier?.contactPerson || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        address: supplier?.address || '',
        notes: supplier?.notes || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const url = isEditing ? `/api/suppliers/${supplier.id}` : '/api/suppliers';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    contactPerson: formData.contactPerson.trim() || undefined,
                    email: formData.email.trim() || undefined,
                    phone: formData.phone.trim() || undefined,
                    address: formData.address.trim() || undefined,
                    notes: formData.notes.trim() || undefined,
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
                throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} supplier`);
            }

            const updatedSupplier = await response.json();
            onSuccess(updatedSupplier);
        } catch (error: any) {
            console.error(`Error ${isEditing ? 'updating' : 'creating'} supplier:`, error);
            setError(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">{isEditing ? t('finance.supplierForm.editTitle') || 'Edit Supplier' : t('finance.supplierForm.title')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-on-surface/8 transition-colors"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-muted-foreground">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-error-container text-on-error-container rounded-lg text-body-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('finance.supplierForm.name')} <span className="text-error">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('finance.supplierForm.namePlaceholder')}
                            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('finance.supplierForm.contactPerson')}
                        </label>
                        <input
                            type="text"
                            value={formData.contactPerson}
                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                            placeholder={t('finance.supplierForm.contactPersonPlaceholder')}
                            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('finance.supplierForm.email')}
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder={t('finance.supplierForm.emailPlaceholder')}
                            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('finance.supplierForm.phone')}
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder={t('finance.supplierForm.phonePlaceholder')}
                            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('finance.supplierForm.address')}
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder={t('finance.supplierForm.addressPlaceholder')}
                            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('finance.notes')}
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={t('finance.supplierForm.notesPlaceholder')}
                            rows={3}
                            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-input text-foreground rounded-full hover:bg-muted/50 transition-colors"
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
                                    {isEditing ? t('finance.supplierForm.updating') || 'Updating...' : t('finance.supplierForm.creating')}
                                </span>
                            ) : (
                                isEditing ? t('finance.supplierForm.updateSupplier') || 'Update Supplier' : t('finance.supplierForm.createSupplier')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

