import * as React from "react"
import Image from "next/image"
import { cva, type VariantProps } from "class-variance-authority"
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

/**
 * Chip Component
 * 
 * Clean chip with multiple variants for various use cases.
 */

const chipVariants = cva(
  "inline-flex items-center gap-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-8 px-3 rounded-md",
        sm: "h-6 px-2 rounded text-xs",
        lg: "h-10 px-4 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof chipVariants> {
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  onRemove?: () => void
  selected?: boolean
  avatar?: React.ReactNode
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      className,
      variant,
      size,
      leadingIcon,
      trailingIcon,
      onRemove,
      selected,
      avatar,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(chipVariants({ variant, size }), className)}
        data-selected={selected}
        {...props}
      >
        {avatar && <div className="inline-flex -ml-1">{avatar}</div>}
        {leadingIcon && !avatar && <span className="inline-flex">{leadingIcon}</span>}
        <span>{children}</span>
        {trailingIcon && <span className="inline-flex">{trailingIcon}</span>}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="inline-flex -mr-1 p-0.5 rounded-full hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Remove"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </button>
    )
  }
)
Chip.displayName = "Chip"

/**
 * Chip Avatar Component
 */
export interface ChipAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
}

const ChipAvatar = React.forwardRef<HTMLDivElement, ChipAvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex h-6 w-6 items-center justify-center rounded-full overflow-hidden bg-muted text-muted-foreground text-xs",
          className
        )}
        {...props}
      >
        {src ? (
          <Image
            src={src}
            alt={alt || ''}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <span>{fallback}</span>
        )}
      </div>
    )
  }
)
ChipAvatar.displayName = "ChipAvatar"

/**
 * Filter Chip Component
 */
export interface FilterChipProps extends Omit<ChipProps, 'variant'> {
  selected: boolean
  onSelectedChange?: (selected: boolean) => void
}

const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ selected, onSelectedChange, leadingIcon, children, className, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onSelectedChange?.(!selected)
      props.onClick?.(e)
    }

    return (
      <Chip
        ref={ref}
        variant={selected ? "primary" : "outline"}
        leadingIcon={
          selected ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            leadingIcon
          )
        }
        onClick={handleClick}
        className={className}
        {...props}
      >
        {children}
      </Chip>
    )
  }
)
FilterChip.displayName = "FilterChip"

/**
 * Input Chip Component
 */
export interface InputChipProps extends Omit<ChipProps, 'variant'> {
  onRemove: () => void
}

const InputChip = React.forwardRef<HTMLButtonElement, InputChipProps>(
  ({ onRemove, ...props }, ref) => {
    return (
      <Chip
        ref={ref}
        variant="outline"
        onRemove={onRemove}
        {...props}
      />
    )
  }
)
InputChip.displayName = "InputChip"

/**
 * Chip Group Component
 */
export interface ChipGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

const ChipGroup = React.forwardRef<HTMLDivElement, ChipGroupProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap gap-2",
          orientation === 'vertical' && "flex-col items-start",
          className
        )}
        role="group"
        {...props}
      />
    )
  }
)
ChipGroup.displayName = "ChipGroup"

export { Chip, ChipAvatar, FilterChip, InputChip, ChipGroup, chipVariants }
