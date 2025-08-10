'use client'

import { toast } from 'sonner'

export function useToast() {
  const showSuccess = (message: string) => {
    toast.success(message)
  }

  const showError = (message: string) => {
    toast.error(message)
  }

  const showWarning = (message: string) => {
    toast.warning(message)
  }

  const showInfo = (message: string) => {
    toast.info(message)
  }

  const showBookingSuccess = (className: string, remainingCredits: number) => {
    toast.success(
      `Successfully booked ${className}!`,
      {
        description: `Credits remaining: ${remainingCredits}`,
        duration: 4000,
      }
    )
  }

  const showBookingError = (error: string) => {
    toast.error(
      'Booking Failed',
      {
        description: error,
        duration: 5000,
      }
    )
  }

  const showPaymentSuccess = (credits: number) => {
    toast.success(
      'Payment Successful!',
      {
        description: `${credits} credits added to your account`,
        duration: 4000,
      }
    )
  }

  const showPaymentError = (error: string) => {
    toast.error(
      'Payment Failed',
      {
        description: error,
        duration: 5000,
      }
    )
  }

  const showConnectionError = () => {
    toast.error(
      'Connection Error',
      {
        description: 'Please check your internet connection and try again',
        duration: 5000,
      }
    )
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showBookingSuccess,
    showBookingError,
    showPaymentSuccess,
    showPaymentError,
    showConnectionError
  }
}