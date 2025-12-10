# Truckly Admin Dashboard Specification

> **Version:** 1.0  
> **Last Updated:** December 5, 2024  
> **Purpose:** Comprehensive specification for the Truckly Admin Dashboard interface

---

## Table of Contents

1. [Overview](#overview)
2. [Dashboard Pages](#dashboard-pages)
3. [Navigation Structure](#navigation-structure)
4. [Design Guidelines](#design-guidelines)
5. [Implementation Phases](#implementation-phases)

---

## Overview

The Truckly Admin Dashboard is a comprehensive management interface for overseeing all aspects of the freight logistics platform. This dashboard provides administrators with real-time insights, operational controls, and analytical tools to efficiently manage bookings, drivers, fleets, payments, and system operations.

### Key Objectives

- **Real-time Monitoring**: Live tracking of active bookings and driver locations
- **Operational Efficiency**: Streamlined workflows for managing bookings, drivers, and fleets
- **Financial Oversight**: Comprehensive payment tracking and revenue analytics
- **Data-Driven Decisions**: Business intelligence and performance metrics
- **User Management**: Efficient onboarding and verification processes

---

## Dashboard Pages

### 1. Overview Dashboard (Home)

**Purpose:** Provide a high-level snapshot of the platform's current state and key performance indicators.

#### Primary KPIs

Display as prominent cards at the top of the dashboard:

- **Total Active Bookings** - Real-time count of bookings in progress
- **Revenue Metrics** - Today, This Week, This Month comparisons
- **Active Drivers** - Count of drivers currently ONLINE
- **Pending Verifications** - Number of drivers and documents awaiting approval
- **Fleet Utilization Rate** - Percentage of vehicles IN_USE vs AVAILABLE

#### Visual Components

**Revenue Trend Chart**
- Type: Line graph
- Time periods: Daily, Weekly, Monthly (toggle)
- Shows revenue trends with period-over-period comparison
- Highlight peak periods

**Booking Status Breakdown**
- Type: Pie chart or donut chart
- Segments: Pending, Accepted, In Progress, Completed, Cancelled
- Click to filter booking list

**Driver Status Distribution**
- Type: Donut chart
- Segments: Online, Offline, On Trip
- Real-time updates via WebSocket

**Recent Activity Feed**
- Latest 10-15 activities
- Types: New bookings, completed trips, new registrations, payments received
- Timestamp and quick action buttons

**Geographic Heat Map**
- Interactive map of Ghana
- Shows concentration of active trips
- Uses booking pickup/dropoff location data
- Color intensity indicates activity level

#### API Endpoints Needed

```
GET /api/admin/dashboard/kpis
GET /api/admin/dashboard/revenue-trends?period=week
GET /api/admin/dashboard/booking-status
GET /api/admin/dashboard/driver-status
GET /api/admin/dashboard/recent-activity?limit=15
GET /api/admin/dashboard/activity-heatmap
```

---

### 2. Bookings Management

**Purpose:** Comprehensive interface for monitoring and managing all bookings across the platform.

#### Main Table View

**Table Columns:**
- Booking ID (clickable)
- Customer Name
- Driver Name (or "Unassigned")
- Vehicle Type & Plate
- Status Badge (color-coded)
- Booking Type (Immediate, Scheduled, Long-term)
- Price (GHS)
- Created Date/Time
- Actions (dropdown menu)

**Quick Actions:**
- View Full Details
- Track Live (if IN_PROGRESS)
- Assign/Reassign Driver
- Contact Customer
- Contact Driver
- Cancel Booking
- View Payment

#### Advanced Filters

- **Status**: Multi-select (Pending, Accepted, In Progress, Completed, Cancelled)
- **Booking Type**: Immediate, Scheduled, Long-term
- **Date Range**: From/To date picker
- **Price Range**: Min/Max slider
- **Vehicle Type**: Trailer, Tipper Truck, Bus, Mining Transport, Other
- **Search**: Booking ID, Customer name, Driver name

#### Bulk Operations

- Export selected to CSV/Excel
- Assign drivers in bulk
- Cancel multiple bookings
- Generate reports

#### Live Tracking Panel

**Features:**
- Toggle to show/hide
- Interactive map showing all IN_PROGRESS bookings
- Route visualization (pickup to dropoff)
- Driver location markers (updated via WebSocket)
- ETA calculations
- Click marker to see booking details

#### Booking Detail View (Modal/Full Page)

**Customer Information:**
- Name, email, phone number
- Total bookings count
- Account status
- Quick contact buttons (call, SMS, email)

**Driver Information:**
- Name, photo, license number
- Current status
- Rating (if available)
- Quick contact buttons

**Trip Details:**
- Pickup location (map marker + address)
- Dropoff location (map marker + address)
- Route visualization
- Distance calculation
- Scheduled time (if applicable)
- Actual pickup time
- Estimated delivery time

**Vehicle Details:**
- Type, license plate, capacity
- Fleet owner (if applicable)

**Payment Information:**
- Amount, status, payment reference
- Provider (Paystack)
- Payment date/time

**Trip Timeline:**
Visual timeline showing:
1. Booking Created
2. Driver Assigned
3. Driver En Route to Pickup
4. Pickup Completed
5. In Transit
6. Delivered
7. Payment Completed

**Communication History:**
- Messages between customer and driver
- Admin notes
- System notifications

#### API Endpoints Needed

```
GET /api/admin/bookings?page=1&limit=50&status=PENDING&type=IMMEDIATE
GET /api/admin/bookings/:id
GET /api/admin/bookings/live-tracking
POST /api/admin/bookings/:id/assign-driver
PUT /api/admin/bookings/:id/cancel
POST /api/admin/bookings/export
GET /api/admin/bookings/:id/timeline
```

---

### 3. Driver Management

**Purpose:** Manage driver accounts, verifications, assignments, and performance tracking.

#### Driver Grid View

**Display Format:** Card-based grid or table view (toggle option)

**Card Information:**
- Profile picture placeholder
- Driver name
- Status badge (Online/Offline/On Trip) - color-coded
- Vehicle type icon
- License number
- Verification status (Verified/Pending)
- Rating (stars)
- Quick actions dropdown

**Filters & Search:**
- Status: Online, Offline, On Trip, All
- Vehicle Type: All types
- Verification Status: Verified, Unverified, Pending
- Location: By region/city
- Search: Name, license number, phone

**Sort Options:**
- Name (A-Z, Z-A)
- Status
- Rating (highest first)
- Total trips (most active first)
- Registration date

#### Map View Toggle

- Switch from grid to map view
- Shows all online drivers as markers
- Marker color indicates status (green=online, blue=on trip)
- Click marker for quick info popup
- Useful for dispatch decisions

#### Driver Profile Page

**Personal Information:**
- Full name, email, phone
- Profile photo
- User ID, Driver ID
- Registration date
- Account status

**License & Vehicle Information:**
- License number
- Vehicle type
- Verification status with date
- Uploaded license document (viewable)
- Verify/Reject buttons

**Performance Statistics:**
- Total trips completed
- Average rating (if rating system exists)
- Total earnings (lifetime)
- Completion rate (%)
- Average trip duration
- Cancellation rate
- Online hours this month

**Vehicle Assignments:**
- Current vehicle (if assigned)
- Fleet association (if applicable)
- Assignment history

**Booking History:**
- Table of all bookings
- Filter by status, date range
- Export capability
- Average trip value

**Documents Section:**
- List of uploaded documents (License, ID, Insurance, Other)
- Document status: Pending, Verified, Rejected
- Upload new document button
- View/download documents
- Approve/reject with reason field

**Activity Logs:**
- Login/logout times
- Online hours per day (last 30 days)
- Location history (route maps)
- Status changes

**Location History:**
- Map showing routes traveled in last 30 days
- Daily distance covered
- Most frequent routes

**Admin Actions:**
- Suspend/Activate account
- Reset password
- Send notification
- Add internal notes
- Verify/reject documents
- Assign to fleet

#### Verification Queue

**Purpose:** Dedicated section for reviewing unverified drivers

**Features:**
- List of all unverified drivers
- Sort by: Upload date (oldest first), Document type
- Side-by-side view layout:
  - Left: Driver information
  - Right: Document preview (PDF, image viewer)
- Quick approve/reject buttons
- Rejection reason dropdown + custom text
- Bulk verification tools
- Email notification on approval/rejection

#### API Endpoints Needed

```
GET /api/admin/drivers?page=1&limit=50&status=ONLINE&verified=true
GET /api/admin/drivers/:id
GET /api/admin/drivers/:id/statistics
GET /api/admin/drivers/:id/bookings
GET /api/admin/drivers/:id/documents
GET /api/admin/drivers/map-locations
PUT /api/admin/drivers/:id/verify
PUT /api/admin/drivers/:id/suspend
POST /api/admin/drivers/:id/notes
GET /api/admin/drivers/verification-queue
```

---

### 4. Fleet Management

**Purpose:** Manage fleet companies, their vehicles, and overall fleet performance.

#### Fleet Overview (Grid View)

**Fleet Cards Display:**
- Company name
- Fleet owner name
- Registration number
- Total vehicles count
- Active vehicles (currently IN_USE)
- This month's total bookings
- This month's revenue contribution
- Status indicator

**Filters:**
- Active/Inactive fleets
- Vehicle count range
- Revenue range
- Registration status

**Sort Options:**
- Name (A-Z)
- Total vehicles (most first)
- Revenue (highest first)
- Registration date

#### Fleet Detail Page

**Company Information:**
- Company name
- Registration number
- Fleet owner details (linked to User)
- Contact information
- Registration date
- Total vehicles
- Active status

**Vehicle Grid:**
Display all vehicles belonging to this fleet

**Columns:**
- License plate
- Vehicle type
- Capacity
- Status badge (Available, In Use, Maintenance)
- Assigned driver
- Current booking (if IN_USE)
- Actions dropdown

**Performance Metrics:**
- Fleet utilization rate (%)
  - Formula: (Total hours vehicles IN_USE / Total fleet hours available) × 100
- Average vehicle downtime
- Total trips completed this month
- Total revenue generated this month
- Average trip value
- Customer satisfaction

**Revenue Analytics:**
- Monthly revenue chart (last 12 months)
- Revenue breakdown by vehicle type
- Revenue per vehicle comparison
- Payment status summary

**Booking History:**
- All bookings using this fleet's vehicles
- Filter by date, status, vehicle
- Export functionality

**Fleet Actions:**
- Add new vehicle
- Edit fleet information
- Suspend/activate fleet
- Generate fleet report
- Contact fleet owner

#### API Endpoints Needed

```
GET /api/admin/fleets?page=1&limit=50
GET /api/admin/fleets/:id
GET /api/admin/fleets/:id/vehicles
GET /api/admin/fleets/:id/statistics
GET /api/admin/fleets/:id/revenue-analytics
GET /api/admin/fleets/:id/bookings
PUT /api/admin/fleets/:id
POST /api/admin/fleets/:id/vehicles
```

---

### 5. Vehicle Management

**Purpose:** Comprehensive vehicle inventory management and utilization tracking.

#### Vehicle Inventory (Grid/Table View)

**Table Columns:**
- License Plate
- Vehicle Type (with icon)
- Capacity (tons/seats)
- Fleet Owner (company name, if applicable)
- Status (Available, In Use, Maintenance) - color-coded
- Assigned Driver (name or "Unassigned")
- Utilization % (this month)
- Last Service Date (future feature placeholder)
- Actions

**Filters:**
- Status: Available, In Use, Maintenance, All
- Vehicle Type: All types
- Fleet: All fleets or specific fleet
- Capacity range
- Utilization range

**Quick Actions:**
- View vehicle details
- Assign/reassign driver
- Mark as maintenance
- Mark as available
- View booking history
- Generate vehicle report

#### Capacity Planning Dashboard

**Features:**
- Chart showing vehicle availability by type for next 7 days
- Helps predict if fleet can handle scheduled bookings
- Highlights potential capacity shortages
- Recommendations for vehicle acquisition

**Visual:**
- Stacked bar chart: Days (x-axis) vs Vehicle count (y-axis)
- Colors: Available (green), Scheduled (yellow), Maintenance (red)

#### Vehicle Profile Page

**Basic Information:**
- License plate
- Vehicle type
- Capacity
- Fleet owner (linked)
- Registration/addition date

**Current Assignment:**
- Assigned driver (if any) with link
- Current booking (if status is IN_USE)
- Current location (if active)

**Usage Statistics:**
- Total trips completed
- Total distance traveled (future feature)
- Utilization rate
  - Formula: (Days vehicle was IN_USE / Total days) × 100
- Average trip duration
- Revenue generated (lifetime, this year, this month)

**Trip History:**
- Table of all bookings using this vehicle
- Filters: Date range, status
- Export functionality

**Maintenance Schedule (Placeholder):**
- Last service date
- Next service due
- Maintenance history
- Service reminders

**Vehicle Actions:**
- Edit vehicle details
- Change assignment
- Update status
- Remove from fleet
- Generate vehicle report

#### API Endpoints Needed

```
GET /api/admin/vehicles?page=1&limit=50&status=AVAILABLE
GET /api/admin/vehicles/:id
GET /api/admin/vehicles/:id/statistics
GET /api/admin/vehicles/:id/bookings
GET /api/admin/vehicles/capacity-planning?days=7
PUT /api/admin/vehicles/:id/assign-driver
PUT /api/admin/vehicles/:id/status
```

---

### 6. Customer Management

**Purpose:** Manage customer accounts and analyze customer behavior.

#### Customer Table View

**Columns:**
- Customer Name
- Email
- Phone Number
- Registration Date
- Total Bookings
- Lifetime Value (GHS) - total amount spent
- Last Booking Date
- Status (Active/Inactive)
- Actions

**Filters:**
- Status: Active, Inactive, All
- Registration date range
- Lifetime value range
- Booking count range
- Search: Name, email, phone

**Active/Inactive Logic:**
- Active: Booked in last 30 days
- Inactive: No bookings in last 30 days

#### Customer Profile Page

**Personal Information:**
- Full name
- Email address
- Phone number
- User ID
- Registration date
- Account status

**Booking Statistics:**
- Total bookings
- Completed bookings
- Cancelled bookings
- Cancellation rate (%)
- Average booking value (GHS)
- Lifetime value (GHS)
- First booking date
- Last booking date

**Booking History:**
- Table with all customer bookings
- Filters: Status, date range, vehicle type
- Export functionality
- Quick links to booking details

**Payment History:**
- All payments made
- Payment method preferences
- Failed payment count
- Total amount paid

**Behavioral Analytics:**
- Preferred vehicle types (pie chart)
- Most frequent routes (top 5)
- Booking time patterns (time of day, day of week)
- Average time between bookings

**Customer Actions:**
- Send notification/email
- Suspend/activate account
- Reset password
- Add internal notes
- Issue refund (if applicable)

#### API Endpoints Needed

```
GET /api/admin/customers?page=1&limit=50&status=active
GET /api/admin/customers/:id
GET /api/admin/customers/:id/statistics
GET /api/admin/customers/:id/bookings
GET /api/admin/customers/:id/payments
GET /api/admin/customers/:id/analytics
PUT /api/admin/customers/:id/suspend
```

---

### 7. Payments & Financial Dashboard

**Purpose:** Comprehensive financial oversight and payment tracking.

#### Financial Overview

**Revenue Cards (Top Row):**
- **Today's Revenue**
  - Amount (GHS)
  - Percentage change vs yesterday
  - Transaction count
- **This Week's Revenue**
  - Amount (GHS)
  - Percentage change vs last week
  - Average per day
- **This Month's Revenue**
  - Amount (GHS)
  - Percentage change vs last month
  - Target progress (if targets set)
- **All-Time Revenue**
  - Total amount (GHS)
  - Total transactions

**Additional Financial Metrics:**
- Pending Payments Amount (sum of all PENDING)
- Failed Payments Count & Amount
- Average Transaction Value
- Commission Earned (if platform takes commission)

#### Payment Status Breakdown

**Visual:** Donut chart showing:
- Success (green)
- Pending (yellow)
- Failed (red)

**Breakdown:**
- Count and total amount for each status
- Click to filter payment table

#### Revenue Chart

**Features:**
- Line or bar chart
- Toggle views: Daily, Weekly, Monthly
- Time period selector (last 7 days, last 30 days, last 12 months, custom range)
- Comparison to previous period (overlay or separate line)
- Export chart data

#### Top Revenue Sources

**Three Sections:**
1. **By Fleet** - Top 5 fleets by revenue
2. **By Driver** - Top 10 drivers by earnings
3. **By Route** - Top 10 most profitable routes (pickup-dropoff pairs)

Each showing:
- Name/Description
- Revenue amount
- Transaction count
- Percentage of total revenue

#### Payment Transactions Table

**Columns:**
- Payment ID
- Booking ID (linked)
- Customer Name
- Amount (GHS)
- Status Badge
- Provider (Paystack)
- Reference Number
- Date/Time
- Actions

**Filters:**
- Status: Success, Pending, Failed, All
- Date range
- Amount range
- Payment provider
- Search by: Payment ID, booking ID, reference, customer name

**Export Options:**
- CSV, Excel, PDF
- Filtered results or all data
- Include summary statistics

#### Reconciliation Tools

**Features:**
- Match payments with bank deposits
- Flag discrepancies
- Manual reconciliation interface
- Reconciliation reports

#### Financial Reports Section

**Pre-built Reports:**
1. **Commission Report**
   - If platform charges commission on bookings
   - Breakdown by fleet, driver, time period
   - Total commission earned

2. **Driver Earnings Report**
   - Earnings by driver
   - Payout status (if platform handles payouts)
   - Date range selector
   - Export for payout processing

3. **Fleet Owner Payouts**
   - Similar to driver earnings
   - Grouped by fleet
   - Commission deduction calculations

4. **Tax Reports**
   - VAT calculations (if applicable in Ghana)
   - Income breakdown
   - Exportable for accounting software

5. **Monthly Financial Summary**
   - Revenue, expenses (if tracked)
   - Net profit
   - Growth metrics
   - PDF generation

#### API Endpoints Needed

```
GET /api/admin/financials/overview
GET /api/admin/financials/revenue-chart?period=month&from=2024-01-01
GET /api/admin/financials/top-sources
GET /api/admin/payments?page=1&limit=50&status=SUCCESS
GET /api/admin/payments/:id
POST /api/admin/financials/export-report
GET /api/admin/financials/commission-report?month=2024-12
GET /api/admin/financials/driver-earnings?from=2024-12-01&to=2024-12-31
```

---

### 8. Analytics & Insights

**Purpose:** Business intelligence and performance analysis to drive data-informed decisions.

#### Business Intelligence Dashboard

**Popular Routes Analysis:**
- **Heat Map:** Visual representation on Ghana map
- **Table View:** 
  - Route (pickup → dropoff)
  - Booking count
  - Total revenue
  - Average price
  - Most used vehicle type
- Insights for strategic fleet positioning

**Peak Hours Analysis:**
- **Bar Chart:** Bookings by hour of day (0-23)
- **Heatmap:** Day of week vs hour of day
- Helps optimize driver availability
- Insights for surge pricing (future feature)

**Vehicle Type Demand Trends:**
- **Line Chart:** Bookings per vehicle type over time
- Shows seasonal trends
- Helps fleet planning decisions
- Forecast future demand

**Booking Conversion Funnel:**
- Visual funnel showing:
  1. Bookings Created (100%)
  2. Bookings Accepted (X%)
  3. Trips Started (X%)
  4. Trips Completed (X%)
- Identifies drop-off points
- Metrics to improve:
  - Driver acceptance rate
  - Trip completion rate
  - Payment success rate

#### Cancellation Analysis

**Metrics:**
- Total cancellations (count and %)
- Cancellation by status (who cancelled: customer, driver, system)
- Cancellation reasons (if tracked)
  - Customer changed mind
  - Driver unavailable
  - Payment failed
  - Other

**Patterns:**
- High-cancellation customers (list)
- High-cancellation drivers (list)
- Time-based patterns (day of week, time of day)
- Route-based patterns

**Actions:**
- Flag problematic users
- Implement cancellation policies
- Improve assignment algorithm

#### Performance Metrics

**Operational KPIs:**
- **Average Booking Completion Time**
  - From creation to delivery
  - By vehicle type
  - Trend over time

- **Driver Response Time**
  - Average time from booking to driver acceptance
  - By driver (identify slow responders)

- **Customer Satisfaction** (if rating system exists)
  - Average rating
  - By driver, by fleet
  - Trend over time

- **System Performance**
  - Average API response time
  - Uptime percentage
  - WebSocket connection stability
  - Error rate

**Efficiency Metrics:**
- Vehicle utilization rate (average across all vehicles)
- Driver utilization (hours on trip / hours online)
- Revenue per vehicle per day
- Revenue per driver per day
- Bookings per active customer

#### Predictive Analytics (Future Features)

**Demand Forecasting:**
- Predict bookings for next 7 days, 30 days
- Based on historical patterns
- Account for seasonal trends
- By vehicle type and region

**Fleet Size Recommendations:**
- Based on demand forecast
- Suggests optimal fleet size
- Identifies vehicle types needed

**Dynamic Pricing Suggestions:**
- Price optimization based on demand
- Surge pricing recommendations
- Route-specific pricing

#### Custom Reports Builder

**Features:**
- Select metrics to include
- Choose date range
- Apply filters
- Choose visualization type
- Save report templates
- Schedule automated reports (email)

#### API Endpoints Needed

```
GET /api/admin/analytics/popular-routes?period=month
GET /api/admin/analytics/peak-hours?period=week
GET /api/admin/analytics/vehicle-demand-trends?months=12
GET /api/admin/analytics/booking-funnel?from=2024-01-01
GET /api/admin/analytics/cancellation-analysis?period=month
GET /api/admin/analytics/performance-metrics
GET /api/admin/analytics/forecasting?days=7
POST /api/admin/analytics/custom-report
```

---

### 9. Real-time Monitoring (Live Operations)

**Purpose:** Live operational dashboard for monitoring active trips and system health.

#### Interactive Map

**Features:**
- Full-screen or embedded map of Ghana
- **Live Driver Markers:**
  - Color-coded by status (green=online & available, blue=on trip, gray=offline)
  - Update position via WebSocket (listening to `driver-location` events)
  - Click marker for quick info popup:
    - Driver name
    - Current status
    - Current booking (if on trip)
    - Vehicle type
- **Active Booking Routes:**
  - Line/polyline from pickup to dropoff
  - Color indicates booking status
  - Animated marker showing driver's position on route
- **Pickup/Dropoff Markers:**
  - Different icons for pickup (green pin) and dropoff (red pin)
  - Show address on hover
- **Clustering:**
  - Cluster nearby markers in high-density areas
  - Click cluster to zoom in
- **Map Controls:**
  - Zoom, pan
  - Layer toggles (drivers, bookings, heat map)
  - Filter by vehicle type, booking status

#### Active Trips Panel (Sidebar)

**Display:**
- List of all IN_PROGRESS bookings
- Scrollable if many active trips

**Trip Card Information:**
- Booking ID
- Customer name
- Driver name + vehicle type
- Pickup → Dropoff addresses (abbreviated)
- Trip start time
- **ETA Calculation:**
  - Estimated time to delivery
  - Based on distance and average speed
  - Updates in real-time
- Progress bar (visual representation)
- Status updates (approaching pickup, picked up, in transit, near dropoff)
- "View on Map" button (centers map on this trip)
- Quick actions: Contact driver, Contact customer

**Sort/Filter:**
- Sort by: ETA, start time, customer name
- Filter by: Vehicle type, region

#### System Health Monitoring

**Purpose:** Monitor backend and infrastructure health

**Metrics Display:**

1. **API Status**
   - Overall health: Operational / Degraded / Down (green/yellow/red indicator)
   - Response time: Average (last 5 mins)
   - Request rate: Requests per second
   - Error rate: Percentage of failed requests

2. **Database Status**
   - Connection status: Connected / Disconnected
   - Query performance: Average query time (ms)
   - Active connections count
   - Slow queries alert

3 **Redis Status**
   - Connection status: Connected / Disconnected
   - Memory usage: X MB / X GB
   - Cache hit rate: Percentage
   - Active Pub/Sub channels

4. **WebSocket Connections**
   - Total active connections
   - Connections by type (drivers, customers, admin)
   - Connection/disconnection rate
   - Failed connection attempts

5. **Server Resources** (if monitoring available)
   - CPU usage percentage
   - Memory usage percentage
   - Disk usage
   - Network I/O

**Alerts Configuration:**
- Set thresholds for metrics
- Real-time alerts when thresholds exceeded
- Alert history log

#### Real-time Activity Feed

**Live stream of events:**
- New booking created
- Booking accepted by driver
- Trip started
- Trip completed
- Payment received
- New user registration
- Document uploaded for verification
- System events

**Features:**
- Auto-scroll (pausable)
- Filter by event type
- Export activity log

#### WebSocket Integration

**Implementation Notes:**
- Connect to backend WebSocket server
- Subscribe to relevant events:
  - `driverLocation` - for map updates
  - `bookingUpdate` - for status changes
  - `systemEvent` - for alerts
- Handle reconnection gracefully
- Display connection status indicator

#### API Endpoints & WebSocket Events

```
GET /api/admin/live/active-trips
GET /api/admin/live/system-health
WebSocket: wss://api.truckly.com
  - Subscribe: trackDriver
  - Listen: driverLocation
  - Listen: bookingUpdate
  - Listen: systemAlert
```

---

### 10. User Management

**Purpose:** Manage all platform users across different roles and handle access control.

#### User Directory (Main Table)

**Columns:**
- User ID
- Name
- Email
- Phone Number
- Role (Badge: Admin, Customer, Driver, Fleet Owner)
- Status (Active/Suspended)
- Registration Date
- Last Login
- Actions

**Filters:**
- Role: All, Admin, Customer, Driver, Fleet Owner
- Status: Active, Suspended, All
- Registration date range
- Last login date range
- Search: Name, email, phone, user ID

**Bulk Actions:**
- Export user list
- Send bulk notification
- Suspend/activate multiple users

#### Role-Based Views

**1. Admins Tab**

**Purpose:** Manage administrator accounts

**Features:**
- List all admin users
- Admin-specific permissions matrix:
  - View-only access
  - Booking management
  - Financial access
  - User management
  - System settings
  - Analytics access
- Add new admin
- Edit admin permissions
- Remove admin (with confirmation)
- Activity log per admin (audit trail)

**2. Customers Tab**

**Purpose:** Quick access to customer-specific data

**Metrics:**
- Total customers
- Active customers (booked in last 30 days)
- New customers (this month)
- Top customers by bookings
- Top customers by spend

**Quick Actions:**
- View customer profile (links to Customer Management page)
- Block/unblock customer
- Send notification
- View booking history

**3. Drivers Tab**

**Links to Driver Management page**
- Quick stats displayed
- Shortcut filters for common views (unverified, suspended, etc.)

**4. Fleet Owners Tab**

**Links to Fleet Management page**
- Quick stats for fleet owners
- List of all fleet owner users
- Link to their fleet details

#### User Profile (General Template)

**Applies to any user type, shows relevant sections:**

**Basic Information:**
- Profile picture
- Full name
- Email, phone
- User ID
- Role
- Registration date
- Last login date/time
- Account status

**Role-Specific Sections:**
- If Driver: Link to driver profile
- If Fleet Owner: Link to fleet profile
- If Customer: Booking statistics

**Account Actions:**
- Edit user information
- Change email/phone
- Reset password (send reset link)
- Suspend/activate account
- Delete account (with warnings)
- Impersonate user (for support purposes)

**Activity Logs:**
- Login history (date, time, IP address, device)
- Recent actions on platform
- Security events (password changes, failed logins)

**Admin Notes:**
- Internal notes field
- Note history with timestamps and admin names
- Useful for tracking support interactions

#### Access Control & Permissions

**Admin Roles/Permissions Matrix:**

| Permission | Super Admin | Operations Manager | Finance Manager | Support Agent |
|------------|-------------|-------------------|-----------------|---------------|
| View Dashboard | ✓ | ✓ | ✓ | ✓ |
| Manage Bookings | ✓ | ✓ | - | View Only |
| Manage Users | ✓ | ✓ | - | View Only |
| Manage Drivers | ✓ | ✓ | - | ✓ |
| Manage Fleets | ✓ | ✓ | - | - |
| View Financials | ✓ | View Only | ✓ | - |
| Process Payments | ✓ | - | ✓ | - |
| Access Analytics | ✓ | ✓ | ✓ | - |
| System Settings | ✓ | - | - | - |
| User Permissions | ✓ | - | - | - |

**Implementation:**
- Role-based access control (RBAC)
- Permission checks on frontend (UI hiding) and backend (API authorization)
- Audit all admin actions

#### Audit Log

**Purpose:** Track all admin actions for security and compliance

**Logged Events:**
- User logins/logouts
- User creation/modification/deletion
- Booking modifications
- Payment processing
- Driver/document verification actions
- System settings changes
- Report generation

**Log Entry Details:**
- Timestamp
- Admin user
- Action type
- Target resource (user ID, booking ID, etc.)
- Before/after values (for modifications)
- IP address
- Result (success/failure)

**Features:**
- Search and filter logs
- Export for compliance
- Retention period configuration

#### API Endpoints Needed

```
GET /api/admin/users?page=1&limit=50&role=DRIVER
GET /api/admin/users/:id
GET /api/admin/users/admins
PUT /api/admin/users/:id/permissions
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/reset-password
GET /api/admin/users/:id/activity-log
GET /api/admin/audit-log?page=1&limit=50
```

---

### 11. Documents & Verification Center

**Purpose:** Centralized hub for reviewing and approving uploaded documents.

#### Verification Queue Dashboard

**Summary Cards:**
- **Total Pending Verifications**
- **Pending Driver Licenses**
- **Pending Insurance Documents**
- **Pending ID Cards**
- **Pending Other Documents**
- **Average Verification Time** (hours from upload to approval)

**Priority Queue:**
- Documents sorted by upload date (oldest first)
- Highlight urgent items (uploaded >48 hours ago)
- Color coding:
  - Red: >72 hours old
  - Yellow: 48-72 hours
  - White: <48 hours

#### Document Review Interface

**Layout:** Split-screen design

**Left Panel: Document Preview**
- Large preview area
- For images: Zoomable image viewer
- For PDFs: PDF viewer with page navigation
- Download original file button
- Full-screen toggle
- Previous/next document navigation

**Right Panel: Document & User Information**

**Document Details:**
- Document type badge
- Upload date/time
- File name, file size
- Uploader: User name (linked to profile)
- User role (Driver, Fleet Owner, etc.)

**User Quick Info (if Driver):**
- Name
- Email, phone
- Driver ID
- License number
- Registration date
- Total documents uploaded
- Previously verified documents

**Verification Actions:**
- **Approve Button (Green)**
  - Marks document as verified
  - Updates user's verification status
  - Sends approval notification/email
- **Reject Button (Red)**
  - Opens rejection reason dropdown:
    - Blurry/unreadable
    - Expired document
    - Wrong document type
    - Document doesn't match user info
    - Fraudulent/fake
    - Other (custom text field)
  - Sends rejection notification with reason
  - Document marked as rejected
- **Request Clarification**
  - Sends message to user asking for better quality, additional info, etc.
  - Document remains pending
- **Skip to Next**
  - Useful if need to consult with someone
  - Document remains pending

**Verification History:**
- Previous documents from same user
- Approval/rejection history
- Notes from other admins

**Internal Notes:**
- Add notes visible only to admins
- Useful for flagging concerns or tracking follow-ups

#### Bulk Verification Tools

**Batch Processing:**
- Select multiple documents (same type, same user)
- Approve all selected
- Useful for drivers uploading multiple angles of same document

**Auto-Verification (Future Feature):**
- OCR-based document reading
- AI flagging of potential issues
- Still requires admin final approval

#### Document Management (Admin Upload)

**Features:**
- Admin can upload documents on behalf of users
- Useful for offline onboarding scenarios
- Select user, document type, upload file
- Mark as pre-verified

#### Document Statistics

**Metrics:**
- Total documents in system
- Verified vs pending vs rejected (pie chart)
- Average verification time trend
- Verification volume (documents/day over time)
- Rejection rate by document type
- Top rejection reasons

#### API Endpoints Needed

```
GET /api/admin/documents/verification-queue?type=LICENSE&status=PENDING
GET /api/admin/documents/:id
PUT /api/admin/documents/:id/verify
PUT /api/admin/documents/:id/reject
POST /api/admin/documents/:id/request-clarification
GET /api/admin/documents/statistics
POST /api/admin/documents/upload-for-user
```

---

### 12. Settings & Configuration

**Purpose:** System-wide configuration and administrative settings.

#### System Settings

**Platform Configuration:**

**1. Commission & Pricing**
- Platform commission rate (%)
  - Flat percentage per booking
  - Or dynamic based on vehicle type
- Minimum booking amount (GHS)
- Cancellation fees
  - Customer cancellation fee
  - Driver cancellation penalty
- Service fee configuration

**2. Service Areas**
- Define regions/cities where platform operates
- Ghana regions selector:
  - Greater Accra
  - Ashanti
  - Central
  - Western
  - Eastern
  - Northern
  - etc.
- Per-region settings (if needed)
- Geo-fencing boundaries (future feature)

**3. Vehicle Type Management**
- List of vehicle types
- Add/edit/remove vehicle types
- Set default capacity ranges
- Upload vehicle type icons
- Set pricing modifiers by type

**4. Booking Configuration**
- Maximum advance booking period (days)
- Auto-cancellation timeout (minutes for unaccepted bookings)
- Booking buffer time (minimum time before scheduled pickup)
- Maximum active bookings per driver

**5. Payment Gateway Settings**
- Paystack configuration:
  - Public key
  - Secret key (masked)
  - Webhook URL
  - Test mode toggle
- Payment retry attempts
- Auto-refund rules

#### Notification Settings

**Email Templates:**
- List of email templates:
  - Welcome email (customer, driver, fleet owner)
  - Booking confirmation
  - Driver assignment
  - Trip started
  - Trip completed
  - Payment received
  - Document verification result
  - Password reset
  - System announcements
- Template editor:
  - Subject line
  - HTML body with variable placeholders: `{{customerName}}`, `{{bookingId}}`, etc.
  - Preview functionality
  - Send test email

**SMS Templates** (if SMS integration exists):
- Similar to email templates
- Character count (SMS limits)
- Link shortening

**Notification Preferences:**
- Enable/disable specific notification types
- Choose delivery method (email, SMS, push, all)
- Set quiet hours (no non-urgent notifications)

**Push Notifications** (for mobile apps):
- Configure Firebase/APNS credentials
- Template management
- Schedule broadcasts

#### Alert Thresholds

**Operational Alerts:**
- Alert when pending bookings exceed X for Y minutes
- Alert when online drivers below X
- Alert when vehicle utilization drops below X%
- Alert on payment failure rate exceeding X%

**System Alerts:**
- API error rate threshold
- Database connection issues
- Redis connection issues
- Disk space warnings
- High CPU/memory usage

**Recipient Configuration:**
- Email addresses for alert notifications
- SMS numbers for critical alerts
- Slack webhook integration (future)

#### API Management

**API Keys:**
- List of API keys for integrations
- Generate new API key for:
  - Mobile apps (iOS, Android)
  - Web application
  - Third-party integrations
- Revoke/regenerate keys
- View usage per API key

**Rate Limiting:**
- Set rate limits per endpoint or globally
- Different limits for different user types
- Whitelist IPs from rate limiting

**Webhooks:**
- Configure outgoing webhooks for events:
  - Booking created
  - Payment successful
  - Trip completed
- Webhook URL configuration
- Secret for signature verification
- Retry policy
- Webhook logs (delivery status)

#### User Interface Settings

**Branding:**
- Upload company logo
- Set primary/secondary brand colors
- Customize login page background

**Language & Localization:**
- Default language (English)
- Add support for local languages (Twi, Ga, etc.)
- Date/time format
- Currency format (GHS)

**Dashboard Preferences:**
- Default date range for charts
- Time zone settings
- Number formatting

#### Security Settings

**Password Policies:**
- Minimum password length
- Require special characters, numbers, uppercase
- Password expiration period
- Prevent password reuse

**Session Management:**
- Session timeout (minutes)
- Maximum concurrent sessions per user
- Force logout on password change

**Two-Factor Authentication:**
- Require 2FA for admin users
- 2FA method (SMS, authenticator app)

**IP Whitelisting:**
- Restrict admin access to specific IP addresses
- Useful for office-only access

#### Data & Privacy

**Data Retention:**
- How long to keep completed bookings
- Archive old data vs permanent deletion
- Anonymization rules

**GDPR/Privacy Compliance:**
- User data export feature
- Right to be forgotten (delete user data)
- Consent management

**Backup Configuration:**
- Automated backup schedule
- Backup retention period
- Manual backup trigger

#### Legal & Compliance

**Terms & Conditions:**
- Upload/edit T&Cs document
- Version control
- User acceptance tracking

**Privacy Policy:**
- Upload/edit privacy policy
- Display in app/website

**Driver Agreement:**
- Contract template for drivers
- E-signature integration (future)

#### Integrations (Future)

**Third-Party Services:**
- Google Maps API key
- Twilio (SMS) credentials
- SendGrid (Email) credentials
- Firebase (Push notifications)
- Analytics tools (Google Analytics, Mixpanel)

#### System Information

**Read-Only Information:**
- Current software version
- Last deployment date
- Database version
- Server information
- Total users, bookings, vehicles (all-time counts)

#### API Endpoints Needed

```
GET /api/admin/settings
PUT /api/admin/settings/commission
PUT /api/admin/settings/service-areas
GET /api/admin/settings/vehicle-types
POST /api/admin/settings/vehicle-types
GET /api/admin/settings/notification-templates
PUT /api/admin/settings/notification-templates/:id
GET /api/admin/settings/api-keys
POST /api/admin/settings/api-keys
DELETE /api/admin/settings/api-keys/:id
PUT /api/admin/settings/security
```

---

## Navigation Structure

### Primary Sidebar Navigation

```
┌─────────────────────────────────┐
│  TRUCKLY ADMIN                  │
├─────────────────────────────────┤
│  📊 Dashboard                   │  ← Default landing page
│                                 │
│  📦 OPERATIONS                  │
│    ├─ Bookings                  │
│    ├─ Live Tracking             │
│    └─ Booking History           │
│                                 │
│  👥 USERS                       │
│    ├─ All Users                 │
│    ├─ Customers                 │
│    ├─ Drivers                   │
│    └─ Fleet Owners              │
│                                 │
│  🚛 FLEET & VEHICLES            │
│    ├─ Vehicles                  │
│    ├─ Fleets                    │
│    └─ Capacity Planning         │
│                                 │
│  ✅ VERIFICATION                │
│    ├─ Document Queue            │
│    └─ Verified Documents        │
│                                 │
│  💰 FINANCIALS                  │
│    ├─ Payments                  │
│    ├─ Revenue Dashboard         │
│    └─ Financial Reports         │
│                                 │
│  📈 ANALYTICS                   │
│    ├─ Business Insights         │
│    ├─ Performance Metrics       │
│    └─ Custom Reports            │
│                                 │
│  🔴 LIVE MONITOR                │
│    └─ Real-time Operations      │
│                                 │
│  ⚙️ SETTINGS                    │
│    ├─ System Configuration      │
│    ├─ Notifications             │
│    ├─ API Management            │
│    └─ Security                  │
└─────────────────────────────────┘
```

### Top Navigation Bar

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Logo] Truckly Admin    [Search...]  🔔(5) 🌓 👤 Admin Name ▼      │
└──────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- **Logo:** Truckly branding, click to return to dashboard
- **Global Search:** Search across bookings, users, vehicles (keyboard shortcut: Cmd/Ctrl + K)
- **Notifications Bell:** Unread count badge, dropdown with recent notifications
- **Dark Mode Toggle:** Switch between light/dark theme
- **User Profile Dropdown:**
  - View profile
  - Settings
  - Logout

### Breadcrumb Navigation

Show path hierarchy for deep pages:
```
Dashboard > Drivers > John Doe > Booking History
```

---

## Design Guidelines

### Color Coding System

**Status Colors:**

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Success / Online / Active | Green | #10B981 | Completed bookings, online drivers, verified |
| Pending / Warning | Yellow/Amber | #F59E0B | Pending actions, warnings, scheduled |
| Error / Offline / Cancelled | Red | #EF4444 | Failed payments, offline, cancelled |
| In Progress / Info | Blue | #3B82F6 | In-progress bookings, on-trip drivers |
| Neutral / Inactive | Gray | #6B7280 | Inactive status, disabled |

**Application:**
- Use these colors consistently across badges, status indicators, charts
- Ensure sufficient contrast for accessibility (WCAG AA)

### Typography

**Hierarchy:**
- **H1:** Page titles (32px, Bold)
- **H2:** Section headers (24px, Semi-bold)
- **H3:** Subsection headers (20px, Semi-bold)
- **H4:** Card titles (18px, Medium)
- **Body:** Regular text (16px, Regular)
- **Small:** Metadata, captions (14px, Regular)
- **Tiny:** Helper text, timestamps (12px, Regular)

**Font Family:**
- Primary: Inter, system-ui, sans-serif
- Monospace (for IDs, codes): 'Roboto Mono', monospace

### Component Design

#### Cards

**Standard Card:**
- White background (light mode), dark in dark mode
- Subtle shadow: `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`
- Rounded corners: `border-radius: 8px`
- Padding: 16-24px

**KPI Card (Dashboard):**
- Larger padding
- Icon or illustration
- Large number (primary metric)
- Comparison indicator (↑ 12% vs last week)
- Small trend chart (optional)

#### Tables

**Features:**
- Sticky header (remains visible on scroll)
- Alternating row colors for readability
- Hover state on rows
- Sortable columns (icon indicates sort direction)
- Row actions (buttons/dropdown) on hover
- Responsive: collapse to cards on mobile

**Pagination:**
- Show: Rows per page selector (10, 25, 50, 100)
- Page numbers with ellipsis for long lists
- Previous/Next buttons

#### Buttons

**Primary Button:**
- Background: Brand color
- Use for main actions (Create, Save, Submit)

**Secondary Button:**
- Outline style
- Use for secondary actions (Cancel, Back)

**Danger Button:**
- Red background
- Use for destructive actions (Delete, Reject, Suspend)
- Always require confirmation

**Icon Buttons:**
- For compact spaces (table actions)
- Tooltip on hover

#### Forms

**Input Fields:**
- Clear labels
- Placeholder text for guidance
- Validation messages below field
- Error states with red border

**Dropdowns/Selects:**
- Searchable for long lists
- Multi-select with chips for multiple selections

**Date Pickers:**
- Calendar widget
- Quick shortcuts (Today, Last 7 days, This month)

#### Modals

**Structure:**
- Overlay background (semi-transparent black)
- Centered white card
- Header with title and close button
- Body with content
- Footer with actions (right-aligned)

**Sizes:**
- Small: 400px width (confirmations)
- Medium: 600px width (forms)
- Large: 800px width (detailed views)
- Full-screen: For complex interfaces (document review)

#### Badges

**Status Badges:**
- Small, pill-shaped
- Color-coded by status
- Bold text, uppercase or title case

**Count Badges:**
- Circular, small
- Used on icons (notifications, tabs)
- Red for attention-grabbing

### Layout Principles

**Spacing:**
- Use 8px grid system (8, 16, 24, 32, 40px)
- Consistent spacing creates visual harmony

**Responsive Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
- Large Desktop: > 1440px

**Sidebar:**
- Fixed width on desktop (240px)
- Collapsible to icon-only (64px)
- Slide-over on mobile

**Content Area:**
- Maximum width for readability (1400px)
- Center-aligned with padding

### Accessibility

**Requirements:**
- Keyboard navigation support (Tab, Enter, Esc)
- Focus indicators visible
- Screen reader friendly (semantic HTML, ARIA labels)
- Color contrast meets WCAG AA (4.5:1 for text)
- Alt text for images/icons
- Form labels properly associated

### Dark Mode

**Implementation:**
- Toggle in top nav
- Save preference to user settings
- Smooth transition animation
- Adjust all colors for dark background
- Ensure sufficient contrast in both modes

### Icons

**Icon Library:** Use consistent icon set (e.g., Heroicons, Feather Icons, Font Awesome)

**Usage:**
- Icons paired with text for clarity
- Consistent size (16px, 20px, 24px)
- Color matches text or use brand color for emphasis

### Loading States

**Skeleton Screens:**
- Show layout structure while data loads
- Animated shimmer effect
- Better UX than spinners for content-heavy pages

**Spinners:**
- For button actions
- For small component loads

**Progress Bars:**
- For file uploads
- For multi-step processes

### Empty States

**When No Data:**
- Illustration or icon
- Descriptive text explaining why empty
- Call-to-action button (e.g., "Create First Booking")

**Examples:**
- No bookings yet: "No bookings found. New bookings will appear here."
- No search results: "No results for 'search term'. Try adjusting filters."

### Error Handling

**Display Errors:**
- Toast notifications for API errors (top-right corner)
- Inline errors for form validation
- Full-page error for critical failures

**Error Messages:**
- User-friendly language (avoid technical jargon)
- Suggest solutions when possible
- Contact support option

### Performance Considerations

**Optimization:**
- Lazy load images
- Virtualize long lists/tables (only render visible rows)
- Debounce search inputs
- Cache frequently accessed data
- Paginate large datasets
- Use loading states to indicate progress

### Real-time Updates

**WebSocket Indicators:**
- Connected/disconnected status icon
- Smooth animations for live data changes
- Highlight updated rows/cards briefly (flash effect)
- Auto-scroll options for activity feeds (with pause button)

---

## Implementation Phases

### Phase 1: MVP (Minimum Viable Product)

**Goal:** Essential functionality to manage daily operations

**Duration:** 4-6 weeks

**Pages to Implement:**

1. **✅ Overview Dashboard**
   - KPI cards (active bookings, revenue, drivers, pending verifications)
   - Basic revenue chart (last 30 days)
   - Recent activity feed (last 20 items)
   - Booking status pie chart
   - Driver status distribution

2. **✅ Bookings Management**
   - Main table with filtering (status, type, date range)
   - Search by booking ID, customer, driver
   - Booking detail modal
   - Basic action: Cancel booking
   - Export to CSV

3. **✅ Driver Management**
   - Driver table/grid view
   - Filter by status, verification
   - Driver profile page with basic info
   - Verification queue (approve/reject documents)
   - Change driver status

4. **✅ User Management (Basic)**
   - All users table
   - Filter by role
   - View user profile
   - Suspend/activate account

5. **✅ Payments Table**
   - List all payments
   - Filter by status, date range
   - Search by payment ID, booking ID
   - View payment details
   - Export to CSV

**Authentication:**
- Admin login page
- JWT-based auth
- Basic role: ADMIN only

**Technical Setup:**
- Framework selection (React, Vue, Angular)
- API integration with existing backend
- Basic routing
- State management
- Dark/light mode

**Design:**
- Implement core component library
- Color system
- Typography
- Responsive layout (mobile-first)

---

### Phase 2: Enhanced Features

**Goal:** Add operational efficiency tools and deeper analytics

**Duration:** 4-6 weeks

**Pages to Implement:**

6. **✅ Fleet & Vehicle Management**
   - Fleet overview page
   - Fleet detail page with vehicle list
   - Vehicle inventory page
   - Vehicle profile page
   - Add/edit vehicle forms
   - Capacity planning dashboard

7. **✅ Customer Management**
   - Customer table with stats
   - Customer profile page
   - Booking history per customer
   - Customer analytics (preferred types, routes)

8. **✅ Document Verification Center**
   - Enhanced verification queue with preview
   - Split-screen review interface
   - Bulk approval tools
   - Document statistics dashboard

9. **✅ Live Tracking Map**
   - Interactive map integration (Google Maps / Mapbox)
   - Real-time driver locations via WebSocket
   - Active booking routes visualization
   - Map filters and controls

10. **✅ Basic Analytics**
    - Popular routes table
    - Peak hours chart
    - Vehicle demand trends
    - Booking funnel visualization

**Enhancements:**
- Advanced filtering across all tables
- Bulk actions (export, status updates)
- Notification system (in-app)
- Improved search (autocomplete)

**WebSocket Integration:**
- Real-time driver location updates
- Live booking status changes
- System notifications

---

### Phase 3: Advanced Analytics & Reporting

**Goal:** Business intelligence and financial management

**Duration:** 3-4 weeks

**Pages to Implement:**

11. **✅ Financial Dashboard**
    - Revenue Cards with comparisons
    - Revenue trends chart (customizable periods)
    - Top revenue sources
    - Payment reconciliation tools

12. **✅ Financial Reports**
    - Commission report generator
    - Driver earnings report
    - Fleet owner payouts
    - Tax reports (VAT)
    - Monthly summary PDF generation

13. **✅ Advanced Analytics**
    - Cancellation analysis
    - Performance metrics dashboard
    - Custom report builder
    - Scheduled reports (email automation)

14. **✅ Real-time Monitoring Dashboard**
    - Full-featured live operations page
    - System health monitoring
    - Active trips panel
    - Real-time activity feed
    - Alert center

**Enhancements:**
- Export reports to PDF
- Chart customization options
- Data visualization improvements
- Email report scheduling

---

### Phase 4: Configuration & Administration

**Goal:** System configuration and advanced admin features

**Duration:** 2-3 weeks

**Pages to Implement:**

15. **✅ Settings & Configuration**
    - System settings form
    - Notification templates editor
    - Alert threshold configuration
    - API key management
    - Security settings

16. **✅ Role-Based Access Control**
    - Admin role management
    - Permissions matrix
    - Audit log viewer

**Enhancements:**
- Multi-language support
- Advanced user permissions
- White-label branding options
- Backup/restore functionality

---

### Phase 5: Optimization & Polish

**Goal:** Performance, UX improvements, and advanced features

**Duration:** 2-3 weeks

**Focus Areas:**

**Performance:**
- Code splitting and lazy loading
- API response caching
- Optimized re-renders
- Database query optimization
- CDN for static assets

**UX Enhancements:**
- Keyboard shortcuts (Cmd+K for search, etc.)
- Contextual help tooltips
- Onboarding tour for new admins
- Improved mobile responsiveness
- Accessibility audit & fixes

**Advanced Features:**
- Predictive analytics (demand forecasting)
- Dynamic pricing recommendations
- AI-powered document verification
- Automated report generation
- Integration with third-party tools (Slack, accounting software)

**Testing:**
- Unit tests for components
- Integration tests for flows
- E2E testing (Cypress, Playwright)
- Performance testing
- Cross-browser testing

**Documentation:**
- Admin user guide
- Developer documentation
- API documentation
- Video tutorials

---

### Technology Stack Recommendations

**Frontend Framework:**
- **React** with TypeScript (recommended for flexibility and ecosystem)
- Or **Vue 3** with TypeScript (simpler learning curve)
- Or **Angular** (for enterprise-grade structure)

**UI Component Libraries:**
- **Tailwind CSS** for styling
- **shadcn/ui** or **Headless UI** for components
- **Chart.js** or **Recharts** for data visualization
- **React Table** or **TanStack Table** for advanced tables
- **React Query** or **SWR** for API data fetching

**State Management:**
- **Zustand** (lightweight) or **Redux Toolkit** (complex state)
- **React Context** for simple cases

**Maps:**
- **Google Maps JavaScript API** or **Mapbox GL JS**
- **React Leaflet** (open-source alternative)

**WebSocket Client:**
- **Socket.IO Client** (matches backend)

**Form Handling:**
- **React Hook Form** with **Zod** for validation

**Date/Time:**
- **date-fns** or **Day.js** (lightweight)

**Routing:**
- **React Router** (React)
- **Vue Router** (Vue)

**Build Tool:**
- **Vite** (fast, modern)

**Testing:**
- **Vitest** (unit tests)
- **Playwright** or **Cypress** (E2E tests)

**Deployment:**
- **Vercel** or **Netlify** (frontend hosting)
- Or serve from same server with **Nginx**

---

## API Integration Checklist

### Authentication Endpoints
- `POST /api/auth/login` - Admin login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout

### Dashboard Endpoints
- `GET /api/admin/dashboard/kpis`
- `GET /api/admin/dashboard/revenue-trends`
- `GET /api/admin/dashboard/booking-status`
- `GET /api/admin/dashboard/driver-status`
- `GET /api/admin/dashboard/recent-activity`

### Bookings Endpoints
- `GET /api/admin/bookings` (with pagination, filters)
- `GET /api/admin/bookings/:id`
- `PUT /api/admin/bookings/:id/assign-driver`
- `PUT /api/admin/bookings/:id/cancel`
- `POST /api/admin/bookings/export`

### Drivers Endpoints
- `GET /api/admin/drivers`
- `GET /api/admin/drivers/:id`
- `GET /api/admin/drivers/:id/statistics`
- `PUT /api/admin/drivers/:id/verify`
- `PUT /api/admin/drivers/:id/suspend`

### Fleets & Vehicles Endpoints
- `GET /api/admin/fleets`
- `GET /api/admin/fleets/:id`
- `GET /api/admin/vehicles`
- `GET /api/admin/vehicles/:id`

### Users Endpoints
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id/suspend`

### Payments Endpoints
- `GET /api/admin/payments`
- `GET /api/admin/payments/:id`
- `GET /api/admin/financials/overview`
- `GET /api/admin/financials/revenue-chart`

### Documents Endpoints
- `GET /api/admin/documents/verification-queue`
- `GET /api/admin/documents/:id`
- `PUT /api/admin/documents/:id/verify`
- `PUT /api/admin/documents/:id/reject`

### Analytics Endpoints
- `GET /api/admin/analytics/popular-routes`
- `GET /api/admin/analytics/peak-hours`
- `GET /api/admin/analytics/booking-funnel`

### Settings Endpoints
- `GET /api/admin/settings`
- `PUT /api/admin/settings/commission`
- `GET /api/admin/settings/notification-templates`

### WebSocket Events
- **Subscribe:** `trackDriver`
- **Listen:** `driverLocation`
- **Listen:** `bookingUpdate`
- **Listen:** `systemAlert`

---

## Summary

This comprehensive specification provides a complete blueprint for building an intuitive, feature-rich admin dashboard for Truckly. The phased approach ensures rapid delivery of MVP functionality while allowing for iterative enhancements.

**Key Features:**
- Real-time monitoring and tracking
- Comprehensive booking, driver, and fleet management
- Financial oversight and reporting
- Business intelligence and analytics
- Document verification workflows
- System configuration and security
- Role-based access control

**Design Principles:**
- Consistent color coding and typography
- Responsive, mobile-friendly design
- Accessibility compliance
- Dark mode support
- Performance optimization

**Implementation Focus:**
- Start with Phase 1 (MVP) for core operations
- Progressively add features in subsequent phases
- Integrate WebSockets early for real-time updates
- Build reusable component library
- Maintain comprehensive API integration

This dashboard will empower Truckly admins to efficiently manage the logistics platform, make data-driven decisions, and scale operations across Ghana.
