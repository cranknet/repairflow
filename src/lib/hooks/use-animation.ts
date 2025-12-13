'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Animation utilities hook for RepairFlow
 * Provides helpers for managing animations with accessibility support
 */

/**
 * Check if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReducedMotion;
}

/**
 * Get animation duration based on user preference
 * Returns 0 for users who prefer reduced motion
 */
export function useAnimationDuration(defaultDuration: number = 300): number {
    const prefersReducedMotion = usePrefersReducedMotion();
    return prefersReducedMotion ? 0 : defaultDuration;
}

/**
 * Animation state hook for enter/exit animations
 */
export function useAnimationState(isVisible: boolean, duration: number = 300) {
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [animationState, setAnimationState] = useState<'entering' | 'entered' | 'exiting' | 'exited'>(
        isVisible ? 'entered' : 'exited'
    );
    const prefersReducedMotion = usePrefersReducedMotion();
    const effectiveDuration = prefersReducedMotion ? 0 : duration;

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            setAnimationState('entering');

            const timer = setTimeout(() => {
                setAnimationState('entered');
            }, effectiveDuration);

            return () => clearTimeout(timer);
        } else {
            setAnimationState('exiting');

            const timer = setTimeout(() => {
                setAnimationState('exited');
                setShouldRender(false);
            }, effectiveDuration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, effectiveDuration]);

    return {
        shouldRender,
        animationState,
        isAnimating: animationState === 'entering' || animationState === 'exiting',
    };
}

/**
 * Stagger animation hook for list items
 */
export function useStaggerAnimation(
    itemCount: number,
    baseDelay: number = 50,
    maxDelay: number = 400
) {
    const prefersReducedMotion = usePrefersReducedMotion();

    const getDelay = useCallback(
        (index: number): number => {
            if (prefersReducedMotion) return 0;
            return Math.min(index * baseDelay, maxDelay);
        },
        [prefersReducedMotion, baseDelay, maxDelay]
    );

    const getStyle = useCallback(
        (index: number): React.CSSProperties => {
            if (prefersReducedMotion) {
                return {};
            }
            return {
                animationDelay: `${getDelay(index)}ms`,
            };
        },
        [getDelay, prefersReducedMotion]
    );

    return { getDelay, getStyle };
}

/**
 * Animation classes based on state and user preference
 */
export function useAnimationClasses(
    animationState: 'entering' | 'entered' | 'exiting' | 'exited',
    enterClass: string = 'animate-fade-in',
    exitClass: string = 'animate-fade-out'
): string {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
        return animationState === 'exited' ? 'opacity-0' : 'opacity-100';
    }

    switch (animationState) {
        case 'entering':
            return enterClass;
        case 'entered':
            return 'opacity-100';
        case 'exiting':
            return exitClass;
        case 'exited':
            return 'opacity-0';
        default:
            return '';
    }
}

/**
 * Intersection Observer hook for scroll-triggered animations
 */
export function useScrollAnimation(
    options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
) {
    const [isVisible, setIsVisible] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef<HTMLElement>(null);
    const prefersReducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (prefersReducedMotion) {
            setIsVisible(true);
            setHasAnimated(true);
            return;
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !hasAnimated) {
                setIsVisible(true);
                setHasAnimated(true);
            }
        }, options);

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasAnimated, options, prefersReducedMotion]);

    return { ref, isVisible, hasAnimated };
}

/**
 * Animation timing presets
 */
export const ANIMATION_TIMING = {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
} as const;

/**
 * Animation easing presets (CSS cubic-bezier values)
 */
export const ANIMATION_EASING = {
    linear: 'linear',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Get animation class based on type
 */
export function getAnimationClass(
    type: 'fadeIn' | 'fadeOut' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'scaleOut' | 'slideInBottom' | 'slideInTop' | 'slideInLeft' | 'slideInRight' | 'shake' | 'wiggle' | 'heartbeat' | 'bounce'
): string {
    const classMap: Record<typeof type, string> = {
        fadeIn: 'animate-fade-in',
        fadeOut: 'animate-fade-out',
        fadeInUp: 'animate-fade-in-up',
        fadeInDown: 'animate-fade-in-down',
        fadeInLeft: 'animate-fade-in-left',
        fadeInRight: 'animate-fade-in-right',
        scaleIn: 'animate-scale-in',
        scaleOut: 'animate-scale-out',
        slideInBottom: 'animate-slide-in-bottom',
        slideInTop: 'animate-slide-in-top',
        slideInLeft: 'animate-slide-in-left',
        slideInRight: 'animate-slide-in-right',
        shake: 'animate-shake',
        wiggle: 'animate-wiggle',
        heartbeat: 'animate-heartbeat',
        bounce: 'animate-bounce-subtle',
    };
    return classMap[type];
}
