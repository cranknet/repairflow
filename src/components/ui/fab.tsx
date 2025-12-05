import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * FAB (Floating Action Button) Component
 * 
 * Clean floating action button for primary actions.
 */

const fabVariants = cva(
  "inline-flex items-center justify-center rounded-2xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg hover:shadow-xl",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border-2 border-primary bg-background text-primary",
      },
      size: {
        sm: "h-10 w-10 gap-0",
        default: "h-14 w-14 gap-0",
        lg: "h-16 w-16 gap-0",
        extended: "h-14 px-6 gap-2",
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
  asChild?: boolean
  icon?: React.ReactNode
  label?: string
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, variant, size, asChild = false, icon, label, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isExtended = size === "extended" || label

    return (
      <Comp
        className={cn(
          fabVariants({ variant, size: isExtended ? "extended" : size }),
          className
        )}
        ref={ref}
        aria-label={label || props["aria-label"]}
        {...props}
      >
        {icon && <span className="inline-flex">{icon}</span>}
        {label && <span className="text-sm font-medium">{label}</span>}
        {!icon && !label && children}
      </Comp>
    )
  }
)
FAB.displayName = "FAB"

export { FAB, fabVariants }
