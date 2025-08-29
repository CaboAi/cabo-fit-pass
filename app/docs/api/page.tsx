'use client'

import { useEffect, useRef } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const swaggerUIRef = useRef<any>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-slate-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Cabo Fit Pass API Documentation</h1>
              <p className="text-slate-600 mt-1">Interactive API documentation and testing interface</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Production Ready
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              OpenAPI 3.0
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Next.js 14
            </span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="border-b bg-slate-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <a 
              href="#/Authentication" 
              className="text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => {
                // Scroll to authentication section
                setTimeout(() => {
                  const authSection = document.querySelector('[data-tag="Authentication"]')
                  authSection?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }}
            >
              Authentication
            </a>
            <span className="text-slate-300">•</span>
            <a 
              href="#/Bookings" 
              className="text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => {
                setTimeout(() => {
                  const bookingsSection = document.querySelector('[data-tag="Bookings"]')
                  bookingsSection?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }}
            >
              Bookings
            </a>
            <span className="text-slate-300">•</span>
            <a 
              href="#/Payments" 
              className="text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => {
                setTimeout(() => {
                  const paymentsSection = document.querySelector('[data-tag="Payments"]')
                  paymentsSection?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }}
            >
              Payments
            </a>
            <span className="text-slate-300">•</span>
            <a 
              href="#/Admin" 
              className="text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => {
                setTimeout(() => {
                  const adminSection = document.querySelector('[data-tag="Admin"]')
                  adminSection?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }}
            >
              Admin APIs
            </a>
            <span className="text-slate-300">•</span>
            <a 
              href="#/Health" 
              className="text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => {
                setTimeout(() => {
                  const healthSection = document.querySelector('[data-tag="Health"]')
                  healthSection?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }}
            >
              Health Checks
            </a>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="swagger-wrapper">
        <SwaggerUI
          ref={swaggerUIRef}
          url="/docs/api/openapi.yaml"
          docExpansion="list"
          deepLinking={true}
          displayOperationId={true}
          defaultModelsExpandDepth={2}
          defaultModelExpandDepth={2}
          displayRequestDuration={true}
          tryItOutEnabled={true}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          requestInterceptor={(request: any) => {
            // Add API key or auth headers if needed
            console.log('API Request:', request)
            return request
          }}
          responseInterceptor={(response: any) => {
            // Log API responses for debugging
            console.log('API Response:', response)
            return response
          }}
          onComplete={(system: any) => {
            console.log('Swagger UI loaded successfully')
            
            // Add custom CSS for better styling
            const style = document.createElement('style')
            style.textContent = `
              .swagger-ui .topbar { display: none; }
              .swagger-ui .info { margin: 20px 0; }
              .swagger-ui .info .title { font-size: 2rem; color: #1e293b; }
              .swagger-ui .info .description { font-size: 1rem; line-height: 1.6; }
              .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .swagger-ui .opblock.opblock-post { border-color: #059669; }
              .swagger-ui .opblock.opblock-get { border-color: #2563eb; }
              .swagger-ui .opblock.opblock-put { border-color: #d97706; }
              .swagger-ui .opblock.opblock-delete { border-color: #dc2626; }
              .swagger-ui .opblock-summary { padding: 15px 20px; }
              .swagger-ui .btn.authorize { background-color: #2563eb; border-color: #2563eb; }
              .swagger-ui .btn.authorize:hover { background-color: #1d4ed8; }
            `
            document.head.appendChild(style)
          }}
          plugins={[
            // Custom plugin for enhanced functionality
            {
              statePlugins: {
                spec: {
                  wrapSelectors: {
                    // Add custom selectors if needed
                  }
                }
              }
            }
          ]}
        />
      </div>

      {/* Footer */}
      <div className="border-t bg-slate-50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-600">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <p>
              Built with ❤️ for Los Cabos fitness community
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/your-repo/cabo-fit-pass" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                GitHub
              </a>
              <span className="text-slate-300">•</span>
              <a 
                href="/docs/api/openapi.yaml" 
                target="_blank" 
                className="text-blue-600 hover:text-blue-800"
              >
                Download OpenAPI Spec
              </a>
              <span className="text-slate-300">•</span>
              <a 
                href="/health" 
                target="_blank" 
                className="text-blue-600 hover:text-blue-800"
              >
                API Health
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .swagger-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
        }
        
        @media (max-width: 768px) {
          .swagger-wrapper {
            padding: 0 8px;
          }
        }
        
        /* Custom scrollbar */
        .swagger-ui ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .swagger-ui ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        
        .swagger-ui ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .swagger-ui ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}