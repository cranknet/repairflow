"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Input Component
 * 
 * Clean text field with filled and outlined variants.
 */

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'outline'
  label?: string
  helperText?: string
  errorText?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  inputSize?: 'default' | 'small'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      variant = 'outline',
      label,
      helperText,
      errorText,
      leadingIcon,
      trailingIcon,
      inputSize = 'default',
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue)
    const hasError = !!errorText
    const supportText = errorText || helperText

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value)
      props.onChange?.(e)
    }

    const isLabelFloating = isFocused || hasValue || props.placeholder

    // Filled variant styles
    const filledContainerClasses = cn(
      "relative flex items-center w-full rounded-t-lg bg-gray-100 dark:bg-gray-800 transition-colors",
      isFocused && "bg-gray-50 dark:bg-gray-700",
      hasError && "bg-error-50 dark:bg-error-500/10",
      disabled && "opacity-50 pointer-events-none"
    )

    const filledInputClasses = cn(
      "w-full flex-1 bg-transparent px-4 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed",
      label ? (inputSize === 'small' ? 'pt-5 pb-1' : 'pt-6 pb-2') : (inputSize === 'small' ? 'py-2' : 'py-3'),
      leadingIcon && "pl-0",
      trailingIcon && "pr-0"
    )

    const filledIndicatorClasses = cn(
      "absolute bottom-0 left-0 right-0 transition-all",
      isFocused ? "h-0.5" : "h-px",
      hasError ? "bg-error-500" : isFocused ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
    )

    // Outlined variant styles
    const outlinedContainerClasses = cn(
      "relative flex items-center w-full rounded-lg border transition-colors bg-white dark:bg-gray-900",
      isFocused
        ? hasError
          ? "border-error-500 ring-2 ring-error-500/20"
          : "border-brand-500 ring-2 ring-brand-500/20"
        : hasError
          ? "border-error-500"
          : "border-gray-300 dark:border-gray-600",
      disabled && "opacity-50 pointer-events-none bg-gray-50 dark:bg-gray-800"
    )

    const outlinedInputClasses = cn(
      "w-full flex-1 bg-transparent px-4 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed",
      inputSize === 'small' ? 'py-2' : 'py-3',
      leadingIcon && "pl-0",
      trailingIcon && "pr-0"
    )

    const labelClasses = cn(
      "absolute left-0 px-4 text-base pointer-events-none transition-all origin-left",
      leadingIcon && "left-12",
      isLabelFloating
        ? variant === 'outline'
          ? "top-0 -translate-y-1/2 scale-75 bg-white dark:bg-gray-900 px-1 text-xs"
          : "top-2 scale-75 text-xs"
        : inputSize === 'small'
          ? "top-2"
          : "top-1/2 -translate-y-1/2",
      isFocused
        ? hasError
          ? "text-error-500"
          : "text-brand-500"
        : hasError
          ? "text-error-500"
          : "text-gray-500 dark:text-gray-400",
      disabled && "opacity-50"
    )

    const iconClasses = "flex items-center justify-center w-12 text-gray-500 dark:text-gray-400"

    const supportTextClasses = cn(
      "mt-1 px-4 text-xs transition-colors",
      hasError ? "text-error-500" : "text-gray-500 dark:text-gray-400"
    )

    if (variant === 'default') {
      return (
        <div className="w-full">
          <div className={filledContainerClasses}>
            {leadingIcon && <div className={iconClasses}>{leadingIcon}</div>}

            <div className="relative flex-1">
              <input
                ref={ref}
                type={type}
                className={cn(filledInputClasses, className)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleChange}
                disabled={disabled}
                required={required}
                aria-invalid={hasError}
                aria-describedby={supportText ? `${props.id}-support` : undefined}
                {...props}
              />

              {label && (
                <label className={labelClasses}>
                  {label}
                  {required && <span className="text-destructive ml-0.5">*</span>}
                </label>
              )}
            </div>

            {trailingIcon && <div className={iconClasses}>{trailingIcon}</div>}

            <div className={filledIndicatorClasses} />
          </div>

          {supportText && (
            <div
              id={`${props.id}-support`}
              className={supportTextClasses}
              role={hasError ? "alert" : undefined}
            >
              {supportText}
            </div>
          )}
        </div>
      )
    }

    // Outlined variant (default)
    return (
      <div className="w-full">
        <div className={outlinedContainerClasses}>
          {leadingIcon && <div className={iconClasses}>{leadingIcon}</div>}

          <div className="relative flex-1">
            <input
              ref={ref}
              type={type}
              className={cn(outlinedInputClasses, className)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleChange}
              disabled={disabled}
              required={required}
              aria-invalid={hasError}
              aria-describedby={supportText ? `${props.id}-support` : undefined}
              {...props}
            />

            {label && (
              <label className={labelClasses}>
                {label}
                {required && <span className="text-destructive ml-0.5">*</span>}
              </label>
            )}
          </div>

          {trailingIcon && <div className={iconClasses}>{trailingIcon}</div>}
        </div>

        {supportText && (
          <div
            id={`${props.id}-support`}
            className={supportTextClasses}
            role={hasError ? "alert" : undefined}
          >
            {supportText}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

/**
 * Textarea Component
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'outline'
  label?: string
  helperText?: string
  errorText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant = 'outline',
      label,
      helperText,
      errorText,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue)
    const hasError = !!errorText
    const supportText = errorText || helperText

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(!!e.target.value)
      props.onChange?.(e)
    }

    const isLabelFloating = isFocused || hasValue || props.placeholder

    const containerClasses = cn(
      "relative w-full rounded-lg transition-colors",
      variant === 'default'
        ? cn(
          "bg-muted rounded-t-lg rounded-b-none",
          isFocused && "bg-muted/80",
          hasError && "bg-destructive/10"
        )
        : cn(
          "border-2",
          isFocused
            ? hasError ? "border-destructive" : "border-primary"
            : hasError ? "border-destructive" : "border-input"
        ),
      disabled && "opacity-50 pointer-events-none"
    )

    const textareaClasses = cn(
      "w-full bg-transparent px-4 pt-6 pb-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed resize-y min-h-[100px]",
      variant === 'outline' && "rounded-lg",
      className
    )

    const labelClasses = cn(
      "absolute left-4 top-4 text-base pointer-events-none transition-all origin-left",
      isLabelFloating
        ? variant === 'outline'
          ? "top-0 -translate-y-1/2 scale-75 bg-background px-1 text-xs"
          : "top-2 scale-75 text-xs"
        : "",
      isFocused
        ? hasError ? "text-destructive" : "text-primary"
        : hasError ? "text-destructive" : "text-muted-foreground"
    )

    const supportTextClasses = cn(
      "mt-1 px-4 text-xs transition-colors",
      hasError ? "text-destructive" : "text-muted-foreground"
    )

    return (
      <div className="w-full">
        <div className={containerClasses}>
          <textarea
            ref={ref}
            className={textareaClasses}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={supportText ? `${props.id}-support` : undefined}
            {...props}
          />

          {label && (
            <label className={labelClasses}>
              {label}
              {required && <span className="text-destructive ml-0.5">*</span>}
            </label>
          )}

          {variant === 'default' && (
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 transition-all",
                isFocused ? "h-0.5" : "h-px",
                hasError ? "bg-destructive" : isFocused ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          )}
        </div>

        {supportText && (
          <div
            id={`${props.id}-support`}
            className={supportTextClasses}
            role={hasError ? "alert" : undefined}
          >
            {supportText}
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export { Input, Textarea }
