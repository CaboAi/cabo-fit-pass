import * as React from "react"
import { cn } from "@/lib/utils"

export interface MobileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search'
}

const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, label, error, hint, icon, inputMode, type, ...props }, ref) => {
    const inputId = React.useId()
    const errorId = React.useId()
    const hintId = React.useId()

    // Mobile-optimized input modes
    const getInputMode = (type?: string) => {
      if (inputMode) return inputMode
      switch (type) {
        case 'email': return 'email'
        case 'tel': return 'tel'
        case 'url': return 'url'
        case 'number': return 'numeric'
        case 'search': return 'search'
        default: return 'text'
      }
    }

    return (
      <div className="space-y-2">
        <label 
          htmlFor={inputId} 
          className={cn(
            "block text-sm font-medium leading-6",
            error ? "text-error" : "text-text-primary"
          )}
        >
          {label}
          {props.required && (
            <span className="text-error ml-1" aria-label="required">*</span>
          )}
        </label>
        
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <div className="text-text-tertiary w-5 h-5">
                {icon}
              </div>
            </div>
          )}
          
          <input
            id={inputId}
            ref={ref}
            type={type}
            inputMode={getInputMode(type)}
            className={cn(
              // Base styles
              "block w-full rounded-xl border-0 px-4 py-3 text-text-primary shadow-sm ring-1 ring-inset",
              "placeholder:text-text-tertiary focus:ring-2 focus:ring-inset",
              "disabled:cursor-not-allowed disabled:opacity-50",
              
              // Mobile optimizations
              "text-base", // Prevent zoom on iOS
              "min-h-[48px]", // 48px minimum for comfortable tapping
              icon ? "pl-10" : "pl-4",
              
              // States
              error 
                ? "ring-error focus:ring-error bg-error/5" 
                : "ring-border focus:ring-primary bg-surface-secondary",
              
              // Touch-friendly styling
              "transition-colors duration-200",
              "touch-manipulation", // Optimize for touch
              
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              error && errorId,
              hint && hintId
            )}
            {...props}
          />
        </div>
        
        {hint && !error && (
          <p id={hintId} className="text-sm text-text-tertiary">
            {hint}
          </p>
        )}
        
        {error && (
          <p id={errorId} className="text-sm text-error flex items-center gap-1" role="alert">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)
MobileInput.displayName = "MobileInput"

export { MobileInput }