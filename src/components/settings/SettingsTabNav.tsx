'use client';

import { useState } from 'react';
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
    UsersIcon,
    CameraIcon,
    WrenchScrewdriverIcon,
    MegaphoneIcon,
    ServerStackIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { ComponentType } from 'react';

export interface SettingsTab {
    id: string;
    label: string;
    icon?: ComponentType<{ className?: string }>;
    adminOnly?: boolean;
}

export interface SettingsCategory {
    id: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    description: string;
    tabs: SettingsTab[];
}

interface SettingsTabNavProps {
    tabs: SettingsTab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
}

// Icon maps
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
    users: UsersIcon,
    ai_vision: CameraIcon,
    factory_reset: ArrowPathIcon,
};

// Define categories with their tabs (labels are translation keys)
export const SETTINGS_CATEGORIES: SettingsCategory[] = [
    {
        id: 'business',
        label: 'settings.category.business',
        icon: BuildingOfficeIcon,
        description: 'settings.category.business.description',
        tabs: [
            { id: 'general', label: 'settings.tab.general', icon: BuildingOfficeIcon },
            { id: 'finance', label: 'settings.tab.finance', icon: CurrencyDollarIcon },
            { id: 'inventory', label: 'settings.tab.inventory', icon: CubeIcon },
        ],
    },
    {
        id: 'operations',
        label: 'settings.category.operations',
        icon: WrenchScrewdriverIcon,
        description: 'settings.category.operations.description',
        tabs: [
            { id: 'tickets', label: 'settings.tab.tickets', icon: TicketIcon },
            { id: 'warranty', label: 'settings.tab.warranty', icon: ShieldCheckIcon },
            { id: 'print', label: 'settings.tab.print', icon: PrinterIcon },
            { id: 'tracking', label: 'settings.tab.tracking', icon: GlobeAltIcon },
        ],
    },
    {
        id: 'appearance',
        label: 'settings.category.appearance',
        icon: PaintBrushIcon,
        description: 'settings.category.appearance.description',
        tabs: [
            { id: 'branding', label: 'settings.tab.branding', icon: SwatchIcon },
            { id: 'appearance', label: 'settings.tab.themes', icon: PaintBrushIcon },
        ],
    },
    {
        id: 'communications',
        label: 'settings.category.communications',
        icon: MegaphoneIcon,
        description: 'settings.category.communications.description',
        tabs: [
            { id: 'sms', label: 'settings.tab.sms', icon: ChatBubbleLeftIcon },
            { id: 'email', label: 'settings.tab.email', icon: EnvelopeIcon },
            { id: 'notifications', label: 'settings.tab.notifications', icon: BellIcon },
        ],
    },
    {
        id: 'system',
        label: 'settings.category.system',
        icon: ServerStackIcon,
        description: 'settings.category.system.description',
        tabs: [
            { id: 'security', label: 'settings.tab.security', icon: LockClosedIcon },
            { id: 'permissions', label: 'settings.tab.permissions', icon: KeyIcon, adminOnly: true },
            { id: 'users', label: 'settings.tab.users', icon: UsersIcon, adminOnly: true },
            { id: 'ai_vision', label: 'settings.tab.aiVision', icon: CameraIcon },
            { id: 'factory_reset', label: 'settings.tab.factoryReset', icon: ArrowPathIcon, adminOnly: true },
        ],
    },
];

