import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * ResponsiveGrid Component
 * 
 * A responsive grid component using modern CSS Grid with:
 * - Auto-fit/auto-fill patterns
 * - Container queries support
 * - Fluid gap spacing
 * - Mobile-first approach
 */

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Grid variant pattern */
    variant?: 'auto-fit' | 'auto-fill' | 'fixed'
    /** Minimum item width for auto-fit/auto-fill */
    minItemWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    /** Number of columns for fixed grid */
    columns?: 1 | 2 | 3 | 4 | 5 | 6
    /** Gap size */
    gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    /** Enable container queries context */
    containerQuery?: boolean
}

const minWidthMap = {
    xs: '180px',
    sm: '240px',
    md: '300px',
    lg: '400px',
    xl: '480px',
} as const

const gapMap = {
    none: '0',
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
} as const

const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
    (
        {
            className,
            variant = 'auto-fit',
            minItemWidth = 'md',
            columns = 3,
            gap = 'md',
            containerQuery = false,
            style,
            children,
            ...props
        },
        ref
    ) => {
        const getGridStyles = (): React.CSSProperties => {
            const baseStyles: React.CSSProperties = {
                display: 'grid',
                gap: gapMap[gap],
            }

            if (variant === 'fixed') {
                return baseStyles
            }

            const minWidth = minWidthMap[minItemWidth]
            const repeatFn = variant === 'auto-fit' ? 'auto-fit' : 'auto-fill'

            return {
                ...baseStyles,
                gridTemplateColumns: `repeat(${repeatFn}, minmax(${minWidth}, 1fr))`,
            }
        }

        const fixedColumnsClasses = {
            1: 'grid-cols-1',
            2: 'grid-cols-1 sm:grid-cols-2',
            3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
            5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
            6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
        }

        return (
            <div
                ref={ref}
                className={cn(
                    containerQuery && 'container-query',
                    variant === 'fixed' && fixedColumnsClasses[columns],
                    className
                )}
                style={{
                    ...getGridStyles(),
                    ...style,
                }}
                {...props}
            >
                {children}
            </div>
        )
    }
)
ResponsiveGrid.displayName = "ResponsiveGrid"

/**
 * FlexStack Component
 * 
 * A responsive flex container that stacks on mobile and rows on larger screens
 */
export interface FlexStackProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Alignment in row mode */
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
    /** Justification in row mode */
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
    /** Gap size */
    gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    /** Breakpoint to switch to row */
    breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    /** Always reverse on mobile */
    mobileReverse?: boolean
}

const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
}

const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
}

const breakpointMap = {
    xs: 'xs:flex-row',
    sm: 'sm:flex-row',
    md: 'md:flex-row',
    lg: 'lg:flex-row',
    xl: 'xl:flex-row',
}

const FlexStack = React.forwardRef<HTMLDivElement, FlexStackProps>(
    (
        {
            className,
            align = 'center',
            justify = 'start',
            gap = 'md',
            breakpoint = 'sm',
            mobileReverse = false,
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'flex',
                    mobileReverse ? 'flex-col-reverse' : 'flex-col',
                    breakpointMap[breakpoint],
                    alignMap[align],
                    justifyMap[justify],
                    className
                )}
                style={{ gap: gapMap[gap] }}
                {...props}
            >
                {children}
            </div>
        )
    }
)
FlexStack.displayName = "FlexStack"

/**
 * AspectBox Component
 * 
 * Maintains aspect ratio for media content
 */
export interface AspectBoxProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Preset aspect ratios */
    ratio?: '16/9' | '4/3' | '1/1' | '3/4' | '21/9' | string
}

const AspectBox = React.forwardRef<HTMLDivElement, AspectBoxProps>(
    ({ className, ratio = '16/9', style, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('relative overflow-hidden', className)}
                style={{
                    aspectRatio: ratio,
                    ...style,
                }}
                {...props}
            >
                {children}
            </div>
        )
    }
)
AspectBox.displayName = "AspectBox"

/**
 * Container Component
 * 
 * Responsive container with fluid padding and max-width constraints
 */
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Maximum width */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
    /** Padding size */
    padding?: 'none' | 'sm' | 'md' | 'lg'
    /** Center the container */
    centered?: boolean
}

const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
}

const paddingClasses = {
    none: '',
    sm: 'px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
    (
        {
            className,
            maxWidth = 'xl',
            padding = 'md',
            centered = true,
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'w-full',
                    maxWidthClasses[maxWidth],
                    paddingClasses[padding],
                    centered && 'mx-auto',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)
Container.displayName = "Container"

export { ResponsiveGrid, FlexStack, AspectBox, Container }
