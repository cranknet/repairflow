'use client';

import { useAnimationState, useAnimationClasses, usePrefersReducedMotion } from '@/lib/hooks/use-animation';
import { cn } from '@/lib/utils';
import { ReactNode, CSSProperties } from 'react';

/**
 * AnimatedContainer - Wrapper for enter/exit animations
 * Respects prefers-reduced-motion automatically
 */

type AnimationType =
    | 'fade'
    | 'fadeUp'
    | 'fadeDown'
    | 'fadeLeft'
    | 'fadeRight'
    | 'scale'
    | 'slideBottom'
    | 'slideTop'
    | 'slideLeft'
    | 'slideRight';

interface AnimatedContainerProps {
    /** Whether the content is visible */
    isVisible: boolean;
    /** Animation type */
    animation?: AnimationType;
    /** Animation duration in ms */
    duration?: number;
    /** Additional className */
    className?: string;
    /** Children to animate */
    children: ReactNode;
    /** Custom styles */
    style?: CSSProperties;
    /** Callback when animation completes */
    onAnimationComplete?: () => void;
}

const animationClasses: Record<AnimationType, { enter: string; exit: string }> = {
    fade: {
        enter: 'animate-fade-in',
        exit: 'animate-fade-out',
    },
    fadeUp: {
        enter: 'animate-fade-in-up',
        exit: 'animate-fade-out',
    },
    fadeDown: {
        enter: 'animate-fade-in-down',
        exit: 'animate-fade-out',
    },
    fadeLeft: {
        enter: 'animate-fade-in-left',
        exit: 'animate-fade-out',
    },
    fadeRight: {
        enter: 'animate-fade-in-right',
        exit: 'animate-fade-out',
    },
    scale: {
        enter: 'animate-scale-in',
        exit: 'animate-scale-out',
    },
    slideBottom: {
        enter: 'animate-slide-in-bottom',
        exit: 'animate-fade-out',
    },
    slideTop: {
        enter: 'animate-slide-in-top',
        exit: 'animate-fade-out',
    },
    slideLeft: {
        enter: 'animate-slide-in-left',
        exit: 'animate-fade-out',
    },
    slideRight: {
        enter: 'animate-slide-in-right',
        exit: 'animate-fade-out',
    },
};

export function AnimatedContainer({
    isVisible,
    animation = 'fade',
    duration = 300,
    className,
    children,
    style,
    onAnimationComplete,
}: AnimatedContainerProps) {
    const { shouldRender, animationState } = useAnimationState(isVisible, duration);
    const { enter, exit } = animationClasses[animation];
    const animationClass = useAnimationClasses(animationState, enter, exit);

    if (!shouldRender) return null;

    return (
        <div
            className={cn(animationClass, className)}
            style={style}
            onAnimationEnd={() => {
                if (animationState === 'exiting' && onAnimationComplete) {
                    onAnimationComplete();
                }
            }}
        >
            {children}
        </div>
    );
}

/**
 * FadeIn - Simple fade animation on mount
 */
interface FadeInProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    duration?: 'fast' | 'normal' | 'slow';
}

export function FadeIn({
    children,
    className,
    delay = 0,
    duration = 'normal',
}: FadeInProps) {
    const prefersReducedMotion = usePrefersReducedMotion();

    const durationClass = {
        fast: 'duration-fast',
        normal: 'duration-normal',
        slow: 'duration-slow',
    }[duration];

    return (
        <div
            className={cn(
                !prefersReducedMotion && 'animate-fade-in-up opacity-0',
                !prefersReducedMotion && durationClass,
                className
            )}
            style={!prefersReducedMotion ? { animationDelay: `${delay}ms`, animationFillMode: 'forwards' } : undefined}
        >
            {children}
        </div>
    );
}

/**
 * StaggeredList - Animates list items with stagger effect
 */
interface StaggeredListProps {
    children: ReactNode[];
    className?: string;
    itemClassName?: string;
    baseDelay?: number;
}

export function StaggeredList({
    children,
    className,
    itemClassName,
    baseDelay = 50,
}: StaggeredListProps) {
    const prefersReducedMotion = usePrefersReducedMotion();

    return (
        <div className={cn('list-stagger', className)}>
            {children.map((child, index) => (
                <div
                    key={index}
                    className={cn(
                        !prefersReducedMotion && 'opacity-0 animate-fade-in-up',
                        itemClassName
                    )}
                    style={
                        !prefersReducedMotion
                            ? {
                                animationDelay: `${index * baseDelay}ms`,
                                animationFillMode: 'forwards',
                            }
                            : undefined
                    }
                >
                    {child}
                </div>
            ))}
        </div>
    );
}

/**
 * PulseOnUpdate - Pulses element when value changes
 */
interface PulseOnUpdateProps {
    children: ReactNode;
    value: unknown;
    className?: string;
}

export function PulseOnUpdate({
    children,
    value,
    className,
}: PulseOnUpdateProps) {
    const prefersReducedMotion = usePrefersReducedMotion();

    return (
        <div
            key={prefersReducedMotion ? undefined : String(value)}
            className={cn(!prefersReducedMotion && 'animate-heartbeat', className)}
        >
            {children}
        </div>
    );
}

/**
 * ShakeOnError - Shakes element for error feedback
 */
interface ShakeOnErrorProps {
    children: ReactNode;
    hasError: boolean;
    className?: string;
}

export function ShakeOnError({
    children,
    hasError,
    className,
}: ShakeOnErrorProps) {
    const prefersReducedMotion = usePrefersReducedMotion();

    return (
        <div
            className={cn(
                hasError && !prefersReducedMotion && 'animate-shake',
                className
            )}
        >
            {children}
        </div>
    );
}

/**
 * HoverScale - Scales element on hover
 */
interface HoverScaleProps {
    children: ReactNode;
    className?: string;
    scale?: number;
}

export function HoverScale({
    children,
    className,
    scale = 1.02,
}: HoverScaleProps) {
    const prefersReducedMotion = usePrefersReducedMotion();

    return (
        <div
            className={cn(
                !prefersReducedMotion && 'transition-transform duration-150 ease-out',
                className
            )}
            style={
                !prefersReducedMotion
                    ? ({ '--hover-scale': scale } as CSSProperties)
                    : undefined
            }
            onMouseEnter={(e) => {
                if (!prefersReducedMotion) {
                    (e.currentTarget as HTMLElement).style.transform = `scale(${scale})`;
                }
            }}
            onMouseLeave={(e) => {
                if (!prefersReducedMotion) {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }
            }}
        >
            {children}
        </div>
    );
}

/**
 * Spinner - Loading spinner with reduced-motion fallback
 */
interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
    const prefersReducedMotion = usePrefersReducedMotion();

    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-3',
    };

    if (prefersReducedMotion) {
        // Show static indicator for reduced motion
        return (
            <div
                className={cn(
                    'rounded-full border-current border-t-transparent opacity-70',
                    sizeClasses[size],
                    className
                )}
                role="status"
                aria-label="Loading"
            />
        );
    }

    return (
        <div
            className={cn(
                'animate-spinner rounded-full border-current border-t-transparent',
                sizeClasses[size],
                className
            )}
            role="status"
            aria-label="Loading"
        />
    );
}
