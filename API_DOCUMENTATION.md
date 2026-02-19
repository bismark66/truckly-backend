# Truckly Backend API Documentation

> **Base URL**: `https://api.truckly.com/v1`  
> **Authentication**: Bearer Token (JWT)  
> **Content-Type**: `application/json`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Management](#2-user-management)
3. [Customer Endpoints](#3-customer-endpoints)
4. [Driver Endpoints](#4-driver-endpoints)
5. [Fleet Owner Endpoints](#5-fleet-owner-endpoints)
6. [Chat \& Messaging](#6-chat--messaging)
7. [Notifications](#7-notifications)
8. [Support](#8-support)
9. [WebSocket Events](#9-websocket-events)
10. [File Uploads](#10-file-uploads)

---

## 1. Authentication

### 1.1 Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com",
  "password": "password123",
  "userType": "customer" | "driver" | "fleet-owner",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "phone": "+233241234567",
      "fullName": "Kwesi Mensah",
      "role": "customer",
      "avatar": "https://...",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 3600
    }
  }
}
```

### 1.2 Google OAuth

```http
POST /auth/google
```

**Request Body:**
```json
{
  "idToken": "google_id_token",
  "userType": "customer" | "driver"
}
```

### 1.3 Refresh Token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### 1.4 Logout

```http
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

### 1.5 Forgot Password

```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com"
}
```

### 1.6 Reset Password

```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newPassword123"
}
```

---

## 2. User Management

### 2.1 Register Customer

```http
POST /users/register/customer
```

**Request Body:**
```json
{
  "fullName": "Kwesi Mensah",
  "phone": "+233241234567",
  "email": "kwesi@example.com",
  "password": "password123",
  "agreeTerms": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "usr_123",
    "email": "kwesi@example.com",
    "role": "customer"
  },
  "message": "Registration successful"
}
```

### 2.2 Register Driver

```http
POST /users/register/driver
```

**Request Body:**
```json
{
  "fullName": "Kofi Driver",
  "phone": "+233241234567",
  "email": "kofi@example.com",
  "password": "password123",
  "vehicle": {
    "make": "Freightliner",
    "model": "Cascadia",
    "year": "2020",
    "vin": "1FUJGHDV8CLBP8834",
    "licensePlate": "GH-1234-20",
    "type": "Flatbed",
    "photoUrl": "https://..."
  },
  "documents": {
    "driversLicense": "file_id_1",
    "vehicleInsurance": "file_id_2",
    "nationalId": "file_id_3"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "drv_123",
    "status": "pending_verification",
    "estimatedVerificationTime": "24-48 hours"
  }
}
```

### 2.3 Register Fleet Owner

```http
POST /users/register/fleet-owner
```

**Request Body:**
```json
{
  "companyName": "Mensah Logistics Ltd",
  "dotNumber": "1234567",
  "mcNumber": "123456",
  "fleetSize": "16-50",
  "vehicleTypes": ["Flatbed", "Box Truck", "Refrigerated"],
  "operatingRegions": ["Greater Accra", "Ashanti", "Nationwide"],
  "monthlyLoads": "51-100",
  "fullName": "Kwame Mensah",
  "email": "kwame@mensahlogistics.com",
  "phone": "+233241234567",
  "password": "password123",
  "documents": {
    "businessLicense": "file_id_1",
    "insuranceCertificate": "file_id_2",
    "dotAuthority": "file_id_3"
  },
  "agreeTerms": true
}
```

### 2.4 Get User Profile

```http
GET /users/profile
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "fullName": "Kwesi Mensah",
    "email": "kwesi@example.com",
    "phone": "+233241234567",
    "avatar": "https://...",
    "role": "customer",
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2.5 Update User Profile

```http
PATCH /users/profile
```

**Request Body:**
```json
{
  "fullName": "Kwesi Mensah Jr",
  "phone": "+233241234567",
  "avatar": "file_id_or_url"
}
```

### 2.6 Change Password

```http
POST /users/change-password
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

---

## 3. Customer Endpoints

### 3.1 Get Dashboard Data

```http
GET /customer/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nearbyDrivers": [
      {
        "id": "drv_1",
        "name": "Kofi Mensah",
        "location": "East Legon",
        "coordinates": { "lat": 5.6515, "lng": -0.187 },
        "truckCount": 12,
        "isLive": true
      }
    ],
    "activeBookings": [
      {
        "id": "TRK-8602-GH",
        "type": "40ft Flatbed Truck",
        "status": "in_transit",
        "origin": "Tema Port",
        "destination": "Spintex Rd",
        "driver": {
          "id": "drv_1",
          "name": "Kofi Mensah",
          "rating": 4.8,
          "avatar": "https://..."
        }
      }
    ]
  }
}
```

### 3.2 Create Booking

```http
POST /customer/bookings
```

**Request Body:**
```json
{
  "pickup": {
    "address": "Spintex Road, Accra",
    "coordinates": { "lat": 5.6515, "lng": -0.187 }
  },
  "dropoff": {
    "address": "Tema Harbor",
    "coordinates": { "lat": 5.67, "lng": -0.02 }
  },
  "vehicleType": "trailer" | "tipper" | "van",
  "scheduledTime": "2024-02-15T14:00:00Z",
  "notes": "Fragile items"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "bkg_123",
    "status": "pending",
    "estimatedFare": "GHS 1250.00",
    "estimatedDistance": "15.2 km",
    "estimatedDuration": "25 mins"
  }
}
```

### 3.3 Get Booking Details

```http
GET /customer/bookings/:bookingId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "bkg_123",
    "status": "in_transit",
    "pickup": {
      "address": "Spintex Road, Accra",
      "coordinates": { "lat": 5.6515, "lng": -0.187 }
    },
    "dropoff": {
      "address": "Tema Harbor",
      "coordinates": { "lat": 5.67, "lng": -0.02 }
    },
    "driver": {
      "id": "drv_1",
      "name": "Kofi Mensah",
      "phone": "+233241234567",
      "avatar": "https://...",
      "rating": 4.8,
      "currentLocation": { "lat": 5.655, "lng": -0.18 }
    },
    "vehicle": {
      "make": "Freightliner",
      "model": "Cascadia",
      "licensePlate": "GH-1234-20",
      "type": "Flatbed"
    },
    "fare": "GHS 1250.00",
    "createdAt": "2024-02-15T14:00:00Z",
    "acceptedAt": "2024-02-15T14:05:00Z",
    "estimatedArrival": "2024-02-15T14:30:00Z"
  }
}
```

### 3.4 Get Booking History

```http
GET /customer/bookings?status=completed&page=1&limit=20
```

**Query Parameters:**
- `status`: `all` | `pending` | `in_transit` | `completed` | `cancelled`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "bkg_123",
        "status": "completed",
        "pickup": "Spintex Road",
        "dropoff": "Tema Harbor",
        "fare": "GHS 1250.00",
        "completedAt": "2024-02-15T15:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### 3.5 Cancel Booking

```http
POST /customer/bookings/:bookingId/cancel
```

**Request Body:**
```json
{
  "reason": "Changed plans"
}
```

### 3.6 Rate Driver

```http
POST /customer/bookings/:bookingId/rate
```

**Request Body:**
```json
{
  "rating": 5,
  "review": "Excellent service!",
  "tips": 20.00
}
```

### 3.7 Get Payment Methods

```http
GET /customer/payment-methods
```

**Response:**
```json
{
  "success": true,
  "data": {
    "methods": [
      {
        "id": "pm_1",
        "type": "momo",
        "provider": "MTN",
        "phoneNumber": "+233241234567",
        "isDefault": true
      },
      {
        "id": "pm_2",
        "type": "card",
        "last4": "4242",
        "brand": "visa",
        "expiryMonth": 12,
        "expiryYear": 2025,
        "isDefault": false
      }
    ]
  }
}
```

### 3.8 Add Payment Method

```http
POST /customer/payment-methods
```

**Request Body (MoMo):**
```json
{
  "type": "momo",
  "provider": "MTN" | "Vodafone" | "AirtelTigo",
  "phoneNumber": "+233241234567"
}
```

**Request Body (Card):**
```json
{
  "type": "card",
  "cardNumber": "4242424242424242",
  "expiryMonth": 12,
  "expiryYear": 2025,
  "cvv": "123",
  "cardholderName": "Kwesi Mensah"
}
```

### 3.9 Set Default Payment Method

```http
PATCH /customer/payment-methods/:methodId/default
```

### 3.10 Delete Payment Method

```http
DELETE /customer/payment-methods/:methodId
```

### 3.11 Get Payment Balance

```http
GET /customer/wallet
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": "GHS 450.00",
    "currency": "GHS",
    "transactions": [
      {
        "id": "txn_1",
        "type": "debit",
        "amount": "GHS 1250.00",
        "description": "Booking payment - TRK-8602-GH",
        "status": "completed",
        "createdAt": "2024-02-15T15:00:00Z"
      }
    ]
  }
}
```

---

## 4. Driver Endpoints

### 4.1 Get Driver Dashboard

```http
GET /driver/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isOnline": true,
    "earnings": {
      "today": "GHS 450.00",
      "thisWeek": "GHS 2100.00",
      "thisMonth": "GHS 8500.00",
      "tripsCompleted": 4
    },
    "pendingBookings": [
      {
        "id": "bkg_1",
        "fare": "GHS 120.00",
        "distance": "5.2 km",
        "pickup": "Tema Harbor, Greater Accra",
        "dropoff": "Kumasi Central Market",
        "customer": {
          "name": "Kofi Mensah",
          "rating": 4.9,
          "isVerified": true,
          "avatar": "https://..."
        }
      }
    ]
  }
}
```

### 4.2 Update Online Status

```http
PATCH /driver/status
```

**Request Body:**
```json
{
  "isOnline": true
}
```

### 4.3 Accept Booking

```http
POST /driver/bookings/:bookingId/accept
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "bkg_123",
    "status": "accepted",
    "customer": {
      "name": "Kofi Mensah",
      "phone": "+233241234567",
      "rating": 4.9
    },
    "pickup": {
      "address": "Tema Harbor",
      "coordinates": { "lat": 5.67, "lng": -0.02 }
    },
    "dropoff": {
      "address": "Kumasi Central Market",
      "coordinates": { "lat": 6.6885, "lng": -1.6244 }
    }
  }
}
```

### 4.4 Reject Booking

```http
POST /driver/bookings/:bookingId/reject
```

**Request Body:**
```json
{
  "reason": "Too far" | "Vehicle not suitable" | "Other"
}
```

### 4.5 Update Trip Status

```http
PATCH /driver/trips/:tripId/status
```

**Request Body:**
```json
{
  "status": "heading_to_pickup" | "arrived_at_pickup" | "in_transit" | "arriving" | "completed"
}
```

### 4.6 Update Driver Location

```http
POST /driver/location
```

**Request Body:**
```json
{
  "latitude": 5.6515,
  "longitude": -0.187,
  "heading": 45,
  "speed": 60
}
```

### 4.7 Complete Trip

```http
POST /driver/trips/:tripId/complete
```

**Request Body:**
```json
{
  "completionNotes": "Delivered successfully",
  "completionPhoto": "file_id"
}
```

### 4.8 Get Trip History

```http
GET /driver/trips?status=completed&page=1&limit=20
```

**Query Parameters:**
- `status`: `all` | `active` | `completed` | `cancelled`
- `page`: Page number
- `limit`: Items per page

### 4.9 Get Earnings Summary

```http
GET /driver/earnings?period=week
```

**Query Parameters:**
- `period`: `today` | `week` | `month` | `year`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": "GHS 2100.00",
    "tripsCompleted": 18,
    "averagePerTrip": "GHS 116.67",
    "breakdown": [
      {
        "date": "2024-02-12",
        "amount": "GHS 450.00",
        "trips": 4
      }
    ]
  }
}
```

### 4.10 Request Payout

```http
POST /driver/payout
```

**Request Body:**
```json
{
  "amount": "GHS 1000.00",
  "method": "momo",
  "phoneNumber": "+233241234567"
}
```

### 4.11 Get Alerts

```http
GET /driver/alerts?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alt_1",
        "type": "new_booking",
        "title": "New booking request",
        "message": "New booking from Tema to Kumasi",
        "priority": "high",
        "isRead": false,
        "createdAt": "2024-02-15T14:00:00Z"
      }
    ]
  }
}
```

---

## 5. Fleet Owner Endpoints

### 5.1 Get Fleet Dashboard

```http
GET /fleet-owner/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "activeShipments": 124,
      "availableDrivers": 42,
      "fuelEfficiency": "7.2 MPG",
      "pendingAlerts": 8
    },
    "vehicles": [
      {
        "id": "veh_1",
        "truckId": "TK-2933",
        "driver": "Robert Taylor",
        "destination": "Miami, FL",
        "loadType": "Refrigerated",
        "eta": "2024-02-15T16:30:00Z",
        "status": "on_time",
        "currentLocation": { "lat": 5.6515, "lng": -0.187 }
      }
    ],
    "recentActivity": [
      {
        "id": "act_1",
        "text": "John Doe arrived at Newark Hub",
        "meta": "Truck #TK-882 · 2 mins ago",
        "type": "success"
      }
    ]
  }
}
```

### 5.2 Get Fleet Vehicles

```http
GET /fleet-owner/vehicles?status=active&page=1&limit=50
```

**Query Parameters:**
- `status`: `all` | `active` | `idle` | `maintenance`

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "veh_1",
        "truckId": "TK-2933",
        "make": "Freightliner",
        "model": "Cascadia",
        "year": 2020,
        "licensePlate": "GH-1234-20",
        "type": "Flatbed",
        "status": "active",
        "driver": {
          "id": "drv_1",
          "name": "Robert Taylor"
        },
        "currentLocation": { "lat": 5.6515, "lng": -0.187 },
        "lastMaintenance": "2024-01-15T00:00:00Z",
        "nextMaintenance": "2024-04-15T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 124
    }
  }
}
```

