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
  Award
} from 'lucide-react'

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

  const navigationItems = [
    { path: '/dashboard', label: 'Classes', icon: Calendar },
    { path: '/studio', label: 'Studios', icon: Activity },
    { path: '/pricing', label: 'Pricing', icon: CreditCard },
    { path: '/profile', label: 'Profile', icon: User }
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

  const handleNavigation = (path: string) => {
    router.push(path)
    setShowMobileNav(false)
  }

  return (
    <div className="relative bg-surface border-b-2 border-primary/30 shadow-fitness-lg z-50" style={{ backgroundColor: 'rgba(30, 30, 35, 0.95)' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 -z-10"></div>
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 gradient-fitness-primary rounded-full blur-lg opacity-75 -z-10"></div>
              <div className="relative gradient-fitness-primary text-primary-foreground p-3 rounded-full z-10">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-fitness-text">
                Cabo Fit Pass
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">Premium Fitness Experience</p>
            </div>
          </div>

          {/* Premium Navigation - Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="bg-surface-secondary backdrop-blur-xl rounded-2xl p-1.5 border border-border">
              <nav className="flex items-center space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.path
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={getNavItemClass(isActive)}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Mobile Navigation Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-tertiary"
            >
              {showMobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* User Profile Section */}
          {profile && (
            <div className="hidden lg:flex items-center space-x-6">
              {/* Stats */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-primary">{profile.credits}</p>
                  <p className="text-xs text-text-secondary">Credits</p>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-primary">12</p>
                  <p className="text-xs text-text-secondary">Classes</p>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-text-primary">
                    <Award className="w-6 h-6 text-warning inline" />
                  </p>
                  <p className="text-xs text-text-secondary">Gold Tier</p>
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-text-primary">{profile.name || 'Fitness Enthusiast'}</p>
                  <p className="text-xs text-text-secondary">{profile.email}</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 gradient-fitness-primary rounded-full blur opacity-75 -z-10"></div>
                  <button 
                    onClick={() => handleNavigation('/profile')}
                    className="relative w-10 h-10 gradient-fitness-primary rounded-full flex items-center justify-center text-primary-foreground font-bold hover:scale-105 transition-transform z-10"
                    title="View Profile"
                  >
                    {profile.email?.charAt(0).toUpperCase() || 'U'}
                  </button>
                </div>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileNav && (
          <div className="lg:hidden bg-surface-secondary backdrop-blur-xl border-t border-border mt-6 rounded-2xl">
            <div className="p-4">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.path
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
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