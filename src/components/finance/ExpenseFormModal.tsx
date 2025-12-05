'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';

interface ExpenseFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function ExpenseFormModal({ onClose, onSuccess }: ExpenseFormModalProps) {
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">{t('finance.expenseForm.title')}</h2>
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
                            {t('finance.expenseForm.expenseName')} <span className="text-error">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('finance.expenseForm.expenseNamePlaceholder')}
                            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('finance.amount')} <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder={t('finance.expenseForm.amountPlaceholder')}
                                className="w-full pl-8 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('finance.type')} <span className="text-error">*</span>
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="PURCHASE">{t('finance.expenseTypes.PURCHASE')}</option>
                            <option value="SHOP">{t('finance.expenseTypes.SHOP')}</option>
                            <option value="PART_LOSS">{t('finance.expenseTypes.PART_LOSS')}</option>
                            <option value="MISC">{t('finance.expenseTypes.MISC')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('finance.notes')}
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={t('finance.expenseForm.notesPlaceholder')}
                            rows={4}
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
                                    {t('finance.expenseForm.creating')}
                                </span>
                            ) : (
                                t('finance.expenseForm.createExpense')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
