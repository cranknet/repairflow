import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const fabVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-short2 ease-standard disabled:pointer-events-none disabled:opacity-38 md-focus-ring shadow-md-level3 hover:shadow-md-level4 active:shadow-md-level3",
  {
    variants: {
      variant: {
        // Primary FAB - highest emphasis
        primary: "bg-primary-container text-on-primary-container",
        // Surface FAB - secondary emphasis
        surface: "bg-surface-container-high text-primary",
        // Secondary FAB - lower emphasis
        secondary: "bg-secondary-container text-on-secondary-container",
        // Tertiary FAB - lowest emphasis
        tertiary: "bg-tertiary-container text-on-tertiary-container",
      },
      size: {
        small: "h-10 w-10 gap-0",
        default: "h-14 w-14 gap-0",
        large: "h-24 w-24 gap-0",
        // Extended FABs have text
        extended: "h-14 px-4 gap-2",
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
        {icon && <span className="material-symbols-outlined text-2xl">{icon}</span>}
        {label && <span className="text-label-large">{label}</span>}
        {!icon && !label && children}
      </Comp>
    )
  }
)
FAB.displayName = "FAB"

export { FAB, fabVariants }

