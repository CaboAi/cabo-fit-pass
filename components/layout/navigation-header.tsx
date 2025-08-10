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
        ? `${mobileBaseClass} bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30`
        : `${baseClass} bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white`
    }
    
    return isMobile
      ? `${mobileBaseClass} text-purple-200 hover:text-white hover:bg-white/10`
      : `${baseClass} text-purple-200 hover:text-white hover:bg-white/10`
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setShowMobileNav(false)
  }

  return (
    <div className="relative bg-black/20 backdrop-blur-xl border-b border-white/10">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-600 rounded-full blur-lg opacity-75"></div>
              <div className="relative bg-gradient-to-r from-orange-400 to-pink-600 text-white p-3 rounded-full">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Cabo Fit Pass
              </h1>
              <p className="text-xs text-purple-200 mt-0.5">Premium Fitness Experience</p>
            </div>
          </div>

          {/* Premium Navigation - Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10">
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
              className="p-2 text-purple-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
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
                  <p className="text-2xl font-bold text-white">{profile.credits}</p>
                  <p className="text-xs text-purple-200">Credits</p>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-xs text-purple-200">Classes</p>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    <Award className="w-6 h-6 text-yellow-400 inline" />
                  </p>
                  <p className="text-xs text-purple-200">Gold Tier</p>
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{profile.name || 'Fitness Enthusiast'}</p>
                  <p className="text-xs text-purple-300">{profile.email}</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full blur opacity-75"></div>
                  <button 
                    onClick={() => handleNavigation('/profile')}
                    className="relative w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold hover:scale-105 transition-transform"
                    title="View Profile"
                  >
                    {profile.email?.charAt(0).toUpperCase() || 'U'}
                  </button>
                </div>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-2 text-purple-300 hover:text-white transition-colors"
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
          <div className="lg:hidden bg-black/40 backdrop-blur-xl border-t border-white/10 mt-6 rounded-2xl">
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
                  <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                    <div className="px-4 py-2">
                      <p className="text-white font-medium">{profile.name || 'Fitness Enthusiast'}</p>
                      <p className="text-purple-300 text-sm">{profile.email}</p>
                      <p className="text-purple-200 text-sm">{profile.credits} credits available</p>
                    </div>
                    <button
                      onClick={() => {
                        onSignOut()
                        setShowMobileNav(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-red-400 hover:text-red-300 hover:bg-red-500/10"
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