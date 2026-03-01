# Truckly API Specification

## Overview

This document provides comprehensive API specifications for the Truckly freight logistics platform, organized by functional modules.

**Base URL:** `http://localhost:3000` (Development)  
**Production URL:** `https://api.truckly.com` (To be configured)  
**API Version:** v1  
**Documentation:** `/api` (Swagger UI)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Drivers](#3-drivers)
4. [Fleets](#4-fleets)
5. [Vehicles](#5-vehicles)
6. [Bookings](#6-bookings)
7. [Payments](#7-payments)
8. [Documents](#8-documents)
9. [Chat & Messaging](#9-chat--messaging)
10. [WebSocket Events](#10-websocket-events)
11. [Common Types & Enums](#11-common-types--enums)
12. [Error Responses](#12-error-responses)
13. [Rate Limiting](#13-rate-limiting)

---

## Authentication

All authenticated endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### JWT Token Structure

```json
{
  "email": "user@example.com",
  "sub": "user-uuid",
  "userType": "CUSTOMER",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### User Roles

- `ADMIN` - Full system access
- `CUSTOMER` - Can create bookings
- `DRIVER` - Can accept and manage bookings
- `FLEET_OWNER` - Can manage fleet and vehicles

---

## 1. Authentication

### 1.1 Register User

Create a new user account.

**Endpoint:** `POST /auth/register`  
**Authentication:** None  
**Rate Limit:** 10 requests/hour per IP

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+233244123456",
  "userType": "CUSTOMER"
}
```

**Field Validations:**
- `email`: Valid email format, unique
- `password`: Minimum 6 characters
- `firstName`: Required, max 100 characters
- `lastName`: Required, max 100 characters
- `phoneNumber`: Optional, Ghana format preferred
- `userType`: Enum - `ADMIN`, `CUSTOMER`, `DRIVER`, `FLEET_OWNER` (default: `CUSTOMER`)

**Success Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+233244123456",
  "userType": "CUSTOMER",
  "createdAt": "2026-01-29T01:50:15.000Z",
  "updatedAt": "2026-01-29T01:50:15.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input or email already exists
- `422 Unprocessable Entity`: Validation errors

---

### 1.2 Login

Authenticate user and receive JWT token.

**Endpoint:** `POST /auth/login`  
**Authentication:** None  
**Rate Limit:** 20 requests/hour per IP

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Missing email or password

---

### 1.3 Change Password

Change password for authenticated user (requires current password).

**Endpoint:** `POST /auth/change-password`  
**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Success Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Current password incorrect or not authenticated
- `400 Bad Request`: Validation errors

---

### 1.4 Reset Password

Reset password by email (no authentication required).

**Endpoint:** `POST /auth/reset-password`  
**Authentication:** None  
**Rate Limit:** 5 requests/hour per IP

> ⚠️ **Security Note:** This is a simplified implementation. Production should use email verification with time-limited tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "newPassword": "newPassword456"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400 Bad Request`: User not found

---

## 2. Users

### 2.1 Create User

Create a new user (Admin only).

**Endpoint:** `POST /users`  
**Authentication:** Required (Admin)

**Request Body:** Same as registration

**Success Response (201):** User object

---

### 2.2 Get All Users

Retrieve all users.

**Endpoint:** `GET /users`  
**Authentication:** Required

**Success Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+233244123456",
    "userType": "CUSTOMER",
    "createdAt": "2026-01-29T01:50:15.000Z",
    "updatedAt": "2026-01-29T01:50:15.000Z"
  }
]
```

---

### 2.3 Get User by ID

Retrieve specific user details.

**Endpoint:** `GET /users/:id`  
**Authentication:** Required

**URL Parameters:**
- `id` (UUID): User ID

**Success Response (200):** User object

**Error Responses:**
- `404 Not Found`: User not found

---

### 2.4 Update User

Update user information.

**Endpoint:** `PATCH /users/:id`  
**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "Jane",
  "phoneNumber": "+233244999888"
}
```

**Success Response (200):** Updated user object

---

### 2.5 Delete User

Delete user account.

**Endpoint:** `DELETE /users/:id`  
**Authentication:** Required (Admin or self)

**Success Response (200):**
```json
{
  "deleted": true
}
```

---

### 2.6 Find Nearby Drivers

Find drivers within radius of given coordinates.

**Endpoint:** `GET /users/drivers-near-me/:lat/:lng`  
**Authentication:** Required

**URL Parameters:**
- `lat` (float): Latitude
- `lng` (float): Longitude

**Query Parameters:**
- `radius` (optional): Search radius in km (default: 10)

**Success Response (200):**
```json
[
  {
    "driverId": "driver-uuid",
    "distance": 2.5,
    "driver": {
      "id": "driver-uuid",
      "licenseNumber": "GH-123456",
      "vehicleType": "TIPPER_TRUCK",
      "isVerified": true,
      "user": {
        "firstName": "Kwame",
        "lastName": "Mensah",
        "phoneNumber": "+233244123456"
      }
    }
  }
]
```

---

## 3. Drivers

### 3.1 Create Driver Profile

Create driver profile for authenticated user.

**Endpoint:** `POST /drivers`  
**Authentication:** Required (DRIVER role)

**Request Body:**
```json
{
  "licenseNumber": "GH-123456",
  "vehicleType": "TIPPER_TRUCK"
}
```

**Field Validations:**
- `licenseNumber`: Required, unique
- `vehicleType`: Enum - `TRAILER`, `TIPPER_TRUCK`, `BUS`, `MINING_TRANSPORT`, `OTHER`

**Success Response (201):**
```json
{
  "id": "driver-uuid",
  "userId": "user-uuid",
  "licenseNumber": "GH-123456",
  "vehicleType": "TIPPER_TRUCK",
  "currentLatitude": null,
  "currentLongitude": null,
  "lastSeenAt": null,
  "isVerified": false,
  "createdAt": "2026-01-29T01:50:15.000Z",
  "updatedAt": "2026-01-29T01:50:15.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Driver profile already exists for this user

---

### 3.2 Get Driver Profile

Get current authenticated driver's profile.

**Endpoint:** `GET /drivers/profile`  
**Authentication:** Required (DRIVER role)

**Success Response (200):** Driver object with user details

---

### 3.3 Get All Drivers

Get all drivers (Admin only).

**Endpoint:** `GET /drivers`  
**Authentication:** Required (ADMIN role)  
**Caching:** 5 minutes

**Success Response (200):** Array of driver objects

---

### 3.4 Get Driver by ID

Get specific driver details.

**Endpoint:** `GET /drivers/:id`  
**Authentication:** Required (ADMIN role)

**URL Parameters:**
- `id` (UUID): Driver ID

**Success Response (200):** Driver object

---

### 3.5 Update Driver

Update driver information.

**Endpoint:** `PATCH /drivers/:id`  
**Authentication:** Required

**Request Body:**
```json
{
  "vehicleType": "TRAILER",
  "currentLatitude": 5.6037,
  "currentLongitude": -0.187
}
```

**Success Response (200):** Updated driver object

---

### 3.6 Delete Driver

Delete driver profile.

**Endpoint:** `DELETE /drivers/:id`  
**Authentication:** Required

**Success Response (200):** Deletion confirmation

---

## 4. Fleets

### 4.1 Create Fleet

Create fleet profile for authenticated fleet owner.

**Endpoint:** `POST /fleets`  
**Authentication:** Required (FLEET_OWNER role)

**Request Body:**
```json
{
  "companyName": "Accra Transport Ltd",
  "registrationNumber": "BN-12345678"
}
```

**Success Response (201):**
```json
{
  "id": "fleet-uuid",
  "userId": "user-uuid",
  "companyName": "Accra Transport Ltd",
  "registrationNumber": "BN-12345678",
  "createdAt": "2026-01-29T01:50:15.000Z",
  "updatedAt": "2026-01-29T01:50:15.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Fleet already exists for this user

---

### 4.2 Get Fleet Profile

Get current authenticated fleet owner's profile.

**Endpoint:** `GET /fleets/profile`  
**Authentication:** Required (FLEET_OWNER role)

**Success Response (200):** Fleet object with vehicles

---

### 4.3 Get All Fleets

Get all fleets (Admin only).

**Endpoint:** `GET /fleets`  
**Authentication:** Required (ADMIN role)

**Success Response (200):** Array of fleet objects

---

### 4.4 Get Fleet by ID

Get specific fleet details.

**Endpoint:** `GET /fleets/:id`  
**Authentication:** Required (ADMIN role)

**Success Response (200):** Fleet object

---

### 4.5 Update Fleet

Update fleet information.

**Endpoint:** `PATCH /fleets/:id`  
**Authentication:** Required

**Success Response (200):** Updated fleet object

---

### 4.6 Delete Fleet

Delete fleet profile.

**Endpoint:** `DELETE /fleets/:id`  
**Authentication:** Required

**Success Response (200):** Deletion confirmation

---

## 5. Vehicles

### 5.1 Add Vehicle

Add vehicle to fleet.

**Endpoint:** `POST /vehicles`  
**Authentication:** Required (FLEET_OWNER role)

**Request Body:**
```json
{
  "licensePlate": "GR-1234-20",
  "type": "TIPPER_TRUCK",
  "capacity": 15.5,
  "status": "AVAILABLE"
}
```

**Field Validations:**
- `licensePlate`: Required, unique
- `type`: Enum - `TRAILER`, `TIPPER_TRUCK`, `BUS`, `MINING_TRANSPORT`, `OTHER`
- `capacity`: Optional, float (tons or seats)
- `status`: Enum - `AVAILABLE`, `IN_USE`, `MAINTENANCE` (default: `AVAILABLE`)

**Success Response (201):**
```json
{
  "id": "vehicle-uuid",
  "fleetId": "fleet-uuid",
  "licensePlate": "GR-1234-20",
  "type": "TIPPER_TRUCK",
  "capacity": 15.5,
  "status": "AVAILABLE",
  "assignedDriverId": null,
  "createdAt": "2026-01-29T01:50:15.000Z",
  "updatedAt": "2026-01-29T01:50:15.000Z"
}
```

---

### 5.2 Get All Vehicles

Get all vehicles in fleet.

**Endpoint:** `GET /vehicles`  
**Authentication:** Required (FLEET_OWNER role)

**Success Response (200):** Array of vehicle objects for current fleet owner

---

### 5.3 Get Vehicle by ID

Get specific vehicle details.

**Endpoint:** `GET /vehicles/:id`  
**Authentication:** Required (FLEET_OWNER or ADMIN role)

**Success Response (200):** Vehicle object

---

### 5.4 Update Vehicle

Update vehicle information.

**Endpoint:** `PATCH /vehicles/:id`  
**Authentication:** Required

**Request Body:**
```json
{
  "status": "MAINTENANCE",
  "assignedDriverId": "driver-uuid"
}
```

**Success Response (200):** Updated vehicle object

---

### 5.5 Delete Vehicle

Remove vehicle from fleet.

**Endpoint:** `DELETE /vehicles/:id`  
**Authentication:** Required

**Success Response (200):** Deletion confirmation

---

## 6. Bookings

### 6.1 Create Booking

Create new trip booking.

**Endpoint:** `POST /bookings`  
**Authentication:** Required (CUSTOMER role)

**Request Body:**
```json
{
  "pickupLocation": {
    "lat": 5.6037,
    "lng": -0.187,
    "address": "123 Independence Ave, Accra"
  },
  "dropoffLocation": {
    "lat": 5.6500,
    "lng": -0.200,
    "address": "456 Tema Station Rd, Tema"
  },
  "type": "IMMEDIATE",
  "scheduledTime": null
}
```

**Field Validations:**
- `pickupLocation`: Required object with `lat`, `lng`, `address`
- `dropoffLocation`: Required object with `lat`, `lng`, `address`
- `type`: Enum - `IMMEDIATE`, `SCHEDULED`, `LONG_TERM` (default: `IMMEDIATE`)
- `scheduledTime`: Required if type is `SCHEDULED`, ISO 8601 format

**Success Response (201):**
```json
{
  "id": "booking-uuid",
  "customerId": "user-uuid",
  "driverId": null,
  "vehicleId": null,
  "pickupLocation": {
    "lat": 5.6037,
    "lng": -0.187,
    "address": "123 Independence Ave, Accra"
  },
  "dropoffLocation": {
    "lat": 5.6500,
    "lng": -0.200,
    "address": "456 Tema Station Rd, Tema"
  },
  "status": "PENDING",
  "type": "IMMEDIATE",
  "price": null,
  "scheduledTime": null,
  "createdAt": "2026-01-29T01:50:15.000Z",
  "updatedAt": "2026-01-29T01:50:15.000Z"
}
```

---

### 6.2 Get All Bookings

Get bookings for current user.

**Endpoint:** `GET /bookings`  
**Authentication:** Required

**Behavior:**
- **CUSTOMER**: Returns all bookings created by customer
- **DRIVER**: Returns all bookings (available or assigned)
- **ADMIN**: Returns all bookings

**Success Response (200):** Array of booking objects

---

### 6.3 Get Booking by ID

Get specific booking details.

**Endpoint:** `GET /bookings/:id`  
**Authentication:** Required

**Success Response (200):**
```json
{
  "id": "booking-uuid",
  "customerId": "user-uuid",
  "driverId": "driver-uuid",
  "vehicleId": "vehicle-uuid",
  "pickupLocation": {...},
  "dropoffLocation": {...},
  "status": "IN_PROGRESS",
  "type": "IMMEDIATE",
  "price": 250.00,
  "scheduledTime": null,
  "customer": {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+233244123456"
  },
  "driver": {
    "licenseNumber": "GH-123456",
    "user": {
      "firstName": "Kwame",
      "lastName": "Mensah"
    }
  },
  "vehicle": {
    "licensePlate": "GR-1234-20",
    "type": "TIPPER_TRUCK"
  },
  "createdAt": "2026-01-29T01:50:15.000Z",
  "updatedAt": "2026-01-29T01:50:15.000Z"
}
```

---

### 6.4 Accept Booking

Driver accepts a booking.

**Endpoint:** `PATCH /bookings/:id/accept`  
**Authentication:** Required (DRIVER role)

**Success Response (200):**
```json
{
  "message": "Driver acceptance logic requires DriversService integration"
}
```

> ⚠️ **Note:** This endpoint requires additional implementation to resolve driverId from userId.

---

### 6.5 Update Booking Status

Update booking status.

**Endpoint:** `PATCH /bookings/:id/status`  
**Authentication:** Required

**Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Status Values:**
- `PENDING`: Waiting for driver
- `ACCEPTED`: Driver accepted
- `IN_PROGRESS`: Trip in progress
- `COMPLETED`: Trip completed
- `CANCELLED`: Booking cancelled

**Success Response (200):** Updated booking object

---

## 7. Payments

### 7.1 Initiate Payment

Initiate payment for booking.

**Endpoint:** `POST /payments/initiate`  
**Authentication:** Required

**Request Body:**
```json
{
  "bookingId": "booking-uuid",
  "amount": 250.00
}
```

**Success Response (201):**
```json
{
  "id": "payment-uuid",
  "bookingId": "booking-uuid",
  "amount": 250.00,
  "status": "PENDING",
  "reference": "PAY-1234567890",
  "provider": "PAYSTACK",
  "authorizationUrl": "https://checkout.paystack.com/...",
  "createdAt": "2026-01-29T01:50:15.000Z"
}
```

---

### 7.2 Verify Payment

Verify payment status.

**Endpoint:** `POST /payments/verify`  
**Authentication:** None (can be called by webhook)

**Request Body:**
```json
{
  "reference": "PAY-1234567890"
}
```

**Success Response (200):**
```json
{
  "id": "payment-uuid",
  "bookingId": "booking-uuid",
  "amount": 250.00,
  "status": "SUCCESS",
  "reference": "PAY-1234567890",
  "provider": "PAYSTACK",
  "verifiedAt": "2026-01-29T01:55:15.000Z"
}
```

---

### 7.3 Payment Webhook

Receive payment notifications from Paystack.

**Endpoint:** `POST /payments/webhook`  
**Authentication:** None (verified by Paystack signature)

**Request Body:** Paystack webhook payload

**Success Response (200):**
```json
{
  "status": "success"
}
```

---

### 7.4 Get All Payments

Get all payments (Admin only).

**Endpoint:** `GET /payments`  
**Authentication:** Required

**Success Response (200):** Array of payment objects

---

### 7.5 Get Payment by ID

Get specific payment details.

**Endpoint:** `GET /payments/:id`  
**Authentication:** Required

**Success Response (200):** Payment object

---

## 8. Documents

### 8.1 Upload Document

Upload document (license, insurance, ID card).

**Endpoint:** `POST /documents/upload`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File (PDF, JPG, PNG - max 5MB)
- `type`: Enum - `LICENSE`, `INSURANCE`, `ID_CARD`, `OTHER`

**Success Response (201):**
```json
{
  "id": "document-uuid",
  "userId": "user-uuid",
  "type": "LICENSE",
  "url": "/uploads/documents/license-123456.pdf",
  "isVerified": false,
  "createdAt": "2026-01-29T01:50:15.000Z",
  "updatedAt": "2026-01-29T01:50:15.000Z"
}
```

---

### 8.2 Get All Documents

Get all documents for current user.

**Endpoint:** `GET /documents`  
**Authentication:** Required

**Success Response (200):** Array of document objects

---

### 8.3 Get Document by ID

Get specific document details.

**Endpoint:** `GET /documents/:id`  
**Authentication:** Required

**Success Response (200):** Document object

---

### 8.4 Update Document

Update document information.

**Endpoint:** `PATCH /documents/:id`  
**Authentication:** Required

**Request Body:**
```json
{
  "isVerified": true
}
```

**Success Response (200):** Updated document object

---

### 8.5 Delete Document

Delete document.

**Endpoint:** `DELETE /documents/:id`  
**Authentication:** Required

**Success Response (200):** Deletion confirmation

---

## 9. Chat & Messaging

### 9.1 Get or Create Conversation

Get existing conversation or create new one between customer and driver.

**Endpoint:** `POST /chat/conversations`  
**Authentication:** Required

**Request Body:**
```json
{
  "customerId": "user-uuid",
  "driverId": "driver-uuid"
}
```

**Success Response (200/201):**
```json
{
  "id": "conversation-uuid",
  "customerId": "user-uuid",
  "driverId": "driver-uuid",
  "createdAt": "2026-01-29T01:50:15.000Z",
  "updatedAt": "2026-01-29T01:50:15.000Z"
}
```

---

### 9.2 Get User Conversations

Get all conversations for authenticated user.

**Endpoint:** `GET /chat/conversations`  
**Authentication:** Required

**Success Response (200):** Array of conversation objects with last message

---

### 9.3 Get Conversation Messages

Get all messages in a conversation.

**Endpoint:** `GET /chat/conversations/:id/messages`  
**Authentication:** Required

**Success Response (200):**
```json
[
  {
    "id": "message-uuid",
    "conversationId": "conversation-uuid",
    "senderId": "user-uuid",
    "senderType": "CUSTOMER",
    "content": "Hello, where are you?",
    "status": "DELIVERED",
    "sentAt": "2026-01-29T01:50:15.000Z"
  }
]
```

---

### 9.4 Send Message

Send message in conversation (Use WebSocket for real-time).

**Endpoint:** `POST /chat/messages`  
**Authentication:** Required

**Request Body:**
```json
{
  "conversationId": "conversation-uuid",
  "content": "I'm 5 minutes away"
}
```

**Success Response (201):** Message object

---

## 10. WebSocket Events

Connect to WebSocket server at: `ws://localhost:3000` (or production URL)

### 9.1 Location Tracking

#### Update Driver Location

**Event:** `updateLocation`  
**Direction:** Client → Server  
**Authentication:** Required

**Payload:**
```json
{
  "driverId": "driver-uuid",
  "lat": 5.6037,
  "lng": -0.187
}
```

**Server Response:** Location stored in Redis and broadcasted

---

#### Track Driver

**Event:** `trackDriver`  
**Direction:** Client → Server  
**Authentication:** Required

**Payload:**
```json
{
  "driverId": "driver-uuid"
}
```

**Effect:** Client joins tracking room for driver

---

#### Receive Driver Location

**Event:** `driverLocation`  
**Direction:** Server → Client  
**Authentication:** N/A

**Payload:**
```json
{
  "driverId": "driver-uuid",
  "lat": 5.6037,
  "lng": -0.187,
  "timestamp": "2026-01-29T01:50:15.000Z"
}
```

---

#### Find Nearby Drivers

**Event:** `findDrivers`  
**Direction:** Client → Server  
**Authentication:** Required

**Payload:**
```json
{
  "lat": 5.6037,
  "lng": -0.187,
  "radius": 10
}
```

**Server Response:**
```json
{
  "drivers": [
    {
      "driverId": "driver-uuid",
      "distance": 2.5
    }
  ]
}
```

---

### 9.2 Chat

#### Send Message

**Event:** `sendMessage`  
**Direction:** Client → Server  
**Authentication:** Required

**Payload:**
```json
{
  "roomId": "booking-uuid",
  "message": "Hello, I'm on my way!",
  "senderId": "user-uuid"
}
```

---

#### Join Chat Room

**Event:** `joinRoom`  
**Direction:** Client → Server  
**Authentication:** Required

**Payload:**
```json
{
  "roomId": "booking-uuid"
}
```

---

#### Receive Message

**Event:** `message`  
**Direction:** Server → Client  
**Authentication:** N/A

**Payload:**
```json
{
  "roomId": "booking-uuid",
  "message": "Hello, I'm on my way!",
  "senderId": "user-uuid",
  "senderName": "Kwame Mensah",
  "timestamp": "2026-01-29T01:50:15.000Z"
}
```

---

### 10.3 Driver Status Management

#### Go Online

**Event:** `goOnline`  
**Direction:** Client → Server  
**Authentication:** Required

**Payload:**
```json
{
  "driverId": "driver-uuid"
}
```

**Server Response:**
```json
{
  "event": "statusChanged",
  "data": {
    "status": "ONLINE"
  }
}
```

---

#### Go Offline

**Event:** `goOffline`  
**Direction:** Client → Server  
**Authentication:** Required

**Payload:**
```json
{
  "driverId": "driver-uuid"
}
```

**Server Response:**
```json
{
  "event": "statusChanged",
  "data": {
    "status": "OFFLINE"
  }
}
```

---

#### Set Busy Status

**Event:** `setBusy`  
**Direction:** Client → Server  
**Authentication:** Required

**Payload:**
```json
{
  "driverId": "driver-uuid"
}
```

**Server Response:**
```json
{
  "event": "statusChanged",
  "data": {
    "status": "BUSY"
  }
}
```

---

## 11. Common Types & Enums

### User Types
```typescript
enum UserType {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  FLEET_OWNER = 'FLEET_OWNER'
}
```

### Vehicle Types
```typescript
enum VehicleType {
  TRAILER = 'TRAILER',
  TIPPER_TRUCK = 'TIPPER_TRUCK',
  BUS = 'BUS',
  MINING_TRANSPORT = 'MINING_TRANSPORT',
  OTHER = 'OTHER'
}
```

### Vehicle Status
```typescript
enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE'
}
```

### Booking Types
```typescript
enum BookingType {
  IMMEDIATE = 'IMMEDIATE',
  SCHEDULED = 'SCHEDULED',
  LONG_TERM = 'LONG_TERM'
}
```

### Booking Status
```typescript
enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
```

### Driver Status
```typescript
enum DriverStatus {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  BUSY = 'BUSY'
}
```

### Payment Status
```typescript
enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}
```

### Payment Provider
```typescript
enum PaymentProvider {
  PAYSTACK = 'PAYSTACK',
  MOBILE_MONEY = 'MOBILE_MONEY'
}
```

### Document Types
```typescript
enum DocumentType {
  LICENSE = 'LICENSE',
  INSURANCE = 'INSURANCE',
  ID_CARD = 'ID_CARD',
  OTHER = 'OTHER'
}
```

### Message Sender Type
```typescript
enum SenderType {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER'
}
```

### Message Status
```typescript
enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ'
}
```

### Location Object
```typescript
interface Location {
  lat: number;    // Latitude
  lng: number;    // Longitude
  address: string; // Human-readable address
}
```

---

## 12. Error Responses

### Standard Error Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 13. Rate Limiting

### Current Limits (Development)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/register` | 10 requests | 1 hour |
| `POST /auth/login` | 20 requests | 1 hour |
| `POST /auth/reset-password` | 5 requests | 1 hour |
| All other endpoints | 100 requests | 15 minutes |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## 14. Pagination

For endpoints returning lists, use query parameters:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (e.g., `createdAt`)
- `order`: Sort order (`asc` or `desc`)

**Example:**
```
GET /bookings?page=2&limit=10&sort=createdAt&order=desc
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 10,
    "totalPages": 15
  }
}
```

> ⚠️ **Note:** Pagination is not yet implemented in all endpoints.

---

## 15. Testing

### Swagger UI

Access interactive API documentation at:
```
http://localhost:3000/api
```

### Postman Collection

Import the Postman collection (to be created) for easy testing.

### Example cURL Requests

**Register:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "userType": "CUSTOMER"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get Users (with auth):**
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 16. Versioning

Current API version: **v1**

Future versions will be accessible via:
```
http://localhost:3000/v2/...
```

---

## 17. CORS Configuration

**Allowed Origins:** `*` (Development)  
**Allowed Methods:** `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`  
**Allowed Headers:** `Content-Type`, `Authorization`  
**Credentials:** Enabled

> ⚠️ **Production:** Configure specific allowed origins.

---

## 18. Security Best Practices

1. **Always use HTTPS** in production
2. **Store JWT tokens** securely (httpOnly cookies or secure storage)
3. **Validate all inputs** on client and server
4. **Never expose sensitive data** in responses
5. **Implement rate limiting** to prevent abuse
6. **Use strong passwords** (min 8 characters, mixed case, numbers, symbols)
7. **Enable CORS** only for trusted domains
8. **Sanitize file uploads** to prevent malicious files

---

## 19. Changelog

### Version 1.0.0 (2026-01-29)
- Initial API release
- Authentication endpoints
- User management
- Driver, Fleet, Vehicle management
- Booking system
- Payment integration (Paystack)
- Document upload
- WebSocket support for real-time features

---

## Support

For API support, contact:
- **Email:** support@truckly.com
- **Documentation:** https://docs.truckly.com
- **Status Page:** https://status.truckly.com
