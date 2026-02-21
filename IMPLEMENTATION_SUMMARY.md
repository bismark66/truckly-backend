# Real-Time Driver Allocation System - Implementation Summary

## Overview

Implemented a complete real-time booking allocation system that finds available drivers matching cargo requirements and location, sends simultaneous booking requests to the top 3 drivers via WebSocket + FCM push notifications, handles acceptance/rejection, and automatically times out after 60 seconds.

## Components Implemented

### 1. **Database Changes**

- **Migration**: Added `fcm Token` varchar column to `driver` and `user` tables ([1771288500000-AddFcmTokens.ts](src/database/migrations/1771288500000-AddFcmTokens.ts))
- **Entities Updated**:
  - [Driver entity](src/drivers/entities/driver.entity.ts): Added `fcmToken?: string`
  - [User entity](src/users/entities/user.entity.ts): Added `fcmToken?: string`

### 2. **NotificationsModule** (Push Notifications)

- **[notifications.service.ts](src/notifications/notifications.service.ts)**
  - Firebase Admin SDK initialization
  - `sendBookingRequest()` - Send booking offer to driver
  - `sendBookingCancelled()` - Notify driver booking was cancelled
  - `notifyCustomerBookingAccepted()` - Notify customer driver accepted
  - `notifyCustomerBookingTimeout()` - Notify customer no driver available
  - Token management: `registerDriverToken()`, `registerUserToken()`, `clearDriverToken()`, `clearUserToken()`
- **[notifications.module.ts](src/notifications/notifications.module.ts)** - Module exports

### 3. **BookingStateService** (Redis State Management)

- **[booking-state.service.ts](src/bookings/booking-state.service.ts)**
  - `setPendingDrivers()` - Track drivers notified for a booking
  - `removeDriver()` - Remove driver on rejection
  - `getPendingDrivers()` - Get remaining pending drivers
  - `lockBooking()` - Acquire lock to prevent race conditions
  - `setAllocationStatus()` - Track PENDING/ACCEPTED/TIMEOUT/CANCELLED status
  - `setDriverPendingRequest()` - Track current booking offer for each driver
  - `storeContactedDrivers()` - Analytics/history tracking
  - Auto-expiry of Redis keys (5 min for active, 24 hours for history)

### 4. **BookingAllocationService** (Core Logic)

- **[booking-allocation.service.ts](src/bookings/booking-allocation.service.ts)**
  - `findMatchingDrivers(booking, limit=3)` - Combined geospatial + cargo matching
    - Uses `LocationGateway.findClosestDriver()` for location search
    - Validates each driver's vehicle against cargo requirements via `LogisticsService`
    - Returns top 3 matches ranked by combined score (70% cargo match + 30% distance)
  - `sendBatchRequest(booking, drivers)` - Notify all 3 drivers simultaneously
    - WebSocket emit to `driver_{driverId}` rooms
    - FCM push notification to offline/backgrounded drivers
    - Stores pending state in Redis
    - Schedules 60-second timeout job in BullMQ
  - `handleDriverResponse(bookingId, driverId, accepted)` - Process acceptance/rejection
  - `handleAcceptance()` - Assign booking, cancel other requests, notify customer
    - Redis lock acquisition to prevent race conditions
    - Vehicle validation
    - Cancel pending timeout job
    - Notify other drivers via WebSocket + FCM
  - `handleRejection()` - Remove driver from pending list
    - Triggers early timeout if no drivers remain
  - `handleTimeout()` - Cancel booking after 60s, notify customer

### 5. **BookingGateway** (WebSocket Events)

- **[booking.gateway.ts](src/websockets/booking.gateway.ts)**
  - Extends `BaseGateway` with Redis pub/sub support
  - Redis channel: `booking-events` for multi-instance sync
  - WebSocket events:
    - `joinRoom` - Driver/customer joins their personal room (`driver_{id}` or `customer_{id}`)
    - `acceptBooking` - Driver accepts booking request
    - `rejectBooking` - Driver rejects booking request
    - `bookingRequest` (emitted) - Booking offer sent to driver
    - `bookingCancelled` (emitted) - Booking no longer available
    - `bookingAccepted` (emitted) - Customer notified of acceptance
  - `broadcastBookingUpdate()` - Public method for services to emit updates

