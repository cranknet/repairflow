import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Card Component
 * 
 * Clean card with filled, elevated, and outlined variants.
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline'
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'elevated', interactive = false, ...props }, ref) => {
    const baseClasses = "rounded-xl transition-all duration-200"

    const variantClasses = {
      default: cn(
        "bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-white",
        interactive && "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer hover:-translate-y-0.5"
      ),
      elevated: cn(
        "bg-white text-gray-900 dark:bg-gray-900 dark:text-white shadow-theme-sm border border-gray-100 dark:border-gray-800",
        interactive && "hover:shadow-theme-lg hover:-translate-y-1 cursor-pointer"
      ),
      outline: cn(
        "bg-white text-gray-900 dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700",
        interactive && "hover:shadow-theme-sm hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-0.5 cursor-pointer"
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
      "text-xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-white",
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
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
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
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl",
      "hover:bg-gray-50 dark:hover:bg-gray-800",
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
      "w-full bg-gray-100 dark:bg-gray-800 overflow-hidden",
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
      aspectRatio !== 'auto' ? (
        <Image
          src={image}
          alt={alt || ''}
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <Image
          src={image}
          alt={alt || ''}
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto object-cover"
          unoptimized
        />
      )
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
