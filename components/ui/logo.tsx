import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'default' | 'light' | 'dark' | 'monochrome'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const sizeClasses = {
  xs: { container: 'h-6 w-6', text: 'text-sm' },
  sm: { container: 'h-8 w-8', text: 'text-base' },
  md: { container: 'h-10 w-10', text: 'text-lg' },
  lg: { container: 'h-12 w-12', text: 'text-xl' },
  xl: { container: 'h-16 w-16', text: 'text-2xl' },
}

const textClasses = {
  default: 'text-[#2c3e50]',
  light: 'text-white',
  dark: 'text-[#2c3e50]',
  monochrome: 'text-gray-900',
}

const LogoIcon = ({ variant = 'default', size = 'md' }: Pick<LogoProps, 'variant' | 'size'>) => {
  const getColors = () => {
    switch (variant) {
      case 'light':
        return { orange: '#ffffff', dark: '#ffffff' }
      case 'dark':
        return { orange: '#e67e22', dark: '#2c3e50' }
      case 'monochrome':
        return { orange: '#6b7280', dark: '#374151' }
      default:
        return { orange: '#e67e22', dark: '#2c3e50' }
    }
  }

  const colors = getColors()
  const { container } = sizeClasses[size]

  return (
    <div className={cn(container, 'relative')}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        className="w-full h-full"
        aria-label="Cabo Fit Pass Logo"
      >
        <defs>
          <style>{`
            .cf-orange { fill: ${colors.orange}; }
            .cf-dark { fill: ${colors.dark}; }
          `}</style>
        </defs>
        
        {/* Orange C shape */}
        <path
          className="cf-orange"
          d="M51.2 102.4 
            Q51.2 51.2 102.4 51.2 
            L256 51.2 
            Q358.4 51.2 358.4 153.6 
            L358.4 256 
            Q358.4 358.4 256 358.4 
            L153.6 358.4 
            Q51.2 358.4 51.2 256 
            Z"
        />
        
        {/* Dark F shape */}
        <path
          className="cf-dark"
          d="M204.8 102.4 
            L332.8 102.4 
            L332.8 153.6 
            L256 153.6 
            L256 204.8 
            L307.2 204.8 
            L307.2 256 
            L256 256 
            L256 358.4 
            L204.8 358.4 
            Z"
        />
      </svg>
    </div>
  )
}

export const Logo = ({ 
  variant = 'default', 
  size = 'md', 
  showText = true, 
  className 
}: LogoProps) => {
  const { text: textClass } = sizeClasses[size]
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoIcon variant={variant} size={size} />
      {showText && (
        <div className="flex flex-col">
          <span 
            className={cn(
              'font-bold leading-none',
              textClass,
              textClasses[variant]
            )}
          >
            Cabo Fit Pass
          </span>
          <span 
            className={cn(
              'text-xs leading-none opacity-80',
              textClasses[variant]
            )}
          >
            Fitness Marketplace
          </span>
        </div>
      )}
    </div>
  )
}

// Export individual components for flexibility
export { LogoIcon }

// Brand color utilities for consistency
export const brandColors = {
  primary: '#e67e22', // Orange
  secondary: '#2c3e50', // Dark
  accent: '#3498db', // Blue
  success: '#27ae60', // Green
  warning: '#f39c12', // Yellow
  danger: '#e74c3c', // Red
} as const

export default Logo