// This file configures the initialization of Sentry on the server side

import * as Sentry from '@sentry/nextjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  debug: process.env.NODE_ENV === 'development',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enable profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  integrations: [
    // Add profiling integration
    nodeProfilingIntegration(),
    // Database query tracing
    Sentry.postgresIntegration(),
    // HTTP request tracing
    Sentry.httpIntegration(),
    // GraphQL integration if used
    Sentry.graphqlIntegration(),
  ],
  
  // Configure which URLs to trace
  tracePropagationTargets: [
    /^https:\/\/api\.supabase\.co/,
    /^https:\/\/api\.stripe\.com/,
    /^\/api/,
  ],
  
  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive data from server-side errors
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.request?.headers) {
      // Remove sensitive headers
      delete event.request.headers?.Authorization;
      delete event.request.headers?.authorization;
      delete event.request.headers?.Cookie;
      delete event.request.headers?.cookie;
      delete event.request.headers?.['x-api-key'];
    }
    
    // Remove sensitive data from extra context
    if (event.extra) {
      delete event.extra.password;
      delete event.extra.token;
      delete event.extra.secret;
    }
    
    return event;
  },
  
  // Configure error filtering
  ignoreErrors: [
    // Next.js specific errors
    'ENOTFOUND',
    'ECONNREFUSED',
    // Supabase connection errors (temporary)
    'AuthError',
  ],
  
  // Add custom tags for filtering
  initialScope: {
    tags: {
      service: 'cabo-fit-pass',
      component: 'api',
    },
  },
});