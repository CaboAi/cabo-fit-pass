// This file configures the initialization of Sentry for edge runtime (middleware, edge functions)

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  debug: process.env.NODE_ENV === 'development',
  
  // Lower sampling rates for edge runtime due to constraints
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  // Configure which URLs to trace
  tracePropagationTargets: [
    /^\/api/,
  ],
  
  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive data from edge runtime errors
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.request?.headers) {
      delete event.request.headers?.Authorization;
      delete event.request.headers?.authorization;
      delete event.request.headers?.Cookie;
      delete event.request.headers?.cookie;
    }
    return event;
  },
  
  // Add custom tags
  initialScope: {
    tags: {
      service: 'cabo-fit-pass',
      component: 'edge',
    },
  },
});