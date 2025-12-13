import { cn } from '@/lib/utils';

/**
 * Skeleton loading component
 * Uses shimmer animation for perceived performance improvement
 */

interface SkeletonProps {
    className?: string;
    /** Width of the skeleton (can use Tailwind classes or custom) */
    width?: string;
    /** Height of the skeleton (can use Tailwind classes or custom) */
    height?: string;
    /** Whether to use circular shape */
    circle?: boolean;
    /** Number of skeleton items to render */
    count?: number;
    /** Animation type */
    animation?: 'shimmer' | 'pulse' | 'none';
}

export function Skeleton({
    className,
    width,
    height,
    circle = false,
    count = 1,
    animation = 'shimmer',
}: SkeletonProps) {
    const animationClass = {
        shimmer: 'skeleton',
        pulse: 'animate-pulse bg-muted',
        none: 'bg-muted',
    }[animation];

    const items = Array.from({ length: count }, (_, i) => (
        <div
            key={i}
            className={cn(
                'rounded-md',
                animationClass,
                circle && 'rounded-full',
                className
            )}
            style={{
                width: width || undefined,
                height: height || undefined,
            }}
            aria-hidden="true"
        />
    ));

    return count === 1 ? items[0] : <>{items}</>;
}

/**
 * Skeleton text lines
 */
interface SkeletonTextProps {
    lines?: number;
    className?: string;
    lastLineWidth?: string;
}

export function SkeletonText({
    lines = 3,
    className,
    lastLineWidth = '60%',
}: SkeletonTextProps) {
    return (
        <div className={cn('space-y-2', className)} aria-hidden="true">
            {Array.from({ length: lines }, (_, i) => (
                <Skeleton
                    key={i}
                    className="h-4"
                    width={i === lines - 1 ? lastLineWidth : '100%'}
                />
            ))}
        </div>
    );
}

/**
 * Skeleton card - common loading pattern
 */
interface SkeletonCardProps {
    className?: string;
    hasImage?: boolean;
    hasTitle?: boolean;
    hasDescription?: boolean;
    hasActions?: boolean;
}

export function SkeletonCard({
    className,
    hasImage = true,
    hasTitle = true,
    hasDescription = true,
    hasActions = false,
}: SkeletonCardProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-border bg-card p-4 space-y-4',
                className
            )}
            aria-hidden="true"
        >
            {hasImage && <Skeleton className="h-40 w-full rounded-lg" />}
            {hasTitle && <Skeleton className="h-6 w-3/4" />}
            {hasDescription && <SkeletonText lines={2} />}
            {hasActions && (
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 w-20 rounded-lg" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                </div>
            )}
        </div>
    );
}

/**
 * Skeleton avatar with optional text
 */
interface SkeletonAvatarProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    withText?: boolean;
}

export function SkeletonAvatar({
    size = 'md',
    className,
    withText = false,
}: SkeletonAvatarProps) {
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
    };

    return (
        <div className={cn('flex items-center gap-3', className)} aria-hidden="true">
            <Skeleton circle className={sizeClasses[size]} />
            {withText && (
                <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            )}
        </div>
    );
}

/**
 * Skeleton table rows
 */
interface SkeletonTableProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export function SkeletonTable({
    rows = 5,
    columns = 4,
    className,
}: SkeletonTableProps) {
    return (
        <div className={cn('space-y-3', className)} aria-hidden="true">
            {/* Header */}
            <div className="flex gap-4 pb-2 border-b border-border">
                {Array.from({ length: columns }, (_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }, (_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 py-2">
                    {Array.from({ length: columns }, (_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            className="h-4 flex-1"
                            animation="shimmer"
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton list items
 */
interface SkeletonListProps {
    items?: number;
    className?: string;
    withAvatar?: boolean;
    withActions?: boolean;
}

export function SkeletonList({
    items = 5,
    className,
    withAvatar = true,
    withActions = false,
}: SkeletonListProps) {
    return (
        <div className={cn('space-y-4', className)} aria-hidden="true">
            {Array.from({ length: items }, (_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border"
                >
                    {withAvatar && <Skeleton circle className="h-10 w-10" />}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    {withActions && <Skeleton className="h-8 w-16 rounded-md" />}
                </div>
            ))}
        </div>
    );
}
