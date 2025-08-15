import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/providers/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cabo Fit Pass',
  description: 'Your fitness marketplace in Los Cabos',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cabo Fit Pass',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Cabo Fit Pass',
    title: 'Cabo Fit Pass - Fitness Marketplace in Los Cabos',
    description: 'Your fitness marketplace in Los Cabos',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
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
          <LanguageProvider>
            <AuthProvider session={null}>
              {children}
            </AuthProvider>
          </LanguageProvider>
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