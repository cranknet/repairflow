import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Material Design 3 Badge Component
 * 
 * Implements MD3 badge specifications for displaying small amounts of information
 * or status indicators.
 * 
 * @see https://m3.material.io/components/badges/overview
 */

const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Small badge (dot only, no text)
        small: "h-1.5 w-1.5 rounded-full bg-error",
        
        // Default badge (with number)
        default: "h-4 min-w-[16px] px-1 rounded-full bg-error text-on-error text-[11px] leading-none",
        
        // Large badge (with text)
        large: "h-5 px-1.5 rounded-full bg-error text-on-error text-label-small",
        
        // Primary colored
        primary: "h-5 px-1.5 rounded-full bg-primary text-on-primary text-label-small",
        
        // Secondary colored
        secondary: "h-5 px-1.5 rounded-full bg-secondary-container text-on-secondary-container text-label-small",
        
        // Tertiary colored  
        tertiary: "h-5 px-1.5 rounded-full bg-tertiary-container text-on-tertiary-container text-label-small",
        
        // Success (using tertiary)
        success: "h-5 px-1.5 rounded-full bg-tertiary-container text-on-tertiary-container text-label-small",
        
        // Warning (using error)
        warning: "h-5 px-1.5 rounded-full bg-error-container text-on-error-container text-label-small",
        
        // Info (using primary)
        info: "h-5 px-1.5 rounded-full bg-primary-container text-on-primary-container text-label-small",
        
        // Outline variant
        outline: "h-5 px-1.5 rounded-full border-2 border-outline text-on-surface text-label-small bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

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
              <Badge variant={count > 0 ? "default" : "default"}>
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
 * For displaying status with text and optional dot indicator
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
      error: 'default',
      info: 'info',
      default: 'outline',
    } as const
    
    const dotColors = {
      success: 'bg-tertiary',
      warning: 'bg-error',
      error: 'bg-error',
      info: 'bg-primary',
      default: 'bg-on-surface-variant',
    }
    
    return (
      <Badge
        ref={ref}
        variant={statusVariants[status]}
        className={cn("gap-1.5 pl-1", className)}
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
