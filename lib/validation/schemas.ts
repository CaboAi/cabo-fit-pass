import { z } from 'zod'

// Booking validation schema
export const bookingSchema = z.object({
  gymId: z.string().uuid('Invalid gym ID format'),
  classId: z.string().uuid('Invalid class ID format'),
  classDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  classTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)')
})

// Gym creation schema
export const gymCreateSchema = z.object({
  name: z.string().min(1, 'Gym name is required').max(100, 'Gym name too long'),
  location: z.string().max(200, 'Location too long').optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number too long').optional().or(z.literal('')),
  description: z.string().max(500, 'Description too long').optional().or(z.literal(''))
})

// Profile update schema
export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional().or(z.literal('')),
  emergency_contact: z.string().max(200, 'Emergency contact too long').optional().or(z.literal(''))
})

// Admin verification schema
export const adminActionSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  resourceType: z.enum(['gym', 'user', 'booking', 'class']),
  resourceId: z.string().uuid('Invalid resource ID').optional()
})

// Stripe webhook validation
export const stripeEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.object({
    object: z.any()
  }),
  created: z.number(),
  livemode: z.boolean()
})

export type BookingInput = z.infer<typeof bookingSchema>
export type GymCreateInput = z.infer<typeof gymCreateSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type AdminActionInput = z.infer<typeof adminActionSchema>
export type StripeEventInput = z.infer<typeof stripeEventSchema>