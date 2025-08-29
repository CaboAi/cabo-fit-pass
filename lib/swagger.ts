import { createSwaggerSpec } from 'next-swagger-doc'

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Cabo Fit Pass API',
        version: '1.0.0',
        description: 'Production API for Cabo Fit Pass - Fitness booking platform for Los Cabos',
        contact: {
          name: 'Cabo Fit Pass',
          url: 'https://cabofitpass.com',
          email: 'support@cabofitpass.com'
        }
      },
      servers: [
        {
          url: 'https://cabofitpass.com/api',
          description: 'Production server'
        },
        {
          url: 'http://localhost:3000/api',
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          sessionAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'next-auth.session-token'
          }
        },
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'email' },
              email: { type: 'string', format: 'email' },
              full_name: { type: 'string' },
              credits: { type: 'integer', minimum: 0 },
              tier: { type: 'string', enum: ['basic', 'premium', 'unlimited'] },
              created_at: { type: 'string', format: 'date-time' }
            }
          },
          Class: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              gym_id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              instructor: { type: 'string' },
              difficulty: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
              start_time: { type: 'string', format: 'date-time' },
              end_time: { type: 'string', format: 'date-time' },
              capacity: { type: 'integer', minimum: 1 },
              price: { type: 'number', format: 'decimal', minimum: 0 }
            }
          },
          Booking: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              user_id: { type: 'string', format: 'email' },
              class_id: { type: 'string', format: 'uuid' },
              type: { type: 'string', enum: ['drop-in', 'credit', 'subscription'] },
              payment_status: { type: 'string', enum: ['paid', 'pending', 'failed'] },
              booking_date: { type: 'string', format: 'date-time' },
              created_at: { type: 'string', format: 'date-time' }
            }
          },
          Gym: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              location: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              stripe_connect_id: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' }
            }
          },
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'array', items: { type: 'string' } },
              code: { type: 'string' }
            }
          },
          Success: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'object' }
            }
          }
        },
        responses: {
          '400': {
            description: 'Bad Request - Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized - Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Insufficient permissions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '429': {
            description: 'Too Many Requests - Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      tags: [
        { name: 'Authentication', description: 'User authentication endpoints' },
        { name: 'Classes', description: 'Fitness class management' },
        { name: 'Bookings', description: 'Class booking system' },
        { name: 'Profile', description: 'User profile management' },
        { name: 'Credits', description: 'Credit system management' },
        { name: 'Admin', description: 'Administrative operations (admin only)' },
        { name: 'Health', description: 'System health and monitoring' }
      ]
    }
  })

  return spec
}