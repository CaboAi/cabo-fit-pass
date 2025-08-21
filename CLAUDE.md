# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cabo Fit Pass is a production-ready fitness booking platform built for the Los Cabos market. It features a credit-based booking system, Supabase backend, and responsive UI built with Next.js 14.

## Development Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint linting

# Testing (when implemented)
npm test             # Run tests
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: NextAuth.js with Supabase integration
- **Styling**: Tailwind CSS with Shadcn UI components
- **Type Safety**: TypeScript with strict mode enabled

### Key Configuration
- **Shadcn UI**: Uses "new-york" style with Lucide icons
- **Tailwind**: CSS-in-JS variables with custom color scheme
- **Next.js**: Standalone output for deployment, app directory enabled

### Project Structure
```
app/
├── auth/            # Authentication pages (signin, signup, callback)
├── dashboard/       # Main dashboard with class listings
├── layout.tsx       # Root layout with AuthProvider
└── page.tsx         # Landing page

components/
├── ui/              # Shadcn UI components (button, card, input, etc.)
├── fitness/         # Fitness-specific components (ClassCard)
├── CreditDisplay.tsx # Credit management component
└── SupabaseTest.tsx # Database connection testing

lib/
├── supabase.ts      # Supabase client and database functions
├── utils.ts         # Utility functions
└── env-check.ts     # Environment validation

providers/
└── AuthProvider.tsx # NextAuth session provider

supabase/migrations/
└── 001_initial_schema.sql # Database schema with RLS policies
```

## Database Schema

The database uses Row Level Security (RLS) with the following tables:
- **profiles**: User accounts with credits and subscription tiers
- **studios**: Fitness studios with location data
- **classes**: Fitness classes with scheduling and pricing
- **bookings**: User class reservations

Key relationships:
- Users can book classes through the bookings table
- Classes belong to studios and have instructors (from profiles)
- Credit-based system for class bookings

## Environment Variables

Required environment variables (see `env.example`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional for NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Key Functions

### Database Operations (`lib/supabase.ts`)
- `getAllClasses()`: Fetch all fitness classes
- `createBooking()`: Create new class booking
- `testConnection()`: Test database connectivity
- `getClasses()`: Get classes with specific fields

### Authentication Flow
- Uses NextAuth.js with SessionProvider
- Redirects unauthenticated users to `/auth/signin`
- Protected dashboard route with session validation

## Development Guidelines

### Supabase Integration
- Always handle database errors gracefully with try/catch
- Use typed interfaces for database entities (Class, Booking)
- Test database connections during development
- Follow RLS policies for secure data access

### Component Architecture
- Use Shadcn UI components for consistency
- Keep business logic in custom hooks or utilities
- Use TypeScript interfaces for props and data structures
- Follow Next.js 14 app directory conventions

### State Management
- Use React hooks for local state
- Session management through NextAuth
- Consider adding global state management for complex features

### Error Handling
- Implement proper error boundaries
- Handle network failures gracefully
- Provide user-friendly error messages
- Log errors for debugging

## Deployment

### Vercel Deployment
1. Set up environment variables in Vercel dashboard
2. Configure Supabase project with production settings
3. Enable RLS policies and test with production data
4. Monitor deployment through Vercel dashboard

### Database Migrations
- Run migrations in Supabase dashboard or CLI
- Test schema changes in development first
- Ensure RLS policies are correctly configured

## Current Implementation Status

The project includes:
- ✅ Basic authentication setup
- ✅ Database schema with migrations
- ✅ Credit-based booking system (mock data)
- ✅ Responsive dashboard UI
- ✅ Supabase integration setup

Areas for enhancement:
- [ ] Real-time class updates
- [ ] Payment processing integration
- [ ] Instructor dashboard
- [ ] Studio management features
- [ ] Mobile app compatibility
- [ ] Comprehensive testing suite

## Local Development Notes

- The dashboard currently uses mock data for classes
- Environment debugging is enabled in dashboard (remove for production)
- Supabase connection testing components are available for troubleshooting
- Credit system is currently client-side only (needs server-side validation)