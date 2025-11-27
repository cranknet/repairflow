import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Material Design 3 Card Component
 * 
 * Implements MD3 card specifications with filled, elevated, and outlined variants,
 * proper elevation, state layers, and accessibility.
 * 
 * @see https://m3.material.io/components/cards/overview
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'filled' | 'elevated' | 'outlined'
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'elevated', interactive = false, ...props }, ref) => {
    const baseClasses = "rounded-xl transition-all duration-short2 ease-standard"
    
    const variantClasses = {
      filled: cn(
        "bg-surface-container-highest text-on-surface",
        interactive && "hover:shadow-md-level1 cursor-pointer md-state-layer-hover"
      ),
      elevated: cn(
        "bg-surface-container-low text-on-surface shadow-md-level1",
        interactive && "hover:shadow-md-level2 cursor-pointer md-state-layer-hover"
      ),
      outlined: cn(
        "bg-surface text-on-surface border border-outline-variant",
        interactive && "hover:shadow-md-level1 hover:border-outline cursor-pointer md-state-layer-hover"
      ),
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          className
        )}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-title-large font-medium leading-tight tracking-tight text-on-surface",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-body-medium text-on-surface-variant", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("p-6 pt-0", className)} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

/**
 * Card Action Area
 * For cards that act as a single clickable area
 */
const CardActionArea = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "w-full text-left p-0 border-none bg-transparent cursor-pointer",
      "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary rounded-xl",
      "md-state-layer-hover",
      className
    )}
    {...props}
  >
    {children}
  </button>
))
CardActionArea.displayName = "CardActionArea"

/**
 * Card Media
 * For images or media content in cards
 */
const CardMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    image?: string
    alt?: string
    aspectRatio?: '16/9' | '4/3' | '1/1' | 'auto'
  }
>(({ className, image, alt, aspectRatio = '16/9', children, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full bg-surface-container-highest overflow-hidden",
      aspectRatio !== 'auto' && "relative",
      className
    )}
    style={{
      ...style,
      ...(aspectRatio !== 'auto' && { aspectRatio }),
    }}
    {...props}
  >
    {image ? (
      <img 
        src={image} 
        alt={alt || ''} 
        className="w-full h-full object-cover"
      />
    ) : (
      children
    )}
  </div>
))
CardMedia.displayName = "CardMedia"

/**
 * Card Actions
 * Container for action buttons in cards
 */
const CardActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    justify?: 'start' | 'end' | 'between' | 'center'
  }
>(({ className, justify = 'end', ...props }, ref) => {
  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    between: 'justify-between',
    center: 'justify-center',
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 p-6 pt-0",
        justifyClasses[justify],
        className
      )}
      {...props}
    />
  )
})
CardActions.displayName = "CardActions"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardActionArea,
  CardMedia,
  CardActions,
}
