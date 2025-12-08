'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { format } from 'date-fns';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { STATUS_CONFIG } from './track-hero';

interface StatusHistoryItem {
    id: string;
    status: string;
    notes?: string | null;
    createdAt: string;
}

interface TrackTimelineProps {
    history: StatusHistoryItem[];
    currentStatus: string;
}

export function TrackTimeline({ history, currentStatus }: TrackTimelineProps) {
    const { t } = useLanguage();
    const [showAll, setShowAll] = useState(false);

    if (!history || history.length === 0) return null;

    // Show last 3 by default, all if expanded
    const visibleHistory = showAll ? history : history.slice(0, 3);
    const hasMore = history.length > 3;

    return (
        <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700/50">
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('statusHistory')}</h3>
            </div>

            <div className="p-4">
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-gray-200 dark:to-slate-600 rounded-full" />

                    {/* Timeline items */}
                    <div className="space-y-4">
                        {visibleHistory.map((item, index) => {
                            const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.RECEIVED;
                            const StatusIcon = config.icon;
                            const isCurrent = item.status === currentStatus && index === 0;

                            return (
                                <div key={item.id} className="relative flex gap-4 items-start">
                                    {/* Icon */}
                                    <div
                                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrent ? 'ring-4 ring-blue-500/40 ring-offset-2 dark:ring-offset-slate-800' : ''
                                            }`}
                                        style={{
                                            backgroundColor: isCurrent ? config.color : `${config.color}20`,
                                        }}
                                    >
                                        <div style={{ color: isCurrent ? 'white' : config.color }}>
                                            <StatusIcon className="w-4 h-4" />
                                        </div>
                                        {isCurrent && (
                                            <span
                                                className="absolute inset-0 rounded-full animate-ping opacity-40"
                                                style={{ backgroundColor: config.color }}
                                            />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pb-2">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p
                                                className="font-medium text-sm"
                                                style={{ color: config.color }}
                                            >
                                                {t(config.labelKey)}
                                            </p>
                                            {isCurrent && (
                                                <span
                                                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                                    style={{
                                                        backgroundColor: `${config.color}20`,
                                                        color: config.color,
                                                    }}
                                                >
                                                    {t('current')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {format(new Date(item.createdAt), 'PP · p')}
                                        </p>
                                        {item.notes && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2">
                                                {item.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Show more button */}
                {hasMore && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="w-full mt-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                    >
                        {showAll ? t('showLess') : t('showAll')} ({history.length})
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>
        </div>
    );
}