### 5.3 Get Vehicle Details

```http
GET /fleet-owner/vehicles/:vehicleId
```

### 5.4 Add Vehicle

```http
POST /fleet-owner/vehicles
```

**Request Body:**
```json
{
  "truckId": "TK-3000",
  "make": "Freightliner",
  "model": "Cascadia",
  "year": 2021,
  "licensePlate": "GH-5678-21",
  "type": "Refrigerated",
  "vin": "1FUJGHDV8CLBP8834",
  "documents": {
    "registration": "file_id_1",
    "insurance": "file_id_2"
  }
}
```

### 5.5 Update Vehicle

```http
PATCH /fleet-owner/vehicles/:vehicleId
```

### 5.6 Delete Vehicle

```http
DELETE /fleet-owner/vehicles/:vehicleId
```

### 5.7 Get Drivers

```http
GET /fleet-owner/drivers?status=active&page=1&limit=50
```

### 5.8 Assign Driver to Vehicle

```http
POST /fleet-owner/vehicles/:vehicleId/assign-driver
```

**Request Body:**
```json
{
  "driverId": "drv_123"
}
```

### 5.9 Get Shipments

```http
GET /fleet-owner/shipments?status=active&page=1&limit=50
```

**Query Parameters:**
- `status`: `all` | `pending` | `active` | `completed` | `cancelled`

