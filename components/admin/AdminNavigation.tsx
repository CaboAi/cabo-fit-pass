'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Menu, 
  X, 
  Home, 
  DollarSign, 
  Building2, 
  CreditCard, 
  Users, 
  User,
  ChevronDown
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'

interface AdminNavigationProps {
  locale: string
  userEmail: string
}

const navigationItems = [
  { path: '/admin', label: 'Overview', icon: Home },
  { path: '/admin/gym-pricing', label: 'Gym Pricing', icon: DollarSign },
  { path: '/admin/gyms', label: 'Gyms', icon: Building2 },
  { path: '/admin/payouts', label: 'Payouts', icon: CreditCard },
  { path: '/admin/users', label: 'Users', icon: Users },
]

export default function AdminNavigation({ locale, userEmail }: AdminNavigationProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const getNavItemClass = (path: string, isActive: boolean) => {
    const baseClass = "inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors min-h-[44px]"
    if (isActive) {
      return `${baseClass} bg-orange-100 text-orange-700 border border-orange-200`
    }
    return `${baseClass} text-gray-600 hover:text-gray-900 hover:bg-gray-100`
  }

  const getMobileNavItemClass = (isActive: boolean) => {
    const baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left min-h-[44px]"
    if (isActive) {
      return `${baseClass} bg-orange-100 text-orange-700 border border-orange-200`
    }
    return `${baseClass} text-gray-600 hover:text-gray-900 hover:bg-gray-100`
  }

  const isCurrentPath = (path: string) => {
    const fullPath = `/${locale}${path}`
    return pathname === fullPath || pathname.startsWith(fullPath + '/')
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <Link 
                href={`/${locale}/admin`} 
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                aria-label="Admin Dashboard Home"
              >
                <Logo variant="default" size="sm" showText={false} />
                <div className="hidden sm:block">
                  <span className="text-lg font-bold text-gray-900">Admin Dashboard</span>
                  <div className="text-xs text-gray-600">Management Portal</div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = isCurrentPath(item.path)
                
                return (
                  <Link
                    key={item.path}
                    href={`/${locale}${item.path}`}
                    className={getNavItemClass(item.path, isActive)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* User Menu and Mobile Button */}
            <div className="flex items-center gap-2">
              {/* User Menu - Desktop */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px]"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden xl:inline text-sm">{userEmail}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">Signed in as</p>
                      <p className="text-sm text-gray-600 truncate">{userEmail}</p>
                    </div>
                    <Link 
                      href={`/${locale}/dashboard`}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Return to Dashboard
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px]"
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-sm" role="navigation" aria-label="Mobile navigation">
          <div className="px-4 py-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isCurrentPath(item.path)
              
              return (
                <Link
                  key={item.path}
                  href={`/${locale}${item.path}`}
                  className={getMobileNavItemClass(isActive)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            
            {/* Mobile User Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="px-4 py-2 text-sm text-gray-600">
                <p className="font-medium text-gray-900">Signed in as</p>
                <p className="truncate">{userEmail}</p>
              </div>
              <Link 
                href={`/${locale}/dashboard`}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100 min-h-[44px]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}