### 6. **BookingAllocationProcessor** (BullMQ Worker)

- **[booking-allocation.processor.ts](src/bookings/booking-allocation.processor.ts)**
  - Processes `timeout` jobs after 60 seconds
  - Calls `BookingAllocationService.handleTimeout()`
  - Retry logic and error handling
  - Job lifecycle logging

### 7. **Controller Updates**

#### **BookingsController**

- **[bookings.controller.ts](src/bookings/bookings.controller.ts)**
  - `POST /bookings` - Updated to use new allocation flow:
    1. Create booking
    2. Find top 3 matching drivers
    3. Send batch requests
    4. Return confirmation with driver count
  - Returns user-friendly messages about driver notification status

#### **DriversController**

- **[drivers.controller.ts](src/drivers/drivers.controller.ts)**
  - `PATCH /drivers/me/fcm-token` - Register/update FCM token for push notifications
  - Body: `{ "fcmToken": "..." }`

### 8. **Module Configuration**

#### **app.module.ts**

- **[app.module.ts](src/app.module.ts)**
  - Added `BullModule.forRootAsync()` with Redis connection
  - Added `NotificationsModule` to imports

#### **bookings.module.ts**

- **[bookings.module.ts](src/bookings/bookings.module.ts)**
  - Imports: DriversModule, WebSocketsModule (forwardRef), NotificationsModule, RedisModule
  - Registered `booking-allocation` queue
  - Providers: BookingAllocationService, BookingStateService, Book ingAllocationProcessor
  - Exports: BookingsService, BookingAllocationService

#### **drivers.module.ts**

- **[drivers.module.ts](src/drivers/drivers.module.ts)**
  - Added NotificationsModule import

#### **websockets.module.ts**

- **[websockets.module.ts](src/websockets/websockets.module.ts)**
  - Added BookingGateway provider and export
  - Added BookingsModule import (forwardRef)

#### **gateway.factory.ts**

- **[gateway.factory.ts](src/websockets/gateway.factory.ts)**
  - Registered BookingGateway in gateway array
  - BookingGateway's Redis channel handler added to subscriptions

### 9. **Database Utilities**

- **[clear-database.ts](src/database/scripts/clear-database.ts)** - Script to clear all table data
- **[package.json](package.json)** - Added `db:clear` npm script

## Flow Diagram

```
Customer creates booking
        ↓
BookingAllocationService.findMatchingDrivers()
        ↓
LocationGateway.findClosestDriver() → GEOSEARCH within 10km radius
        ↓
For each nearby ONLINE driver:
    LogisticsService.validateDriverVehicleForBooking()
        ↓
    Rank by: 70% cargo match + 30% distance
        ↓
Select top 3 drivers
        ↓
BookingAllocationService.sendBatchRequest()
        ├─→ WebSocket emit to driver_{id} rooms
        ├─→ FCM push to all 3 drivers
        ├─→ Store pending state in Redis
        └─→ Schedule 60s timeout job in BullMQ
        ↓
┌─────────────────────────────────────────┐
│ Driver responds within 60 seconds:      │
├─────────────────────────────────────────┤
│ Case 1: Driver ACCEPTS                  │
│   → Acquire Redis lock                  │
│   → Validate vehicle                    │
│   → Assign booking                      │
│   → Cancel timeout job                  │
│   → Notify customer (WebSocket + FCM)   │
│   → Cancel other drivers' requests      │
│                                         │
│ Case 2: Driver REJECTS                  │
│   → Remove from pending list            │
│   → If no drivers left → trigger timeout│
│                                         │
│ Case 3: 60s TIMEOUT                     │
│   → Cancel booking                      │
│   → Notify customer (no driver found)   │
│   → Clear all pending requests          │
└─────────────────────────────────────────┘
```

## Redis Data Structures

```
booking:{bookingId}:pending_drivers        SET      Active driver IDs           5 min TTL
booking:{bookingId}:status                 STRING   Allocation status JSON      5 min TTL
booking:{bookingId}:lock                   STRING   Driver ID holding lock      30 sec TTL
driver:{driverId}:pending_request          STRING   Current booking offer       5 min TTL
booking:{bookingId}:contacted_drivers      SET      History of contacted IDs    24 hour TTL
```