### 5.10 Create Shipment

```http
POST /fleet-owner/shipments
```

**Request Body:**
```json
{
  "vehicleId": "veh_1",
  "driverId": "drv_1",
  "origin": {
    "address": "Tema Harbor",
    "coordinates": { "lat": 5.67, "lng": -0.02 }
  },
  "destination": {
    "address": "Kumasi Central Market",
    "coordinates": { "lat": 6.6885, "lng": -1.6244 }
  },
  "loadType": "Refrigerated",
  "weight": "15 tons",
  "scheduledPickup": "2024-02-15T08:00:00Z",
  "estimatedDelivery": "2024-02-15T16:00:00Z"
}
```

### 5.11 Get Fleet Analytics

```http
GET /fleet-owner/analytics?period=month
```

**Query Parameters:**
- `period`: `week` | `month` | `quarter` | `year`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": "GHS 125000.00",
    "totalTrips": 456,
    "averageFuelEfficiency": "7.2 MPG",
    "utilizationRate": 85.5,
    "topPerformingDrivers": [
      {
        "driverId": "drv_1",
        "name": "Robert Taylor",
        "tripsCompleted": 45,
        "revenue": "GHS 15000.00"
      }
    ]
  }
}
```

---

## 6. Chat & Messaging

### 6.1 Get Conversations

```http
GET /chat/conversations?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv_1",
        "tripId": "bkg_123",
        "participant": {
          "id": "usr_456",
          "name": "Kofi Mensah",
          "avatar": "https://...",
          "role": "driver"
        },
        "lastMessage": {
          "text": "I'm on my way",
          "timestamp": "2024-02-15T14:30:00Z",
          "isRead": false
        },
        "unreadCount": 2
      }
    ]
  }
}
```

### 6.2 Get Messages

```http
GET /chat/conversations/:conversationId/messages?page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_1",
        "senderId": "usr_123",
        "text": "Are you close?",
        "type": "text",
        "timestamp": "2024-02-15T14:25:00Z",
        "isRead": true
      },
      {
        "id": "msg_2",
        "senderId": "usr_456",
        "text": "I'm on my way",
        "type": "text",
        "timestamp": "2024-02-15T14:30:00Z",
        "isRead": false
      },
      {
        "id": "msg_3",
        "senderId": "usr_456",
        "imageUrl": "https://...",
        "type": "image",
        "timestamp": "2024-02-15T14:31:00Z",
        "isRead": false
      }
    ]
  }
}
```

### 6.3 Send Message

```http
POST /chat/conversations/:conversationId/messages
```

**Request Body (Text):**
```json
{
  "type": "text",
  "text": "Hello, I'm on my way!"
}
```

**Request Body (Image):**
```json
{
  "type": "image",
  "imageUrl": "file_id_or_url",
  "caption": "Here's the delivery"
}
```

### 6.4 Mark Messages as Read

```http
POST /chat/conversations/:conversationId/read
```

**Request Body:**
```json
{
  "messageIds": ["msg_1", "msg_2"]
}
```

---

## 7. Notifications

### 7.1 Get Notifications

```http
GET /notifications?page=1&limit=20&unreadOnly=false
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_1",
        "type": "booking_accepted",
        "title": "Booking Accepted",
        "message": "Your booking has been accepted by Kofi Mensah",
        "data": {
          "bookingId": "bkg_123"
        },
        "isRead": false,
        "createdAt": "2024-02-15T14:00:00Z"
      }
    ],
    "unreadCount": 5
  }
}
```

### 7.2 Mark Notification as Read

```http
PATCH /notifications/:notificationId/read
```

### 7.3 Mark All as Read

```http
POST /notifications/read-all
```

### 7.4 Get Notification Settings

```http
GET /notifications/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "push": {
      "bookingUpdates": true,
      "messages": true,
      "promotions": false
    },
    "email": {
      "bookingUpdates": true,
      "weeklyReports": true,
      "promotions": false
    },
    "sms": {
      "bookingUpdates": true,
      "messages": false
    }
  }
}
```

### 7.5 Update Notification Settings

```http
PATCH /notifications/settings
```

**Request Body:**
```json
{
  "push": {
    "bookingUpdates": true,
    "messages": true
  }
}
```

### 7.6 Subscribe to Push Notifications

```http
POST /notifications/push/subscribe
```

**Request Body:**
```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

