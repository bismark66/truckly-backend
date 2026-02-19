# Truckly API - Quick Reference

## API Modules Overview

This document provides a quick reference to all API endpoints grouped by functional module.

---

## 🔐 Authentication Module

Handles user registration, login, and password management.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| POST | `/auth/change-password` | Change password | ✅ |
| POST | `/auth/reset-password` | Reset password by email | ❌ |

**Key Features:**
- JWT-based authentication
- Role-based access control (ADMIN, CUSTOMER, DRIVER, FLEET_OWNER)
- Password change and reset functionality

---

## 👥 Users Module

Manages user accounts and profiles.

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/users` | Create user | ✅ | ADMIN |
| GET | `/users` | Get all users | ✅ | ALL |
| GET | `/users/:id` | Get user by ID | ✅ | ALL |
| PATCH | `/users/:id` | Update user | ✅ | ALL |
| DELETE | `/users/:id` | Delete user | ✅ | ADMIN |
| GET | `/users/drivers-near-me/:lat/:lng` | Find nearby drivers | ✅ | ALL |

**Key Features:**
- Full CRUD operations for user management
- Geolocation-based driver discovery
- Profile management

---

## 🚗 Drivers Module

Manages driver profiles and information.

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/drivers` | Create driver profile | ✅ | DRIVER |
| GET | `/drivers/profile` | Get current driver profile | ✅ | DRIVER |
| GET | `/drivers` | Get all drivers | ✅ | ADMIN |
| GET | `/drivers/:id` | Get driver by ID | ✅ | ADMIN |
| PATCH | `/drivers/:id` | Update driver | ✅ | DRIVER/ADMIN |
| DELETE | `/drivers/:id` | Delete driver | ✅ | DRIVER/ADMIN |

**Key Features:**
- Driver profile management
- License verification
- Vehicle type assignment
- Real-time location tracking
- Driver verification status

---

## 🏢 Fleets Module

Manages fleet owner profiles and organizations.

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/fleets` | Create fleet profile | ✅ | FLEET_OWNER |
| GET | `/fleets/profile` | Get current fleet profile | ✅ | FLEET_OWNER |
| GET | `/fleets` | Get all fleets | ✅ | ADMIN |
| GET | `/fleets/:id` | Get fleet by ID | ✅ | ADMIN |
| PATCH | `/fleets/:id` | Update fleet | ✅ | FLEET_OWNER/ADMIN |
| DELETE | `/fleets/:id` | Delete fleet | ✅ | FLEET_OWNER/ADMIN |

**Key Features:**
- Fleet company registration
- Company profile management
- Registration number tracking
- Vehicle association

---

## 🚚 Vehicles Module

Manages vehicles within fleets.

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/vehicles` | Add vehicle to fleet | ✅ | FLEET_OWNER |
| GET | `/vehicles` | Get all fleet vehicles | ✅ | FLEET_OWNER |
| GET | `/vehicles/:id` | Get vehicle by ID | ✅ | FLEET_OWNER/ADMIN |
| PATCH | `/vehicles/:id` | Update vehicle | ✅ | FLEET_OWNER/ADMIN |
| DELETE | `/vehicles/:id` | Delete vehicle | ✅ | FLEET_OWNER/ADMIN |

**Key Features:**
- Vehicle registration (license plate tracking)
- Vehicle type and capacity management
- Status tracking (AVAILABLE, IN_USE, MAINTENANCE)
- Driver assignment

**Vehicle Types:**
- TRAILER
- TIPPER_TRUCK
- BUS
- MINING_TRANSPORT
- OTHER

---

## 📦 Bookings Module

Manages trip bookings and orders.

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/bookings` | Create new booking | ✅ | CUSTOMER |
| GET | `/bookings` | Get user's bookings | ✅ | ALL |
| GET | `/bookings/:id` | Get booking by ID | ✅ | ALL |
| PATCH | `/bookings/:id/accept` | Accept booking | ✅ | DRIVER |
| PATCH | `/bookings/:id/status` | Update booking status | ✅ | DRIVER/CUSTOMER |

**Key Features:**
- Immediate and scheduled bookings
- Pickup and dropoff location tracking
- Real-time booking status updates
- Driver assignment
- Price calculation

**Booking Types:**
- IMMEDIATE - Instant booking
- SCHEDULED - Pre-scheduled trip
- LONG_TERM - Extended service

**Booking Status Flow:**
```
PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
                               ↓
                          CANCELLED
```

---

## 💳 Payments Module

Handles payment processing and verification.

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/payments/initiate` | Initiate payment | ✅ | CUSTOMER |
| POST | `/payments/verify` | Verify payment | ❌ | N/A |
| POST | `/payments/webhook` | Payment webhook | ❌ | N/A |
| GET | `/payments` | Get all payments | ✅ | ADMIN |
| GET | `/payments/:id` | Get payment by ID | ✅ | ALL |

**Key Features:**
- Paystack integration
- Payment initiation and verification
- Webhook handling for automatic updates
- Payment history tracking

**Payment Providers:**
- PAYSTACK (Mobile Money, Card)
- MOBILE_MONEY (Direct)

