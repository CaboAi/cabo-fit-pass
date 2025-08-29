import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
 
const withNextIntl = createNextIntlPlugin('./i18n/request.ts'); // Update path
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // For demo/staging only. Do NOT use in production long-term.
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'cabo-fit-pass.vercel.app', 'cabofitpass.com'],
    },
  },
  // Security Headers - Critical for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://static.cloudflareinsights.com",
              "connect-src 'self' https://api.stripe.com https://*.supabase.co https://cloudflareinsights.com https://*.sentry.io",
              "img-src 'self' https://*.supabase.co https://*.stripe.com data: blob:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)'
          }
        ]
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Add webpack config to handle Supabase realtime warning
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};
 
// Apply next-intl plugin first, then Sentry
const configWithIntl = withNextIntl(nextConfig);

// Sentry configuration
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Suppress logs during build
  silent: true,
  
  // Upload source maps only in production
  include: process.env.NODE_ENV === 'production' ? '.next' : undefined,
  
  // Don't upload source maps in development
  dryRun: process.env.NODE_ENV !== 'production',
  
  // Additional webpack plugin options
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: '/monitoring/tunnel',
  hideSourceMaps: true,
  disableLogger: true,
};

export default withSentryConfig(configWithIntl, sentryWebpackPluginOptions);