### 7.7 Unsubscribe from Push Notifications

```http
POST /notifications/push/unsubscribe
```

**Request Body:**
```json
{
  "endpoint": "https://..."
}
```

---

## 8. Support

### 8.1 Get Support Categories

```http
GET /support/categories
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_1",
        "name": "Booking Help",
        "icon": "truck",
        "articleCount": 12
      },
      {
        "id": "cat_2",
        "name": "Payment Issues",
        "icon": "wallet",
        "articleCount": 8
      }
    ]
  }
}
```

### 8.2 Get FAQs

```http
GET /support/faqs?categoryId=cat_1&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "faqs": [
      {
        "id": "faq_1",
        "question": "How do I book a truck?",
        "answer": "To book a truck, go to the booking page...",
        "categoryId": "cat_1",
        "helpful": 45,
        "notHelpful": 2
      }
    ]
  }
}
```

### 8.3 Search FAQs

```http
GET /support/search?q=payment
```

### 8.4 Create Support Ticket

```http
POST /support/tickets
```

**Request Body:**
```json
{
  "subject": "Payment not processed",
  "category": "payment",
  "description": "My payment was deducted but booking was not confirmed",
  "priority": "high",
  "attachments": ["file_id_1"]
}
```

### 8.5 Get Support Tickets

