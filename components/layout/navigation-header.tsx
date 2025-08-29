'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Activity, 
  Calendar, 
  CreditCard, 
  User, 
  Menu, 
  X, 
  LogOut,
  Building2
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'

interface NavigationHeaderProps {
  profile?: {
    email: string
    credits: number
    name?: string
  }
  onSignOut?: () => void
}

export function NavigationHeader({ profile, onSignOut }: NavigationHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showMobileNav, setShowMobileNav] = useState(false)
  
  // Safe locale detection from pathname - defaults to 'en'
  const locale = pathname.startsWith('/es') ? 'es' : 'en'

  const navigationItems = [
    { path: '/dashboard', label: 'Classes', icon: Calendar, localized: true },
    { path: '/studio', label: 'Studios', icon: Activity, localized: true },
    { path: '/studio-management', label: 'Manage Studio', icon: Building2, localized: true },
    { path: '/pricing', label: 'Pricing', icon: CreditCard, localized: true },
    { path: '/profile', label: 'Profile', icon: User, localized: true }
  ]

  const getNavItemClass = (isActive: boolean, isMobile: boolean = false) => {
    const baseClass = "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
    const mobileBaseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all"
    
    if (isActive) {
      return isMobile
        ? `${mobileBaseClass} gradient-fitness-primary text-primary-foreground border border-primary/30`
        : `${baseClass} gradient-fitness-primary text-primary-foreground`
    }
    
    return isMobile
      ? `${mobileBaseClass} text-text-secondary hover:text-text-primary hover:bg-surface-tertiary`
      : `${baseClass} text-text-secondary hover:text-text-primary hover:bg-surface-tertiary`
  }

  const getNavigationPath = (path: string, localized: boolean) => {
    return localized ? `/${locale}${path}` : path
  }

  const handleNavigation = (path: string, localized: boolean) => {
    const navigationPath = getNavigationPath(path, localized)
    router.push(navigationPath)
    setShowMobileNav(false)
  }

  return (
    <div className="relative bg-surface border-b-2 border-primary/30 shadow-fitness-lg z-50" style={{ backgroundColor: 'rgba(30, 30, 35, 0.95)' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 -z-10"></div>
      <div className="relative max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center">
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              aria-label="Go to dashboard"
            >
              <Logo variant="light" size="sm" showText={false} />
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-white">Cabo Fit Pass</span>
                <div className="text-xs text-white/70">Fitness Marketplace</div>
              </div>
            </button>
          </div>

          {/* Mobile Navigation Button - Right on mobile, hidden on desktop */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-tertiary min-w-[44px] min-h-[44px]"
              aria-label={showMobileNav ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={showMobileNav}
              aria-controls="mobile-navigation"
            >
              {showMobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Centered Navigation - Desktop */}
          <div className="hidden lg:flex items-center">
            <div className="bg-surface-secondary backdrop-blur-xl rounded-2xl p-1.5 border border-border">
              <nav className="flex items-center space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const expectedPath = getNavigationPath(item.path, item.localized)
                  const isActive = pathname === expectedPath || pathname === item.path
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path, item.localized)}
                      className={getNavItemClass(isActive)}
                      aria-label={`Navigate to ${item.label}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* User Profile Section - Right */}
          {profile && (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-text-primary">{profile.name || 'Fitness Enthusiast'}</p>
                <p className="text-xs text-text-secondary">{profile.email}</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 gradient-fitness-primary rounded-full blur opacity-75 -z-10"></div>
                <button 
                  onClick={() => handleNavigation('/profile', true)}
                  className="relative min-w-[44px] min-h-[44px] gradient-fitness-primary rounded-full flex items-center justify-center text-primary-foreground font-bold hover:scale-105 transition-transform z-10"
                  aria-label={`View profile for ${profile.name || profile.email}`}
                >
                  {profile.email?.charAt(0).toUpperCase() || 'U'}
                </button>
              </div>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="p-2 text-text-secondary hover:text-text-primary transition-colors min-w-[44px] min-h-[44px]"
                  aria-label="Sign out of your account"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileNav && (
          <div 
            id="mobile-navigation"
            className="lg:hidden bg-surface-secondary backdrop-blur-xl border-t border-border mt-6 rounded-2xl"
            role="navigation"
            aria-label="Mobile navigation menu"
          >
            <div className="p-4">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const expectedPath = getNavigationPath(item.path, item.localized)
                  const isActive = pathname === expectedPath || pathname === item.path
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path, item.localized)}
                      className={getNavItemClass(isActive, true)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
                
                {/* Mobile Profile & Sign Out */}
                {profile && onSignOut && (
                  <div className="border-t border-border pt-4 mt-4 space-y-2">
                    <div className="px-4 py-2">
                      <p className="text-text-primary font-medium">{profile.name || 'Fitness Enthusiast'}</p>
                      <p className="text-text-secondary text-sm">{profile.email}</p>
                      <p className="text-text-secondary text-sm">{profile.credits} credits available</p>
                    </div>
                    <button
                      onClick={() => {
                        onSignOut()
                        setShowMobileNav(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-error hover:text-error/80 hover:bg-error/10"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}