## Environment Variables Required

Add to `.env`:

```bash
# Firebase Cloud Messaging (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Driver search settings
DRIVER_SEARCH_RADIUS=10  # kilometers

# Booking timeout
BOOKING_TIMEOUT_SECONDS=60
```

## Dependencies Installed

```json
{
  "@nestjs/bull": "^11.0.4",
  "bullmq": "^5.69.3",
  "firebase-admin": "^13.6.1"
}
```

## Next Steps

### 1. **Run Migration**

Since the database schema already exists but migrations weren't tracked, manually add the FCM token columns:

```sql
ALTER TABLE driver ADD COLUMN IF NOT EXISTS "fcmToken" character varying;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "fcmToken" character varying;
```

### 2. **Firebase Setup**

1. Create Firebase project at https://console.firebase.google.com
2. Generate service account key (Project Settings → Service Accounts → Generate Key)
3. Add credentials to `.env` file
4. Enable FCM in Firebase console

### 3. **Mobile App Integration**

- Register FCM tokens on app login: `PATCH /drivers/me/fcm-token`
- Connect to WebSocket and join room: `socket.emit('joinRoom', { userId, role: 'driver' })`
- Listen for `bookingRequest` events
- Respond with `acceptBooking` or `rejectBooking` events

### 4. **Testing**

```bash
# Start server
npm run start:dev

# Test booking creation (as customer)
POST /bookings
{
  "pickupLocation": { "lat": 5.6, "lng": -0.2, "address": "Accra Mall" },
  "dropoffLocation": { "lat": 5.7, "lng": -0.1, "address": "Kotoka Airport" },
  "type": "IMMEDIATE",
  "cargoRequirements": {
    "type": "GENERAL",
    "weight": 500,
    "volume": 2
  }
}

# Register FCM token (as driver)
PATCH /drivers/me/fcm-token
{ "fcmToken": "device-fcm-token-here" }

# WebSocket connection
const socket = io('http://localhost:3000');
socket.emit('joinRoom', { userId: 'driver-id', role: 'driver' });
socket.on('bookingRequest', (data) => {
  console.log('New booking:', data);
  // Accept: socket.emit('acceptBooking', { bookingId: data.id, driverId: 'driver-id' });
  // Reject: socket.emit('rejectBooking', { bookingId: data.id, driverId: 'driver-id' });
});
```

### 5. **Monitoring & Analytics**

- Track contacted drivers: `BookingStateService.getContactedDrivers(bookingId)`
- Monitor BullMQ dashboard: Install `@bull-board/express` for job visualization
- Log analysis: Search for `[BookingAllocationService]` logs

## Architecture Decisions

### Why Batch (Top 3) Instead of Sequential?

- **Faster responses**: Multiple drivers see request simultaneously
- **Better UX**: Customer gets driver faster
- **Higher acceptance rate**: More chances for match

### Why 60 Seconds Timeout?

- Balance between giving drivers time to respond and customer wait time
- Configurable via environment variable

### Why Redis for State Management?

- Fast read/write for high-frequency updates
- Built-in TTL for automatic cleanup
- Atomic operations for race condition prevention
- Shared state across multiple server instances

### Why BullMQ?

- Reliable delayed job execution for timeouts
- Retry logic for failed operations
- Better than setTimeout (survives server restart)
- Job monitoring and visualization

## Known Limitations

1. **Distance calculation**: Currently uses Redis GEOSEARCH result, not actual road distance
2. **Offline drivers**: FCM notifications work, but delivery not guaranteed
3. **Migration tracking**: Existing schema not tracked in migrations table
4. **Rate limiting**: No protection against spam booking creation
5. **Driver preference**: No mechanism for driver to set availability hours
6. **Booking priority**: All bookings treated equally (no surge/priority pricing)

## Security Considerations

- Firebase private key must be kept secure (.env not committed)
- WebSocket rooms use userId - ensure JWT validation
- Redis should have password authentication in production
- Rate limit booking creation endpoint
- Validate booking data thoroughly before allocation

---

**Status**: ✅ Implementation Complete
**Date**: February 17, 2026
**Next**: Run migration, configure Firebase, test end-to-end flow
