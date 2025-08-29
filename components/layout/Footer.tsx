'use client'

import Link from 'next/link'
import { Mail, MapPin, Phone, Shield, FileText, Heart } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Cabo Fit Pass</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Your gateway to the best fitness experiences in Los Cabos. 
                Book classes, track progress, and stay fit in paradise.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Heart className="h-4 w-4 text-red-400" />
              <span className="text-sm">Made with love in Los Cabos</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/pricing" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link 
                  href="/profile" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link 
                  href="/studios" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Partner Studios
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-3">Legal & Support</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  <Shield className="h-3 w-3" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@cabofitpass.com" 
                  className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  <Mail className="h-3 w-3" />
                  Support
                </a>
              </li>
              <li>
                <a 
                  href="tel:+52-624-123-4567" 
                  className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  <Phone className="h-3 w-3" />
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-3">Get In Touch</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-gray-300 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>Los Cabos</p>
                  <p>Baja California Sur, Mexico</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:support@cabofitpass.com" className="hover:text-white transition-colors">
                  support@cabofitpass.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+52-624-123-4567" className="hover:text-white transition-colors">
                  +52 (624) 123-4567
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} Cabo Fit Pass. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <Link 
                href="/terms" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link 
                href="/privacy" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <span className="text-gray-400">
                Powered by Stripe, Supabase & SendGrid
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}