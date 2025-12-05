'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

/**
 * Password Input Component with show/hide toggle
 * 
 * A reusable password field with accessibility features including:
 * - Show/hide password toggle with aria-pressed
 * - aria-label for the toggle button
 * - Smooth icon transition animation
 * - Error state styling
 * - Dark mode and glassmorphism support
 */

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    /** Additional wrapper class names */
    wrapperClassName?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, error, wrapperClassName, disabled, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false);
        const { t } = useLanguage();

        const toggleVisibility = () => {
            setShowPassword(!showPassword);
        };

        return (
            <div className={cn('relative group', wrapperClassName)}>
                <input
                    ref={ref}
                    type={showPassword ? 'text' : 'password'}
                    disabled={disabled}
                    aria-invalid={!!error}
                    className={cn(
                        // Base styles
                        'w-full bg-white/5 border border-white/10 text-white rounded-xl',
                        'placeholder:text-gray-500 focus:outline-none',
                        'focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20',
                        'h-12 pl-11 pr-12 transition-all duration-300',
                        'group-hover:bg-white/10',
                        // Error state
                        error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
                        // Disabled state
                        disabled && 'opacity-50 cursor-not-allowed',
                        className
                    )}
                    {...props}
                />

                {/* Lock icon */}
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                    lock
                </span>

                {/* Visibility toggle button */}
                <button
                    type="button"
                    onClick={toggleVisibility}
                    disabled={disabled}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                    tabIndex={-1}
                    className={cn(
                        'absolute right-3 top-1/2 -translate-y-1/2',
                        'text-gray-500 hover:text-blue-400 transition-colors duration-200',
                        'focus:outline-none focus:text-blue-400',
                        disabled && 'pointer-events-none opacity-50'
                    )}
                >
                    <span className="material-symbols-outlined text-xl transition-transform duration-200">
                        {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                </button>

                {/* Error message */}
                {error && (
                    <p className="text-xs text-red-400 mt-1.5 ml-1" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
