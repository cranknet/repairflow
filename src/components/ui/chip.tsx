import * as React from "react"
import Image from "next/image"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Material Design 3 Chip Component
 * 
 * Implements MD3 chip specifications with assist, filter, input, and suggestion variants.
 * Includes proper state layers, elevation, and accessibility.
 * 
 * @see https://m3.material.io/components/chips/overview
 */

const chipVariants = cva(
  "inline-flex items-center gap-2 text-label-large font-medium transition-all duration-short2 ease-standard focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-38 md-state-layer-hover",
  {
    variants: {
      variant: {
        // Assist chip - Help users take action
        assist: "bg-transparent border border-outline text-on-surface hover:shadow-md-level1",

        // Filter chip - Filter content
        filter: "bg-transparent border border-outline text-on-surface-variant data-[selected=true]:bg-secondary-container data-[selected=true]:text-on-secondary-container data-[selected=true]:border-transparent",

        // Input chip - Represent discrete information
        input: "bg-transparent border border-outline text-on-surface-variant hover:shadow-md-level1",

        // Suggestion chip - Offer dynamic recommendations
        suggestion: "bg-transparent border border-outline text-on-surface-variant hover:shadow-md-level1",

        // Elevated (alternative styling)
        elevated: "bg-surface-container-low text-on-surface shadow-md-level1 hover:shadow-md-level2 border-none",
      },
      size: {
        default: "h-8 px-4 rounded-lg",
        small: "h-6 px-3 rounded-md text-label-small",
      },
    },
    defaultVariants: {
      variant: "assist",
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
        {leadingIcon && !avatar && <span className="inline-flex text-[18px]">{leadingIcon}</span>}
        <span>{children}</span>
        {trailingIcon && <span className="inline-flex text-[18px]">{trailingIcon}</span>}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="inline-flex -mr-1 p-0.5 rounded-full hover:bg-on-surface/12 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Remove"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </button>
    )
  }
)
Chip.displayName = "Chip"

/**
 * Chip Avatar Component
 * For displaying avatars in chips
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
          "relative inline-flex h-6 w-6 items-center justify-center rounded-full overflow-hidden bg-secondary-container text-on-secondary-container text-label-small",
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
 * Specialized chip for filtering content with selected state
 */
export interface FilterChipProps extends Omit<ChipProps, 'variant'> {
  selected: boolean
  onSelectedChange?: (selected: boolean) => void
}

const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ selected, onSelectedChange, leadingIcon, children, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onSelectedChange?.(!selected)
      props.onClick?.(e)
    }

    return (
      <Chip
        ref={ref}
        variant="filter"
        selected={selected}
        leadingIcon={
          selected ? (
            <span className="material-symbols-outlined">check</span>
          ) : (
            leadingIcon
          )
        }
        onClick={handleClick}
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
 * Specialized chip for representing discrete information with remove capability
 */
export interface InputChipProps extends Omit<ChipProps, 'variant'> {
  onRemove: () => void
}

const InputChip = React.forwardRef<HTMLButtonElement, InputChipProps>(
  ({ onRemove, ...props }, ref) => {
    return (
      <Chip
        ref={ref}
        variant="input"
        onRemove={onRemove}
        {...props}
      />
    )
  }
)
InputChip.displayName = "InputChip"

/**
 * Chip Group Component
 * Container for multiple chips with proper spacing
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
