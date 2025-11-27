import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Material Design 3 Button Component
 * 
 * Implements MD3 button specifications with proper elevation, state layers,
 * and accessibility features.
 * 
 * @see https://m3.material.io/components/buttons/overview
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-label-large font-medium transition-all duration-short2 ease-emphasized focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-38 relative overflow-hidden md-state-layer-hover",
  {
    variants: {
      variant: {
        // Filled button - High emphasis
        filled: "bg-primary text-on-primary shadow-md-level1 hover:shadow-md-level2 active:shadow-md-level1",
        
        // Filled Tonal button - Medium emphasis
        tonal: "bg-secondary-container text-on-secondary-container hover:shadow-md-level1",
        
        // Outlined button - Medium emphasis
        outlined: "border-2 border-outline text-primary bg-transparent hover:bg-primary/8",
        
        // Text button - Low emphasis
        text: "text-primary bg-transparent",
        
        // Elevated button - Medium emphasis
        elevated: "bg-surface-container-low text-primary shadow-md-level1 hover:shadow-md-level2",
        
        // Destructive (uses error colors)
        destructive: "bg-error text-on-error shadow-md-level1 hover:shadow-md-level2",
        
        // Ghost (for compatibility)
        ghost: "text-on-surface bg-transparent hover:bg-on-surface/8",
      },
      size: {
        default: "h-10 px-6 py-2.5",
        sm: "h-9 px-4 py-2 text-label-medium",
        lg: "h-12 px-8 py-3.5",
        icon: "h-10 w-10 p-0",
      },
      shape: {
        rounded: "rounded-full",
        default: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
      shape: "rounded",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
  iconPosition?: 'start' | 'end'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, icon, iconPosition = 'start', children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape }), className)}
        ref={ref}
        {...props}
      >
        {icon && iconPosition === 'start' && <span className="inline-flex">{icon}</span>}
        {children}
        {icon && iconPosition === 'end' && <span className="inline-flex">{icon}</span>}
      </Comp>
    )
  }
)
Button.displayName = "Button"

/**
 * Icon Button Component
 * Optimized for icon-only buttons with proper 48x48px touch target
 */
export interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'iconPosition'> {
  children: React.ReactNode
  'aria-label': string // Required for accessibility
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "text", size = "icon", children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("min-w-[48px] min-h-[48px]", className)}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

/**
 * FAB (Floating Action Button) Component
 * High-emphasis button for primary actions
 */
const fabVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-medium2 ease-emphasized focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-38 relative overflow-hidden md-state-layer-hover shadow-md-level3 hover:shadow-md-level4",
  {
    variants: {
      variant: {
        primary: "bg-primary-container text-on-primary-container",
        secondary: "bg-secondary-container text-on-secondary-container",
        tertiary: "bg-tertiary-container text-on-tertiary-container",
        surface: "bg-surface-container-high text-primary",
      },
      size: {
        small: "h-10 w-10 p-2",
        default: "h-14 w-14 p-4",
        large: "h-24 w-24 p-8",
        extended: "h-14 px-4 py-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface FABProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  icon: React.ReactNode
  label?: string
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, variant, size, icon, label, ...props }, ref) => {
    const isExtended = size === 'extended' || label
    
    return (
      <button
        ref={ref}
        className={cn(
          fabVariants({ variant, size: isExtended ? 'extended' : size }),
          className
        )}
        {...props}
      >
        <span className="inline-flex">{icon}</span>
        {label && <span className="text-label-large">{label}</span>}
      </button>
    )
  }
)
FAB.displayName = "FAB"

export { Button, IconButton, FAB, buttonVariants }