export function SettingsTabNav({ tabs, activeTab, onTabChange, className }: SettingsTabNavProps) {
    const { t } = useLanguage();
    const [activeCategory, setActiveCategory] = useState(() => {
        // Find which category contains the active tab
        for (const cat of SETTINGS_CATEGORIES) {
            if (cat.tabs.some(tab => tab.id === activeTab)) {
                return cat.id;
            }
        }
        return 'business';
    });

    // Get current category
    const currentCategory = SETTINGS_CATEGORIES.find(c => c.id === activeCategory) || SETTINGS_CATEGORIES[0];

    // Filter tabs that exist in the provided tabs array
    const availableTabs = currentCategory.tabs.filter(catTab =>
        tabs.some(t => t.id === catTab.id)
    );

    return (
        <>
            {/* Desktop: Two-level navigation */}
            <aside className={cn('hidden lg:block w-72 flex-shrink-0', className)}>
                <div className="sticky top-24 space-y-6">
                    {/* Category Cards */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 mb-3">
                            {t('settings.categories') || 'Categories'}
                        </p>
                        {SETTINGS_CATEGORIES.map((category) => {
                            const Icon = category.icon;
                            const isActive = activeCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => {
                                        setActiveCategory(category.id);
                                        // Auto-select first available tab in category
                                        const firstTab = category.tabs.find(catTab =>
                                            tabs.some(t => t.id === catTab.id)
                                        );
                                        if (firstTab) onTabChange(firstTab.id);
                                    }}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                                        isActive
                                            ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    )}
                                >
                                    <div className={cn(
                                        'p-2 rounded-lg',
                                        isActive ? 'bg-primary/20' : 'bg-gray-100 dark:bg-gray-800'
                                    )}>
                                        <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-gray-500')} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn('text-sm font-semibold', isActive && 'text-primary')}>
                                            {t(category.label)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {t(category.description)}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Sub-tabs for active category */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 mb-3">
                            {t(currentCategory.label)}
                        </p>
                        <nav className="space-y-1">
                            {availableTabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;
                                const fullTab = tabs.find(t => t.id === tab.id);
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => onTabChange(tab.id)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        )}
                                    >
                                        {Icon && <Icon className="h-4 w-4" />}
                                        <span className="truncate">{t(tab.label)}</span>
                                        {fullTab?.adminOnly && (
                                            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                                                Admin
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </aside>

            {/* Tablet: Horizontal categories + pills */}
            <div className="hidden sm:block lg:hidden mb-6 space-y-4">
                {/* Category pills */}
                <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {SETTINGS_CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        const isActive = activeCategory === category.id;
                        return (
                            <button
                                key={category.id}
                                onClick={() => {
                                    setActiveCategory(category.id);
                                    const firstTab = category.tabs.find(catTab =>
                                        tabs.some(t => t.id === catTab.id)
                                    );
                                    if (firstTab) onTabChange(firstTab.id);
                                }}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                                    isActive
                                        ? 'bg-primary text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {t(category.label)}
                            </button>
                        );
                    })}
                </nav>

                {/* Sub-tab pills */}
                <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {availableTabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                                    isActive
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                )}
                            >
                                {t(tab.label)}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Mobile: Dropdowns */}
            <div className="sm:hidden mb-6 space-y-3">
                {/* Category dropdown */}
                <div className="relative">
                    <select
                        value={activeCategory}
                        onChange={(e) => {
                            const newCategory = e.target.value;
                            setActiveCategory(newCategory);
                            const cat = SETTINGS_CATEGORIES.find(c => c.id === newCategory);
                            if (cat) {
                                const firstTab = cat.tabs.find(catTab =>
                                    tabs.some(t => t.id === catTab.id)
                                );
                                if (firstTab) onTabChange(firstTab.id);
                            }
                        }}
                        className="block w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3.5 pl-4 pr-10 text-base font-semibold text-gray-900 dark:text-white shadow-sm"
                    >
                        {SETTINGS_CATEGORIES.map((category) => (
                            <option key={category.id} value={category.id}>
                                {t(category.label)}
                            </option>
                        ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {/* Sub-tab dropdown */}
                <div className="relative">
                    <select
                        value={activeTab}
                        onChange={(e) => onTabChange(e.target.value)}
                        className="block w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-4 pr-10 text-sm text-gray-900 dark:text-white shadow-sm"
                    >
                        {availableTabs.map((tab) => (
                            <option key={tab.id} value={tab.id}>
                                {t(tab.label)}
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
