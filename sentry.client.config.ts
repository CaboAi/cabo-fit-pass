// This file configures the initialization of Sentry on the browser/frontend

import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry if DSN is provided
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    debug: false, // Disable debug to avoid bundle errors
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Capture client-side performance metrics  
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      Sentry.replayIntegration(),
      Sentry.browserTracingIntegration(),
    ],
    
    // Configure which URLs to trace
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/your-domain\.com\/api/,
    ],
    
    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive data from error events
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      if (event.request?.headers) {
        // Remove authorization headers
        delete event.request.headers?.Authorization;
        delete event.request.headers?.authorization;
        delete event.request.headers?.Cookie;
        delete event.request.headers?.cookie;
      }
      return event;
    },
    
    // Configure error filtering
    ignoreErrors: [
      // Browser extensions
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      // Network errors
      'NetworkError',
      'Failed to fetch',
    ],
  });
}