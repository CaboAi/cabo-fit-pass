'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'

interface UseToastReturn {
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  showWarning: (message: string) => void
  showBookingSuccess: (className: string, remainingCredits: number) => void
  showBookingError: (message: string) => void
  showPaymentSuccess: (creditsAdded: number) => void
  showConnectionError: () => void
}

export function useToast(): UseToastReturn {
  const showSuccess = useCallback((message: string) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
    })
  }, [])

  const showError = useCallback((message: string) => {
    toast.error(message, {
      duration: 6000,
      position: 'top-right',
    })
  }, [])

  const showInfo = useCallback((message: string) => {
    toast.info(message, {
      duration: 4000,
      position: 'top-right',
    })
  }, [])

  const showWarning = useCallback((message: string) => {
    toast.warning(message, {
      duration: 5000,
      position: 'top-right',
    })
  }, [])

  const showBookingSuccess = useCallback((className: string, remainingCredits: number) => {
    toast.success(`Successfully booked ${className}!`, {
      description: `Remaining credits: ${remainingCredits}`,
      duration: 5000,
      position: 'top-right',
    })
  }, [])

  const showBookingError = useCallback((message: string) => {
    toast.error('Booking Failed', {
      description: message,
      duration: 6000,
      position: 'top-right',
    })
  }, [])

  const showPaymentSuccess = useCallback((creditsAdded: number) => {
    toast.success('Payment Successful!', {
      description: `${creditsAdded} credits added to your account`,
      duration: 5000,
      position: 'top-right',
    })
  }, [])

  const showConnectionError = useCallback(() => {
    toast.error('Connection Error', {
      description: 'Unable to connect to the server. Please check your internet connection and try again.',
      duration: 8000,
      position: 'top-right',
    })
  }, [])

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showBookingSuccess,
    showBookingError,
    showPaymentSuccess,
    showConnectionError,
  }
}
