'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

interface QuickActionsBarProps {
    onNewTicket?: () => void;
    onNewCustomer?: () => void;
    onNewPart?: () => void;
}

export function QuickActionsBar({
    onNewTicket,
    onNewCustomer,
    onNewPart,
}: QuickActionsBarProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const [showNotes, setShowNotes] = useState(false);
    const [noteText, setNoteText] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('dashboard-quick-note') || '';
        }
        return '';
    });

    const handleSaveNote = () => {
        localStorage.setItem('dashboard-quick-note', noteText);
        setShowNotes(false);
    };

    const actions = [
        {
            id: 'new-ticket',
            label: t('dashboard.quickActions.newTicket'),
            icon: 'add_circle',
            accentColor: 'text-brand-500',
            bgColor: 'bg-brand-50/80 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20',
            onClick: onNewTicket || (() => router.push('/tickets/new')),
        },
        {
            id: 'new-customer',
            label: t('dashboard.quickActions.addCustomer'),
            icon: 'person_add',
            accentColor: 'text-success-500',
            bgColor: 'bg-success-50/80 dark:bg-success-500/10 hover:bg-success-100 dark:hover:bg-success-500/20',
            onClick: onNewCustomer || (() => router.push('/customers/new')),
        },
        {
            id: 'new-part',
            label: t('dashboard.quickActions.addPart'),
            icon: 'inventory_2',
            accentColor: 'text-warning-500',
            bgColor: 'bg-warning-50/80 dark:bg-warning-500/10 hover:bg-warning-100 dark:hover:bg-warning-500/20',
            onClick: onNewPart || (() => router.push('/inventory/stock')),
        },
        {
            id: 'quick-notes',
            label: t('dashboard.quickActions.quickNote'),
            icon: 'sticky_note_2',
            accentColor: 'text-purple-500',
            bgColor: 'bg-purple-50/80 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20',
            onClick: () => setShowNotes(true),
            hasNote: noteText.length > 0,
        },
    ];

    return (
        <div className="mb-6">
            {/* Frosted glass container */}
            <div className={cn(
                'p-3 rounded-2xl',
                'bg-white/70 dark:bg-gray-900/70',
                'backdrop-blur-md',
                'border border-gray-200/50 dark:border-gray-700/50',
                'shadow-theme-sm'
            )}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {actions.map((action) => (
                        <button
                            key={action.id}
                            onClick={action.onClick}
                            className={cn(
                                'relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                'border border-transparent hover:border-gray-200 dark:hover:border-gray-700',
                                'shadow-theme-xs hover:shadow-theme-sm active:scale-[0.98]',
                                action.bgColor
                            )}
                        >
                            <span className={cn('material-symbols-outlined text-2xl', action.accentColor)}>
                                {action.icon}
                            </span>
                            <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                {action.label}
                            </span>
                            {/* Note indicator dot */}
                            {'hasNote' in action && action.hasNote && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Notes Modal */}
            {showNotes && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowNotes(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl text-purple-500">
                                        sticky_note_2
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('dashboard.quickActions.quickNote')}
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowNotes(false)}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder={t('dashboard.quickActions.notePlaceholder')}
                            className={cn(
                                'w-full h-40 p-4 rounded-xl resize-none',
                                'bg-gray-50 dark:bg-gray-800',
                                'border border-gray-200 dark:border-gray-700',
                                'text-gray-900 dark:text-white placeholder-gray-400',
                                'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
                                'transition-all'
                            )}
                        />

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setNoteText('');
                                    localStorage.removeItem('dashboard-quick-note');
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                {t('clear')}
                            </button>
                            <button
                                onClick={handleSaveNote}
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                            >
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
