import * as React from "react"
import { useForm, Controller, FieldPath, FieldValues } from "react-hook-form"
import { cn } from "@/lib/utils"
import { MobileInput } from "./mobile-input"
import { Button } from "@/components/ui/button"

interface FormFieldConfig<T extends FieldValues> {
  name: FieldPath<T>
  label: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search'
  placeholder?: string
  required?: boolean
  validation?: {
    pattern?: RegExp
    minLength?: number
    maxLength?: number
    custom?: (value: any) => string | true
  }
  hint?: string
  icon?: React.ReactNode
}

interface EnhancedFormProps<T extends FieldValues> {
  fields: FormFieldConfig<T>[]
  onSubmit: (data: T) => Promise<void> | void
  submitText?: string
  loadingText?: string
  className?: string
  children?: React.ReactNode
  defaultValues?: Partial<T>
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all'
}

export function EnhancedForm<T extends FieldValues>({
  fields,
  onSubmit,
  submitText = "Submit",
  loadingText = "Submitting...",
  className,
  children,
  defaultValues,
  mode = 'onBlur' // Better UX than onSubmit
}: EnhancedFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = React.useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    setError,
    clearErrors,
    reset
  } = useForm<T>({
    defaultValues,
    mode,
    criteriaMode: 'all' // Show all validation errors
  })

  const onFormSubmit = async (data: T) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      await onSubmit(data)
      setSubmitSuccess(true)
      
      // Optional: Reset form after successful submission
      // reset()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      setSubmitError(message)
      
      // Focus first error field if submission fails
      const firstErrorField = Object.keys(errors)[0]
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
        element?.focus()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFieldError = (name: FieldPath<T>) => {
    const error = errors[name]
    if (!error) return undefined
    
    // Return the first error message
    if (typeof error.message === 'string') return error.message
    if (error.types) {
      const firstType = Object.keys(error.types)[0]
      return error.types[firstType]
    }
    return 'Invalid input'
  }

  const validateField = (config: FormFieldConfig<T>, value: any) => {
    const { validation, required, label } = config
    
    // Required validation
    if (required && (!value || value.trim() === '')) {
      return `${label} is required`
    }
    
    if (!validation || !value) return true
    
    // Pattern validation
    if (validation.pattern && !validation.pattern.test(value)) {
      return `${label} format is invalid`
    }
    
    // Length validations
    if (validation.minLength && value.length < validation.minLength) {
      return `${label} must be at least ${validation.minLength} characters`
    }
    
    if (validation.maxLength && value.length > validation.maxLength) {
      return `${label} must be no more than ${validation.maxLength} characters`
    }
    
    // Custom validation
    if (validation.custom) {
      return validation.custom(value)
    }
    
    return true
  }

  return (
    <form 
      onSubmit={handleSubmit(onFormSubmit)} 
      className={cn("space-y-6", className)}
      noValidate // We handle validation ourselves
    >
      {/* Form Fields */}
      <div className="space-y-4">
        {fields.map((field) => (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
              validate: (value) => validateField(field, value)
            }}
            render={({ field: { onChange, value, name, onBlur }, fieldState }) => (
              <MobileInput
                name={name}
                label={field.label}
                type={field.type}
                placeholder={field.placeholder}
                required={field.required}
                value={value || ''}
                onChange={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
                hint={field.hint}
                icon={field.icon}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? `${name}-error` : undefined}
              />
            )}
          />
        ))}
      </div>

      {/* Custom Children */}
      {children}

      {/* Submit Error */}
      {submitError && (
        <div 
          className="rounded-xl border border-error/20 bg-error/10 px-4 py-3" 
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-error flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-error font-medium">
              {submitError}
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {submitSuccess && (
        <div 
          className="rounded-xl border border-success/20 bg-success/10 px-4 py-3" 
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-success flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.53a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-success font-medium">
              Form submitted successfully!
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
        loadingText={loadingText}
        size="lg"
        className="w-full btn-fitness-primary"
      >
        {submitText}
      </Button>

      {/* Form Status for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isSubmitting && `${loadingText}...`}
        {submitError && `Error: ${submitError}`}
        {submitSuccess && "Form submitted successfully"}
      </div>
    </form>
  )
}