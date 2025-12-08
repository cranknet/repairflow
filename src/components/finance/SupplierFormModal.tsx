'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
}

interface SupplierFormModalProps {
    isOpen?: boolean;
    onClose: () => void;
    onSuccess: (supplier?: { id: string; name: string }) => void;
    supplier?: Supplier;
}

export function SupplierFormModal({ isOpen = true, onClose, onSuccess, supplier }: SupplierFormModalProps) {
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing
                            ? (t('finance.supplierForm.editTitle') || 'Edit Supplier')
                            : t('finance.supplierForm.title')
                        }
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? (t('finance.supplierForm.editDescription') || 'Update supplier information')
                            : (t('finance.supplierForm.description') || 'Add a new supplier to your contacts')
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

                    {/* Supplier Name */}
                    <div className="space-y-2">
                        <Label htmlFor="supplier-name">
                            {t('finance.supplierForm.name')} <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            id="supplier-name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('finance.supplierForm.namePlaceholder')}
                            autoFocus
                        />
                    </div>

                    {/* Contact Person & Phone - 2 column on desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplier-contact">{t('finance.supplierForm.contactPerson')}</Label>
                            <Input
                                id="supplier-contact"
                                type="text"
                                value={formData.contactPerson}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                placeholder={t('finance.supplierForm.contactPersonPlaceholder')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="supplier-phone">{t('finance.supplierForm.phone')}</Label>
                            <Input
                                id="supplier-phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder={t('finance.supplierForm.phonePlaceholder')}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="supplier-email">{t('finance.supplierForm.email')}</Label>
                        <Input
                            id="supplier-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder={t('finance.supplierForm.emailPlaceholder')}
                        />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <Label htmlFor="supplier-address">{t('finance.supplierForm.address')}</Label>
                        <Input
                            id="supplier-address"
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder={t('finance.supplierForm.addressPlaceholder')}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="supplier-notes">{t('finance.notes')}</Label>
                        <Textarea
                            id="supplier-notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={t('finance.supplierForm.notesPlaceholder')}
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
                                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                    {isEditing
                                        ? (t('finance.supplierForm.updating') || 'Updating...')
                                        : t('finance.supplierForm.creating')
                                    }
                                </span>
                            ) : (
                                isEditing
                                    ? (t('finance.supplierForm.updateSupplier') || 'Update Supplier')
                                    : t('finance.supplierForm.createSupplier')
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
