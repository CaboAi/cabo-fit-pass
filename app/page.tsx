'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15),transparent_60%)]" />

        <header className="flex items-center gap-3 mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-600 rounded-full blur-lg opacity-75"></div>
            <div className="relative bg-gradient-to-r from-orange-400 to-pink-600 text-white p-3 rounded-full">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Cabo Fit Pass
          </h1>
        </header>

        <div className="text-center">
          <h2 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent mb-4">
            One Pass. Endless Classes.
          </h2>
          <p className="text-lg sm:text-xl text-purple-200 max-w-2xl mx-auto mb-10">
            Book premium fitness classes across Los Cabos with flexible credits and access to top studios.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signin">
              <Button className="px-6 py-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90">
                Sign In to Get Started
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="px-6 py-6 rounded-xl border-white/20 text-white hover:bg-white/10">
                Try the Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
