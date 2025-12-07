'use client';

import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import {
    BuildingOfficeIcon,
    SwatchIcon,
    TicketIcon,
    ShieldCheckIcon,
    CubeIcon,
    CurrencyDollarIcon,
    PrinterIcon,
    ChatBubbleLeftIcon,
    EnvelopeIcon,
    BellIcon,
    GlobeAltIcon,
    LockClosedIcon,
    PaintBrushIcon,
    KeyIcon,
    CircleStackIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import { ComponentType } from 'react';

export interface SettingsTab {
    id: string;
    label: string;
    icon?: ComponentType<{ className?: string }>;
    adminOnly?: boolean;
}

interface SettingsTabNavProps {
    tabs: SettingsTab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
}

export function SettingsTabNav({ tabs, activeTab, onTabChange, className }: SettingsTabNavProps) {
    const { t } = useLanguage();

    return (
        <>
            {/* Desktop: Sidebar navigation */}
            <aside className={cn('hidden lg:block w-64 flex-shrink-0', className)}>
                <nav className="sticky top-24 space-y-1">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {Icon && (
                                    <Icon className={cn(
                                        'h-5 w-5 flex-shrink-0',
                                        isActive ? 'text-primary-500' : 'text-gray-400'
                                    )} />
                                )}
                                <span className="truncate">{tab.label}</span>
                                {tab.adminOnly && (
                                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                                        Admin
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Tablet: Horizontal scrollable pills */}
            <div className="hidden sm:block lg:hidden mb-6">
                <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" aria-label="Settings tabs">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                                    isActive
                                        ? 'bg-primary-500 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:text-primary-600'
                                )}
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Mobile: Compact dropdown */}
            <div className="sm:hidden mb-6">
                <label htmlFor="settings-tab-select" className="sr-only">
                    {t('settings') || 'Settings'}
                </label>
                <div className="relative">
                    <select
                        id="settings-tab-select"
                        value={activeTab}
                        onChange={(e) => onTabChange(e.target.value)}
                        className="block w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3.5 pl-4 pr-10 text-base font-medium text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                    >
                        {tabs.map((tab) => (
                            <option key={tab.id} value={tab.id}>
                                {tab.label}
                            </option>
                        ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </>
    );
}

// Export icon map for use in settings-client
export const SETTINGS_ICONS = {
    general: BuildingOfficeIcon,
    branding: SwatchIcon,
    tickets: TicketIcon,
    warranty: ShieldCheckIcon,
    inventory: CubeIcon,
    finance: CurrencyDollarIcon,
    print: PrinterIcon,
    sms: ChatBubbleLeftIcon,
    email: EnvelopeIcon,
    notifications: BellIcon,
    tracking: GlobeAltIcon,
    security: LockClosedIcon,
    appearance: PaintBrushIcon,
    permissions: KeyIcon,
    database: CircleStackIcon,
    users: UsersIcon,
};
