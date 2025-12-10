'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ExpenseFormModalProps {
    isOpen?: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ExpenseFormModal({ isOpen = true, onClose, onSuccess }: ExpenseFormModalProps) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        type: 'MISC',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/v2/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create expense');
            }

            onSuccess();
        } catch (error: any) {
            console.error('Error creating expense:', error);
            setError(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('finance.expenseForm.title')}</DialogTitle>
                    <DialogDescription>
                        {t('finance.expenseForm.description') || 'Record a new business expense'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Error Alert */}
                    {error && (
                        <div className="p-3 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 text-error-600 dark:text-error-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Expense Name */}
                    <div className="space-y-2">
                        <Label htmlFor="expense-name">
                            {t('finance.expenseForm.expenseName')} <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            id="expense-name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('finance.expenseForm.expenseNamePlaceholder')}
                            autoFocus
                        />
                    </div>

                    {/* Amount & Type - 2 column on desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expense-amount">
                                {t('finance.amount')} <span className="text-error-500">*</span>
                            </Label>
                            <Input
                                id="expense-amount"
                                type="number"
                                required
                                step="0.01"
                                min="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder={t('finance.expenseForm.amountPlaceholder')}
                                leadingIcon={<span className="text-muted-foreground">$</span>}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expense-type">
                                {t('finance.type')} <span className="text-error-500">*</span>
                            </Label>
                            <select
                                id="expense-type"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                            >
                                <option value="PURCHASE">{t('finance.expenseTypes.PURCHASE')}</option>
                                <option value="SHOP">{t('finance.expenseTypes.SHOP')}</option>
                                <option value="PART_LOSS">{t('finance.expenseTypes.PART_LOSS')}</option>
                                <option value="MISC">{t('finance.expenseTypes.MISC')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="expense-notes">{t('finance.notes')}</Label>
                        <Textarea
                            id="expense-notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={t('finance.expenseForm.notesPlaceholder')}
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
                                    {t('finance.expenseForm.creating')}
                                </span>
                            ) : (
                                t('finance.expenseForm.createExpense')
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
