'use client'

import { SessionProvider, SessionProviderProps } from 'next-auth/react'

interface AuthProviderProps {
  children: React.ReactNode
  session?: SessionProviderProps['session']
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
