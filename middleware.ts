import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from './lib/rate-limit';

// Create the i18n middleware
const i18nMiddleware = createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  
  // Apply rate limiting to API routes first
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse; // Return rate limit error response
    }
    // If rate limit passed, continue to next handler
    return NextResponse.next();
  }
  
  // Apply i18n middleware to marketing pages
  const isMarketingPage = pathname === '/' || 
    (pathname.startsWith('/') && 
     !pathname.startsWith('/api') &&
     !pathname.startsWith('/_next') &&
     !pathname.startsWith('/_vercel') &&
     !pathname.startsWith('/dashboard') &&
     !pathname.startsWith('/auth') &&
     !pathname.startsWith('/profile') &&
     !pathname.startsWith('/studio') &&
     !pathname.startsWith('/studio-management') &&
     !pathname.includes('.'));
  
  if (isMarketingPage) {
    return i18nMiddleware(request);
  }
  
  // For other routes, just continue
  return NextResponse.next();
}

export const config = {
  // Apply middleware to both API routes and marketing pages
  matcher: [
    // API routes for rate limiting
    '/api/(.*)',
    // Marketing pages for i18n
    '/',
    '/((?!api|_next|_vercel|dashboard|auth|profile|studio|studio-management|.*\\..*).*)'
  ]
};
