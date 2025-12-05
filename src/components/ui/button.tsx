import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Button Component
 * 
 * Clean button with multiple variants using standard Tailwind patterns.
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
  ({ className, variant, size, asChild = false, icon, iconPosition = 'start', children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
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
 * Optimized for icon-only buttons with proper touch target
 */
export interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'iconPosition'> {
  children: React.ReactNode
  'aria-label': string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "icon", children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("min-w-[44px] min-h-[44px]", className)}
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
 */
const fabVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg hover:shadow-xl",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border-2 border-primary bg-background text-primary",
      },
      size: {
        sm: "h-10 w-10 p-2",
        default: "h-14 w-14 p-4",
        lg: "h-16 w-16 p-5",
        extended: "h-14 px-6 py-4",
      },
    },
    defaultVariants: {
      variant: "default",
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
        {label && <span className="text-sm font-medium">{label}</span>}
      </button>
    )
  }
)
FAB.displayName = "FAB"

export { Button, IconButton, FAB, buttonVariants }
