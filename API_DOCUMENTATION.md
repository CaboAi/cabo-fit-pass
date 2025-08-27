# 📚 Cabo Fit Pass API Documentation

## Overview

The Cabo Fit Pass API provides a comprehensive REST interface for fitness class booking, user management, and payment processing in Los Cabos, Mexico.

## 🚀 Quick Start

### Base URLs
- **Production**: `https://cabofitpass.com/api`
- **Development**: `http://localhost:3000/api`

### Authentication
Most endpoints require authentication via NextAuth.js session cookies or JWT bearer tokens.

### Rate Limits
- **Anonymous**: 30 requests/minute
- **Authenticated**: 100 requests/minute  
- **Premium**: 200 requests/minute
- **Admin**: 500 requests/minute

---

## 🎯 Core Endpoints

### 🔐 Authentication
```bash
# Login
POST /api/auth/signin

# Logout  
POST /api/auth/signout

# Session status
GET /api/auth/session
```

### 👤 User Profile
```bash
# Get user profile
GET /api/profile
Authorization: Required

# Update profile
PUT /api/profile
Authorization: Required
Content-Type: application/json
{
  "full_name": "John Doe",
  "phone": "+52 624 123 4567"
}
```

### 🏋️ Classes
```bash
# List all classes
GET /api/classes
# Returns: Array of Class objects with schedule and availability

# Example Response:
{
  "classes": [
    {
      "id": "uuid",
      "title": "Morning Yoga", 
      "instructor": "Maria Lopez",
      "start_time": "2024-12-01T08:00:00Z",
      "capacity": 20,
      "price": 15.00
    }
  ]
}
```

### 📅 Bookings
```bash
# Create booking (CRITICAL BUSINESS ENDPOINT)
POST /api/bookings/create
Authorization: Required
Content-Type: application/json
{
  "gymId": "uuid",
  "classId": "uuid", 
  "classDate": "2024-12-01",
  "classTime": "08:00"
}

# Cancel booking
DELETE /api/bookings/{id}/cancel
Authorization: Required

# Get user bookings
GET /api/bookings
Authorization: Required
```

### 💳 Credits System
```bash
# Get credit balance
GET /api/credits
Authorization: Required

# Purchase credits
POST /api/credits/topup
Authorization: Required
Content-Type: application/json
{
  "tier": "basic",
  "amount": 10
}

# Credit breakdown
GET /api/credits/breakdown
Authorization: Required
```

---

## 🔧 Admin Endpoints

### 🏢 Gym Management
```bash
# List all gyms
GET /api/admin/gyms
Authorization: Admin Required

# Create gym
POST /api/admin/gyms
Authorization: Admin Required
Content-Type: application/json
{
  "name": "Cabo Fitness Center",
  "location": "Downtown Cabo",
  "email": "gym@example.com"
}

# Get gym details
GET /api/admin/gyms/{id}
Authorization: Admin Required

# Delete gym
DELETE /api/admin/gyms/{id}
Authorization: Admin Required
```

### 💰 Payout Management
```bash
# Get payout snapshots
GET /api/admin/payout-snapshots
Authorization: Admin Required

# Generate payout report
POST /api/admin/payout-snapshots
Authorization: Admin Required
```

---

## ⚡ System Endpoints

### 🏥 Health Checks
```bash
# System health (public)
GET /api/health
# Returns: Database, Redis, Stripe connectivity status

# Readiness probe (public)
GET /api/health/ready
# Returns: 200 if ready for traffic, 503 if not

# Liveness probe (public)  
GET /api/health/live
# Returns: 200 if alive, 503 if should restart
```

---

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": ["Validation error 1", "Validation error 2"],
  "code": "VALIDATION_ERROR"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🔒 Security Features

### Input Validation
All endpoints use Zod schemas for request validation:
- UUID format validation
- Email format validation  
- Date/time format validation
- String length limits

### Rate Limiting
Implemented with upstash/ratelimit:
- IP-based limits for anonymous users
- User-based limits for authenticated users
- Sliding window algorithm

### Authentication
- NextAuth.js session management
- JWT token support
- Role-based access control (user/admin)

---

## 🚀 Performance Features

### Caching
Redis-based caching implemented for:
- User profiles (5 min TTL)
- Class listings (1 min TTL)  
- Credit balances (30 sec TTL)

### Database Optimization
- Optimized indexes for common queries
- Atomic transactions for bookings
- Race condition prevention

---

## 💻 Code Examples

### JavaScript/Node.js
```javascript
// Book a class
const response = await fetch('/api/bookings/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    gymId: 'gym-uuid',
    classId: 'class-uuid', 
    classDate: '2024-12-01',
    classTime: '08:00'
  })
})

const booking = await response.json()
```

### Python
```python
import requests

# Get user profile
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('https://cabofitpass.com/api/profile', headers=headers)
profile = response.json()
```

### cURL
```bash
# Create booking
curl -X POST https://cabofitpass.com/api/bookings/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "gymId": "uuid",
    "classId": "uuid",
    "classDate": "2024-12-01", 
    "classTime": "08:00"
  }'
```

---

## 🔍 Interactive Documentation

Visit `/admin/api-docs` for the interactive Swagger UI with:
- Live API testing
- Request/response examples
- Schema documentation
- Authentication testing

---

## 📞 Support

- **Documentation**: Visit `/admin/api-docs`
- **Email**: support@cabofitpass.com
- **Status Page**: Check `/api/health` for system status

---

## 📝 Changelog

### Version 1.0.0
- Initial API release
- Authentication system
- Booking management
- Credit system
- Admin operations
- Health monitoring
- Rate limiting
- Redis caching