```http
GET /support/tickets?status=open&page=1&limit=20
```

### 8.6 Get Ticket Messages

```http
GET /support/tickets/:ticketId/messages
```

### 8.7 Reply to Ticket

```http
POST /support/tickets/:ticketId/messages
```

**Request Body:**
```json
{
  "message": "I have attached the screenshot",
  "attachments": ["file_id_1"]
}
```

---

## 9. WebSocket Events

**Connection URL**: `wss://api.truckly.com/ws`

**Authentication**: Send JWT token in connection query parameter:
```
wss://api.truckly.com/ws?token={accessToken}
```

### 9.1 Client → Server Events

#### Join Trip Room
```json
{
  "event": "join_trip",
  "data": {
    "tripId": "bkg_123"
  }
}
```

#### Leave Trip Room
```json
{
  "event": "leave_trip",
  "data": {
    "tripId": "bkg_123"
  }
}
```

#### Send Chat Message
```json
{
  "event": "chat_message",
  "data": {
    "conversationId": "conv_1",
    "text": "Hello!",
    "type": "text"
  }
}
```

#### Update Driver Location (Driver only)
```json
{
  "event": "location_update",
  "data": {
    "tripId": "bkg_123",
    "latitude": 5.6515,
    "longitude": -0.187,
    "heading": 45,
    "speed": 60
  }
}
```

