import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'always'
});
 
export const config = {
  // Handle only marketing pages - exclude dashboard, auth, profile, studio routes
  matcher: [
    '/',
    '/((?!api|_next|_vercel|dashboard|auth|profile|studio|studio-management|.*\\..*).*)'
  ]
};
