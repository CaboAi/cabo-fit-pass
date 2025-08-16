import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for Vercel deployment
  output: 'standalone',
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Experimental features removed - appDir is now stable
  
  // Images configuration
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  
  // Disable static optimization for dynamic content
  trailingSlash: false,
  
  // Handle environment variables during build
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

export default withNextIntl(nextConfig);