**Payment Status:**
- PENDING - Awaiting payment
- SUCCESS - Payment completed
- FAILED - Payment failed
- REFUNDED - Payment refunded

---

## 📄 Documents Module

Manages document uploads and verification.

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/documents/upload` | Upload document | ✅ | ALL |
| GET | `/documents` | Get user's documents | ✅ | ALL |
| GET | `/documents/:id` | Get document by ID | ✅ | ALL |
| PATCH | `/documents/:id` | Update document | ✅ | ALL |
| DELETE | `/documents/:id` | Delete document | ✅ | ALL |

**Key Features:**
- Multipart file upload
- Document type classification
- Verification status tracking
- Secure file storage

**Document Types:**
- LICENSE - Driver's license
- INSURANCE - Insurance documents
- ID_CARD - National ID card
- OTHER - Other documents

**Supported Formats:** PDF, JPG, PNG (max 5MB)

---

## 💬 Chat & Messaging Module

Real-time messaging between customers and drivers.

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/chat/conversations` | Create/get conversation | ✅ | ALL |
| GET | `/chat/conversations` | Get user conversations | ✅ | ALL |
| GET | `/chat/conversations/:id/messages` | Get conversation messages | ✅ | ALL |
| POST | `/chat/messages` | Send message | ✅ | ALL |

**Key Features:**
- One-to-one messaging
- Real-time message delivery via WebSocket
- Message status tracking (SENT, DELIVERED, READ)
- Conversation history

---

## 🔌 WebSocket Events

Real-time communication for location tracking and chat.

### Location Tracking Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `updateLocation` | Client → Server | Update driver location |
| `trackDriver` | Client → Server | Start tracking driver |
| `driverLocation` | Server → Client | Receive driver location |
| `findDrivers` | Client → Server | Find nearby drivers |
| `goOnline` | Client → Server | Driver goes online |
| `goOffline` | Client → Server | Driver goes offline |
| `setBusy` | Client → Server | Driver sets busy status |

### Chat Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `joinChat` | Client → Server | Join chat room |
| `sendMessage` | Client → Server | Send message |
| `newMessage` | Server → Client | Receive new message |
| `userJoined` | Server → Client | User joined chat |

**Connection URL:** `ws://localhost:3000` (Development)

---

## 📊 API Statistics

### Total Endpoints by Module

| Module | REST Endpoints | WebSocket Events |
|--------|----------------|------------------|
| Authentication | 4 | 0 |
| Users | 6 | 0 |
| Drivers | 6 | 0 |
| Fleets | 6 | 0 |
| Vehicles | 5 | 0 |
| Bookings | 5 | 0 |
| Payments | 5 | 0 |
| Documents | 5 | 0 |
| Chat | 4 | 4 |
| Location Tracking | 0 | 7 |
| **Total** | **46** | **11** |

---

## 🎯 Common Use Cases

### Customer Journey
1. Register/Login → `POST /auth/register` or `/auth/login`
2. Find nearby drivers → `GET /users/drivers-near-me/:lat/:lng`
3. Create booking → `POST /bookings`
4. Track driver → WebSocket `trackDriver`
5. Chat with driver → WebSocket `sendMessage`
6. Make payment → `POST /payments/initiate`
7. Verify payment → `POST /payments/verify`

### Driver Journey
1. Register/Login → `POST /auth/register` or `/auth/login`
2. Create driver profile → `POST /drivers`
3. Upload documents → `POST /documents/upload`
4. Go online → WebSocket `goOnline`
5. Update location → WebSocket `updateLocation`
6. Accept booking → `PATCH /bookings/:id/accept`
7. Update booking status → `PATCH /bookings/:id/status`
8. Chat with customer → WebSocket `sendMessage`

### Fleet Owner Journey
1. Register/Login → `POST /auth/register` or `/auth/login`
2. Create fleet profile → `POST /fleets`
3. Add vehicles → `POST /vehicles`
4. Upload documents → `POST /documents/upload`
5. Manage vehicles → `GET /vehicles`, `PATCH /vehicles/:id`

---

## 🔒 Authentication & Authorization

### Authentication Methods
- JWT Bearer Token (Header: `Authorization: Bearer <token>`)

### Role-Based Access Control

| Role | Access Level |
|------|-------------|
| ADMIN | Full system access |
| CUSTOMER | Create bookings, make payments |
| DRIVER | Accept bookings, update location |
| FLEET_OWNER | Manage fleet and vehicles |

---

## 📝 Notes

1. **Base URL:** `http://localhost:3000` (Development)
2. **Swagger Documentation:** `http://localhost:3000/api`
3. **All authenticated endpoints** require JWT token in Authorization header
4. **WebSocket connection** required for real-time features
5. **Rate limiting** applies to all endpoints (see API_SPECIFICATION.md)
6. **CORS enabled** for development (all origins allowed)

---

## 📖 Full Documentation

For detailed endpoint specifications, request/response formats, and error handling, see:
- [Full API Specification](./API_SPECIFICATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Admin Dashboard Spec](./ADMIN_DASHBOARD_SPEC.md)

---

**Last Updated:** 2026-01-29  
**API Version:** v1
