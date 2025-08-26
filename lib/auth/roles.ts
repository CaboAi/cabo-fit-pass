import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  GYM_OWNER = 'gym_owner',
  CORPORATE = 'corporate'
}

export interface Permission {
  resource: string
  action: string
  roles: UserRole[]
}

export const PERMISSIONS: Permission[] = [
  { resource: 'gyms', action: 'read', roles: [UserRole.USER, UserRole.ADMIN, UserRole.GYM_OWNER] },
  { resource: 'gyms', action: 'write', roles: [UserRole.ADMIN, UserRole.GYM_OWNER] },
  { resource: 'payouts', action: 'read', roles: [UserRole.ADMIN, UserRole.GYM_OWNER] },
  { resource: 'payouts', action: 'write', roles: [UserRole.ADMIN] },
  { resource: 'users', action: 'read', roles: [UserRole.ADMIN] },
  { resource: 'users', action: 'write', roles: [UserRole.ADMIN] }
]

export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  return PERMISSIONS.some(p => 
    p.resource === resource && 
    p.action === action && 
    p.roles.includes(userRole)
  )
}

export function requireRole(requiredRole: UserRole) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        throw new Error('Unauthorized')
      }
      
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', session.user.email)
        .single()
      
      if (profile?.role !== requiredRole) {
        throw new Error('Insufficient permissions')
      }
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

export function requireAdmin() {
  return requireRole(UserRole.ADMIN)
}

export function requireGymOwner() {
  return requireRole(UserRole.GYM_OWNER)
}

export function requireCorporate() {
  return requireRole(UserRole.CORPORATE)
}

// Helper function to check if user has any of the required roles
export function hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

// Helper function to get user role from session
export async function getUserRole(email: string): Promise<UserRole | null> {
  try {
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', email)
      .single()
    
    return profile?.role as UserRole || null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}
