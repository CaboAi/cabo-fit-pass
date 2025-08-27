import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@/lib/supabase/server'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const supabase = createClient()
          
          // Try to sign in with Supabase
          const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !user) {
            // If sign in fails, try to create a new user
            const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
              email: credentials.email,
              password: credentials.password,
            })

            if (signUpError || !newUser) {
              console.error('Sign up error:', signUpError)
              return null
            }

            // Create profile for new user
            await supabase.from('profiles').insert({
              id: newUser.id,
              email: newUser.email,
              credits: 10,
              role: 'user'
            })

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.email?.split('@')[0] || 'User'
            }
          }

          // For existing users, fetch their profile to get role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('email', user.email)
            .single()

          return {
            id: user.id,
            email: user.email,
            name: profile?.full_name || user.email?.split('@')[0] || 'User',
            role: profile?.role || 'user'
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.email = token.email as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  }
}