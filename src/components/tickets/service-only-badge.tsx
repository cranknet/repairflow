'use client';

import { useLanguage } from '@/contexts/language-context';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

// Service type definitions with icons and colors
export const SERVICE_TYPES = {
    UNLOCK: { icon: '🔓', color: 'purple', price: 25 },
    FLASH: { icon: '📱', color: 'blue', price: 35 },
    CONFIG: { icon: '⚙️', color: 'gray', price: 20 },
    DIAGNOSTICS: { icon: '🔍', color: 'amber', price: 15 },
    DATA_RECOVERY: { icon: '💾', color: 'green', price: 50 },
    OTHER: { icon: '🔧', color: 'slate', price: 0 },
} as const;

export type ServiceType = keyof typeof SERVICE_TYPES;

interface ServiceOnlyBadgeProps {
    serviceType?: string | null;
    size?: 'sm' | 'md' | 'lg';
    showType?: boolean;
    className?: string;
}

/**
 * Badge component that displays "Service Only" indicator with optional service type.
 * Used on ticket cards, ticket details header, and invoices.
 */
export function ServiceOnlyBadge({
    serviceType,
    size = 'md',
    showType = true,
    className = '',
}: ServiceOnlyBadgeProps) {
    const { t } = useLanguage();

    const sizeClasses = {
        sm: 'text-xs px-1.5 py-0.5 gap-1',
        md: 'text-sm px-2 py-1 gap-1.5',
        lg: 'text-base px-3 py-1.5 gap-2',
    };

    const iconSizes = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    // Get service type info if available
    const typeInfo = serviceType && SERVICE_TYPES[serviceType as ServiceType];
    const displayType = showType && typeInfo;

    return (
        <span
            className={`
        inline-flex items-center rounded-full font-medium
        bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300
        border border-purple-200 dark:border-purple-800
        ${sizeClasses[size]}
        ${className}
      `}
        >
            {displayType ? (
                <span className="flex-shrink-0">{typeInfo.icon}</span>
            ) : (
                <WrenchScrewdriverIcon className={`flex-shrink-0 ${iconSizes[size]}`} />
            )}
            <span>
                {displayType
                    ? t(`ticket.serviceOnly.type.${serviceType}`)
                    : t('ticket.serviceOnly.badge')}
            </span>
        </span>
    );
}

interface ServiceTypeSelectorProps {
    selectedType: ServiceType | null;
    onSelect: (type: ServiceType) => void;
    disabled?: boolean;
}

/**
 * Grid of service type options for selecting the type of service-only repair.
 */
export function ServiceTypeSelector({
    selectedType,
    onSelect,
    disabled = false,
}: ServiceTypeSelectorProps) {
    const { t } = useLanguage();

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(SERVICE_TYPES) as ServiceType[]).map((type) => {
                const info = SERVICE_TYPES[type];
                const isSelected = selectedType === type;

                return (
                    <button
                        key={type}
                        type="button"
                        onClick={() => onSelect(type)}
                        disabled={disabled}
                        className={`
              flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all
              ${isSelected
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                            }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
                    >
                        <span className="text-2xl">{info.icon}</span>
                        <span className="text-sm font-medium text-center">
                            {t(`ticket.serviceOnly.type.${type}`)}
                        </span>
                        {info.price > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                ${info.price}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

interface ServicePricingPresetsProps {
    onSelectPrice: (price: number) => void;
    selectedPrice?: number;
    disabled?: boolean;
}

/**
 * Quick preset pricing buttons for common service-only repairs.
 */
export function ServicePricingPresets({
    onSelectPrice,
    selectedPrice,
    disabled = false,
}: ServicePricingPresetsProps) {
    const { t } = useLanguage();

    const presets = [
        { key: 'unlock', price: 25 },
        { key: 'flash', price: 35 },
        { key: 'config', price: 20 },
        { key: 'diagnostics', price: 15 },
        { key: 'dataRecovery', price: 50 },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
                <button
                    key={preset.key}
                    type="button"
                    onClick={() => onSelectPrice(preset.price)}
                    disabled={disabled}
                    className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-colors
            ${selectedPrice === preset.price
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                        }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
                >
                    ${preset.price}
                </button>
            ))}
        </div>
    );
}
