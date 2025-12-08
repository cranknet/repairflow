'use client';

import { useLanguage } from '@/contexts/language-context';
import {
    InboxIcon,
    CogIcon,
    ArchiveBoxIcon,
    CheckCircleIcon,
    TruckIcon,
    XCircleIcon,
    CheckBadgeIcon,
} from '@heroicons/react/24/outline';

interface TrackHeroProps {
    status: string;
    progress: number;
    ticketNumber: string;
    estimatedCompletion?: string | null;
    priority: string;
}

const STATUS_CONFIG: Record<string, {
    color: string;
    gradient: string;
    icon: React.ComponentType<{ className?: string }>;
    labelKey: string;
    descKey: string;
}> = {
    RECEIVED: {
        color: '#3B82F6',
        gradient: 'from-blue-500 to-cyan-400',
        icon: InboxIcon,
        labelKey: 'statusReceived',
        descKey: 'statusReceivedDesc',
    },
    IN_PROGRESS: {
        color: '#F59E0B',
        gradient: 'from-amber-500 to-orange-400',
        icon: CogIcon,
        labelKey: 'statusInProgress',
        descKey: 'statusInProgressDesc',
    },
    WAITING_FOR_PARTS: {
        color: '#F97316',
        gradient: 'from-orange-500 to-red-400',
        icon: ArchiveBoxIcon,
        labelKey: 'statusWaitingForParts',
        descKey: 'statusWaitingForPartsDesc',
    },
    REPAIRED: {
        color: '#10B981',
        gradient: 'from-emerald-500 to-teal-400',
        icon: CheckCircleIcon,
        labelKey: 'statusRepaired',
        descKey: 'statusRepairedDesc',
    },
    COMPLETED: {
        color: '#059669',
        gradient: 'from-green-500 to-emerald-400',
        icon: CheckBadgeIcon,
        labelKey: 'statusCompleted',
        descKey: 'statusCompletedDesc',
    },
    RETURNED: {
        color: '#8B5CF6',
        gradient: 'from-purple-500 to-violet-400',
        icon: TruckIcon,
        labelKey: 'statusReturned',
        descKey: 'statusReturnedDesc',
    },
    CANCELLED: {
        color: '#EF4444',
        gradient: 'from-red-500 to-rose-400',
        icon: XCircleIcon,
        labelKey: 'statusCancelled',
        descKey: 'statusCancelledDesc',
    },
};

export function TrackHero({ status, progress, ticketNumber, estimatedCompletion, priority }: TrackHeroProps) {
    const { t } = useLanguage();
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.RECEIVED;
    const StatusIcon = config.icon;

    // Calculate stroke for circular progress
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8">
            {/* Animated background gradient */}
            <div
                className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-20 blur-3xl animate-pulse`}
                style={{ animationDuration: '3s' }}
            />

            {/* Glass overlay */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                {/* Circular Progress Ring */}
                <div className="relative flex-shrink-0">
                    <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90" viewBox="0 0 120 120">
                        {/* Background circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke={`url(#gradient-${status})`}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-out"
                        />
                        {/* Gradient definition */}
                        <defs>
                            <linearGradient id={`gradient-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={config.color} />
                                <stop offset="100%" stopColor={config.color} stopOpacity="0.6" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Center icon + percentage */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div
                            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-1"
                            style={{ backgroundColor: `${config.color}30` }}
                        >
                            <StatusIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                        </div>
                        <span className="text-white/90 text-sm font-semibold">{progress}%</span>
                    </div>
                </div>

                {/* Status info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <h1
                            className="text-2xl md:text-3xl font-bold text-white"
                            style={{ textShadow: `0 0 40px ${config.color}50` }}
                        >
                            {t(config.labelKey)}
                        </h1>
                        {status !== 'CANCELLED' && status !== 'COMPLETED' && (
                            <span className="relative flex h-3 w-3">
                                <span
                                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                    style={{ backgroundColor: config.color }}
                                />
                                <span
                                    className="relative inline-flex rounded-full h-3 w-3"
                                    style={{ backgroundColor: config.color }}
                                />
                            </span>
                        )}
                    </div>

                    <p className="text-white/60 text-sm md:text-base mb-4">
                        {t(config.descKey)}
                    </p>

                    {/* Quick info pills */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-white/80 text-xs font-medium">
                            #{ticketNumber}
                        </span>
                        <span
                            className="px-3 py-1.5 rounded-full backdrop-blur text-xs font-medium"
                            style={{
                                backgroundColor: priority === 'URGENT' || priority === 'HIGH' ? '#EF444420' : '#3B82F620',
                                color: priority === 'URGENT' || priority === 'HIGH' ? '#FCA5A5' : '#93C5FD'
                            }}
                        >
                            {priority === 'URGENT' || priority === 'HIGH' ? t('express') : t('standard')}
                        </span>
                        {estimatedCompletion && (
                            <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur text-emerald-300 text-xs font-medium">
                                {t('eta')}: {new Date(estimatedCompletion).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export { STATUS_CONFIG };
