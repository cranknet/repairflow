import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Badge Component
 * 
 * Clean badge for displaying small amounts of information or status indicators.
 */

const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background text-foreground",
        success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      },
      size: {
        sm: "h-4 min-w-[16px] px-1 text-[10px] rounded",
        default: "h-5 px-2 text-xs rounded-md",
        lg: "h-6 px-2.5 text-sm rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />
    )
  }
)
Badge.displayName = "Badge"

/**
 * Badge Container
 * Wrapper for positioning badges relative to other elements
 */
export interface BadgeContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  badge?: React.ReactNode
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  showZero?: boolean
  max?: number
  count?: number
}

const BadgeContainer = React.forwardRef<HTMLDivElement, BadgeContainerProps>(
  (
    {
      className,
      badge,
      badgePosition = 'top-right',
      showZero = false,
      max = 99,
      count,
      children,
      ...props
    },
    ref
  ) => {
    const positionClasses = {
      'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
      'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
      'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
      'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
    }

    const shouldShowBadge = count !== undefined ? (showZero || count > 0) : !!badge
    const displayCount = count !== undefined && count > max ? `${max}+` : count

    return (
      <div ref={ref} className={cn("relative inline-flex", className)} {...props}>
        {children}
        {shouldShowBadge && (
          <div className={cn("absolute z-10", positionClasses[badgePosition])}>
            {count !== undefined ? (
              <Badge variant="destructive" size="sm">
                {displayCount}
              </Badge>
            ) : (
              badge
            )}
          </div>
        )}
      </div>
    )
  }
)
BadgeContainer.displayName = "BadgeContainer"

/**
 * Status Badge Component
 */
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'success' | 'warning' | 'error' | 'info' | 'default'
  showDot?: boolean
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, showDot = true, className, children, ...props }, ref) => {
    const statusVariants = {
      success: 'success',
      warning: 'warning',
      error: 'destructive',
      info: 'default',
      default: 'outline',
    } as const

    const dotColors = {
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-destructive',
      info: 'bg-primary',
      default: 'bg-muted-foreground',
    }

    return (
      <Badge
        ref={ref}
        variant={statusVariants[status]}
        className={cn("gap-1.5 pl-1.5", className)}
        {...props}
      >
        {showDot && (
          <span
            className={cn("h-1.5 w-1.5 rounded-full", dotColors[status])}
            aria-hidden="true"
          />
        )}
        {children}
      </Badge>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { Badge, BadgeContainer, StatusBadge, badgeVariants }
