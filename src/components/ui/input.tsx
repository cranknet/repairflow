"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Material Design 3 Text Field Component
 * 
 * Implements MD3 text field specifications with filled and outlined variants,
 * floating labels, leading/trailing icons, and proper accessibility.
 * 
 * @see https://m3.material.io/components/text-fields/overview
 */

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'filled' | 'outlined'
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
      variant = 'outlined',
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
      "relative flex items-center w-full rounded-t-md bg-surface-container-highest transition-colors duration-short2 ease-standard",
      isFocused && "bg-surface-container-high",
      hasError && "bg-error-container/10",
      disabled && "opacity-38 pointer-events-none"
    )

    const filledInputClasses = cn(
      "w-full flex-1 bg-transparent px-4 text-body-large text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none disabled:cursor-not-allowed",
      label ? (inputSize === 'small' ? 'pt-5 pb-1' : 'pt-6 pb-2') : (inputSize === 'small' ? 'py-2' : 'py-3'),
      leadingIcon && "pl-0",
      trailingIcon && "pr-0"
    )

    const filledIndicatorClasses = cn(
      "absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-short2 ease-standard",
      isFocused ? "h-0.5" : "h-px",
      hasError ? "bg-error" : isFocused ? "bg-primary" : "bg-on-surface-variant"
    )

    // Outlined variant styles
    const outlinedContainerClasses = cn(
      "relative flex items-center w-full rounded-md border-2 transition-colors duration-short2 ease-standard",
      isFocused
        ? hasError
          ? "border-error"
          : "border-primary"
        : hasError
          ? "border-error"
          : "border-outline",
      disabled && "opacity-38 pointer-events-none"
    )

    const outlinedInputClasses = cn(
      "w-full flex-1 bg-transparent px-4 text-body-large text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none disabled:cursor-not-allowed",
      inputSize === 'small' ? 'py-2' : 'py-3',
      leadingIcon && "pl-0",
      trailingIcon && "pr-0"
    )

    const labelClasses = cn(
      "absolute left-0 px-4 text-body-large pointer-events-none transition-all duration-short2 ease-standard origin-left",
      leadingIcon && "left-12",
      isLabelFloating
        ? variant === 'outlined'
          ? "top-0 -translate-y-1/2 scale-75 bg-surface px-1 text-label-small"
          : "top-2 scale-75 text-label-small"
        : inputSize === 'small'
          ? "top-2"
          : "top-1/2 -translate-y-1/2",
      isFocused
        ? hasError
          ? "text-error"
          : "text-primary"
        : hasError
          ? "text-error"
          : "text-on-surface-variant",
      disabled && "opacity-38"
    )

    const iconClasses = "flex items-center justify-center w-12 text-on-surface-variant"

    const supportTextClasses = cn(
      "mt-1 px-4 text-body-small transition-colors duration-short2 ease-standard",
      hasError ? "text-error" : "text-on-surface-variant"
    )

    if (variant === 'filled') {
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
                  {required && <span className="text-error ml-0.5">*</span>}
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
                {required && <span className="text-error ml-0.5">*</span>}
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
 * Textarea Component with MD3 styling
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'filled' | 'outlined'
  label?: string
  helperText?: string
  errorText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant = 'outlined',
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
      "relative w-full rounded-md transition-colors duration-short2 ease-standard",
      variant === 'filled'
        ? cn(
          "bg-surface-container-highest rounded-t-md rounded-b-none",
          isFocused && "bg-surface-container-high",
          hasError && "bg-error-container/10"
        )
        : cn(
          "border-2",
          isFocused
            ? hasError ? "border-error" : "border-primary"
            : hasError ? "border-error" : "border-outline"
        ),
      disabled && "opacity-38 pointer-events-none"
    )

    const textareaClasses = cn(
      "w-full bg-transparent px-4 pt-6 pb-2 text-body-large text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none disabled:cursor-not-allowed resize-y min-h-[100px]",
      variant === 'outlined' && "rounded-md",
      className
    )

    const labelClasses = cn(
      "absolute left-4 top-4 text-body-large pointer-events-none transition-all duration-short2 ease-standard origin-left",
      isLabelFloating
        ? variant === 'outlined'
          ? "top-0 -translate-y-1/2 scale-75 bg-surface px-1 text-label-small"
          : "top-2 scale-75 text-label-small"
        : "",
      isFocused
        ? hasError ? "text-error" : "text-primary"
        : hasError ? "text-error" : "text-on-surface-variant"
    )

    const supportTextClasses = cn(
      "mt-1 px-4 text-body-small transition-colors duration-short2 ease-standard",
      hasError ? "text-error" : "text-on-surface-variant"
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
              {required && <span className="text-error ml-0.5">*</span>}
            </label>
          )}

          {variant === 'filled' && (
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-short2 ease-standard",
                isFocused ? "h-0.5" : "h-px",
                hasError ? "bg-error" : isFocused ? "bg-primary" : "bg-on-surface-variant"
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
