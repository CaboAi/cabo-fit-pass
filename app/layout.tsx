import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/providers/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cabo Fit Pass',
  description: 'Your fitness marketplace in Los Cabos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider session={null}>
            {children}
          </AuthProvider>
          <Toaster 
            position="top-right"
            richColors
            closeButton
          />
        </ErrorBoundary>
      </body>
    </html>
  )
}