### 9.2 Server → Client Events

#### Trip Status Update
```json
{
  "event": "trip_status_updated",
  "data": {
    "tripId": "bkg_123",
    "status": "in_transit",
    "timestamp": "2024-02-15T14:30:00Z"
  }
}
```

#### Driver Location Update
```json
{
  "event": "driver_location_updated",
  "data": {
    "tripId": "bkg_123",
    "latitude": 5.6515,
    "longitude": -0.187,
    "heading": 45,
    "speed": 60,
    "timestamp": "2024-02-15T14:30:00Z"
  }
}
```

#### New Chat Message
```json
{
  "event": "new_message",
  "data": {
    "conversationId": "conv_1",
    "message": {
      "id": "msg_123",
      "senderId": "usr_456",
      "text": "I'm on my way",
      "type": "text",
      "timestamp": "2024-02-15T14:30:00Z"
    }
  }
}
```

#### New Booking (Driver)
```json
{
  "event": "new_booking",
  "data": {
    "bookingId": "bkg_123",
    "fare": "GHS 120.00",
    "distance": "5.2 km",
    "pickup": "Tema Harbor",
    "dropoff": "Kumasi",
    "customer": {
      "name": "Kofi Mensah",
      "rating": 4.9
    }
  }
}
```

#### Booking Accepted (Customer)
```json
{
  "event": "booking_accepted",
  "data": {
    "bookingId": "bkg_123",
    "driver": {
      "id": "drv_1",
      "name": "Robert Taylor",
      "phone": "+233241234567",
      "rating": 4.8
    }
  }
}
```

---

## 10. File Uploads

### 10.1 Upload File

```http
POST /files/upload
```

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body:**
```
file: [binary file data]
type: "document" | "image" | "avatar"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_abc123",
    "url": "https://cdn.truckly.com/files/abc123.pdf",
    "filename": "drivers_license.pdf",
    "size": 245678,
    "mimeType": "application/pdf"
  }
}
```

### 10.2 Delete File

```http
DELETE /files/:fileId
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Rate Limiting

- **Standard**: 100 requests per minute per user
- **Burst**: 20 requests per second
- **WebSocket**: 50 messages per minute

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1644937200
```

---

## Pagination

All list endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response includes:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Versioning

API version is included in the base URL: `/v1`

Breaking changes will result in a new version: `/v2`

---

*Last Updated: February 12, 2024*
