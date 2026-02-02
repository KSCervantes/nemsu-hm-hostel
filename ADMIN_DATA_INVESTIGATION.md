# Admin Data Investigation Report

## Overview

Investigation of the admin panel focusing on data handling, factual operations, and information flow.

---

## 1. Database Schema (Prisma)

**File:** [prisma/schema.prisma](prisma/schema.prisma)

### Core Models:

#### AdminUser

- **Purpose:** Admin authentication and access control
- **Fields:**
  - `id` (Int): Primary key, auto-increment
  - `username` (String): Unique identifier for login
  - `passwordHash` (String): Bcrypt hashed password
  - `createdAt` (DateTime): Account creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
- **Data Handling:** Credentials validated via bcrypt comparison in [app/api/admin/login/route.ts](app/api/admin/login/route.ts)

#### FoodItem

- **Purpose:** Menu item catalog and pricing
- **Fields:**
  - `id` (Int): Primary key
  - `name` (String): Required - item name
  - `description` (Text, optional): Detailed description
  - `price` (Decimal 10,2): Required - unit price
  - `category` (String, optional): Item classification (main, etc.)
  - `code` (String, unique, optional): Item code for reference
  - `img` (Text, optional): Image URL/path
  - `available` (Boolean): Default true - availability status
  - `createdAt/updatedAt` (DateTime): Timestamps
- **Relations:** One-to-many with `OrderItem`
- **Data Management:** Full CRUD operations via [app/admin/food-menu/page.tsx](app/admin/food-menu/page.tsx)

#### Order

- **Purpose:** Customer orders and transactions
- **Fields:**
  - `id` (Int): Primary key
  - `createdAt` (DateTime): Order creation timestamp
  - `status` (OrderStatus enum): PENDING, ACCEPTED, COMPLETED, CANCELLED
  - `orderType` (OrderType enum): DELIVERY or PICKUP
  - `total` (Decimal 10,2): Order total amount
  - `customer` (String, optional): Customer name
  - `contactNumber` (String, optional): Phone number
  - `email` (String, optional): Email address
  - `address` (String, optional): Delivery address
  - `desiredAt` (DateTime, optional): Requested fulfillment date/time
  - `archived` (Boolean): Default false - archive flag
  - `archivedAt` (DateTime, optional): Archive timestamp
- **Relations:** One-to-many with `OrderItem`
- **Factual Data Tracked:**
  - Order lifecycle (creation → completion)
  - Financial transactions (total amount)
  - Customer contact information
  - Delivery/pickup specifications
  - Archival audit trail

#### OrderItem

- **Purpose:** Individual items within an order
- **Fields:**
  - `id` (Int): Primary key
  - `orderId` (Int, FK): Reference to Order
  - `foodId` (Int, FK): Reference to FoodItem
  - `name` (String): Item name (denormalized for historical accuracy)
  - `quantity` (Int): Units ordered
  - `unitPrice` (Decimal 10,2): Price per unit at time of order
  - `lineTotal` (Decimal 10,2): quantity × unitPrice
  - `notes` (String, optional): Special requests/notes
- **Factual Data:** Captures exact pricing and quantity at order time

#### Reservation

- **Purpose:** Room booking management
- **Fields:**
  - `id` (Int): Primary key
  - `name` (String): Guest name
  - `phone` (String): Contact number
  - `email` (String, optional): Email
  - `room` (Int): Room number
  - `checkIn` (DateTime): Check-in date/time
  - `nights` (Int): Length of stay
  - `createdAt` (DateTime): Booking timestamp
- **Relations:** None (standalone model)

---

## 2. Admin API Routes - Data Operations

### Authentication

**File:** [app/api/admin/login/route.ts](app/api/admin/login/route.ts)

- **Method:** POST
- **Validation:**
  - Username and password required
  - User lookup by username (unique constraint)
  - Bcrypt password comparison
  - Returns: `{ ok: true, username }` on success
- **Security Note:** No JWT/session token implementation (returns simple OK flag)

### Food Items Management

**File:** [app/api/food-items/route.ts](app/api/food-items/route.ts)

#### GET

- **Data Operation:** Retrieve all food items
- **Order:** Ascending by ID
- **Returns:** Complete FoodItem array

#### POST (Create)

- **Required Fields:** `name`, `price`
- **Optional Fields:** `description`, `category`, `code`, `img`, `available`
- **Validations:**
  - Name and price are mandatory
  - Code must be unique (if provided)
  - Price parsed as float
  - Available defaults to true
- **Constraint Handling:** P2002 (unique constraint) error caught and reported

**File:** [app/api/food-items/[id]/route.ts](app/api/food-items/%5Bid%5D/route.ts)

#### GET by ID

- **Data Operation:** Fetch single food item
- **Error Handling:** 404 if not found

#### PATCH (Update)

- **Selective Updates:** Only provided fields updated
- **Special Logic:**
  - Code change validation (case-insensitive comparison)
  - Only validates uniqueness if code is actually changing
  - Price validation (must be numeric)
  - Null handling for optional fields
- **Error Handling:** P2025 (record not found), P2002 (unique constraint)

### Orders Management

**File:** [app/api/orders/route.ts](app/api/orders/route.ts)

#### GET

- **Filtering Logic:**
  - `archived=true`: Only archived orders
  - `archived=false`: Only active orders
  - No param: All orders
- **Sort:** Descending by ID (newest first)
- **Data Enhancement:** Adds UI `uid` (ORD######) for display while keeping numeric `id` as primary key
- **Include Relations:** All order items

#### POST (Create Order)

- **Required:** `items` array (non-empty)
- **Accepted Fields:**
  - `customer`, `contactNumber`, `email`, `address`
  - `date`, `time` (combined to `desiredAt` ISO datetime)
  - `items` array with: `foodId`, `name`, `quantity`, `unitPrice`, `notes`
  - `orderType` ('DELIVERY' or 'PICKUP')
- **Calculations:**
  - `total` = sum(quantity × unitPrice) across all items
  - `lineTotal` = quantity × unitPrice per item
- **FoodItem Upsert:** Ensures food items exist with current name/price (historical tracking)
- **Date Handling:** Safe ISO parsing with validation
- **Email Notifications:** Sends confirmation emails based on orderType
- **Constraints:** Items array validation, type coercion for orderType

### Order Status Management

**File:** [app/api/orders/[id]/route.ts](app/api/orders/%5Bid%5D/route.ts)

#### PATCH (Update Order)

- **Updatable Fields:** `status`, `customer`, `contactNumber`, `email`, `address`, `desiredAt`, `orderType`
- **Status Transitions:** Validates status is in enum (PENDING, ACCEPTED, COMPLETED, CANCELLED)
- **Date Handling:** Supports ISO datetime parsing for `desiredAt`

### Order Archival

**File:** [app/api/orders/[id]/permanent/route.ts](app/api/orders/%5Bid%5D/permanent/route.ts)

#### DELETE (Permanent Deletion)

- **Operation:** Hard delete from database
- **Cascade:** Deletes all associated OrderItems first
- **Audit Trail Loss:** No soft delete/audit log maintained

**File:** [app/api/orders/[id]/items/route.ts](app/api/orders/%5Bid%5D/items/route.ts)

#### DELETE (Items Deletion)

- **Operation:** Delete all items for an order
- **Precondition:** Used before permanent order deletion

---

## 3. Admin Pages - Data Presentation & Interaction

### Dashboard

**File:** [app/admin/Dashboard/page.tsx](app/admin/Dashboard/page.tsx)

- **Key Metrics Tracked:**
  - `rooms`: 32 (hardcoded)
  - `bookings`: 18 (hardcoded)
  - `guests`: 46 (hardcoded)
  - `orders`: Fetched from API
- **Charts Generated:**
  - Status counts (PENDING, ACCEPTED, COMPLETED, CANCELLED)
  - Daily orders (7-day period)
  - Daily revenue (7-day period)
  - Total revenue (sum of completed order totals)
- **Filtering:** Daily, 7-day, monthly periods
- **Auth Check:** localStorage `admin_token` verification

### Food Menu Management

**File:** [app/admin/food-menu/page.tsx](app/admin/food-menu/page.tsx)

- **Operations:**
  - List all food items
  - Create new item (POST to /api/food-items)
  - Edit existing item (PATCH to /api/food-items/[id])
  - Delete item (DELETE endpoint - method shown in UI but handler status unknown)
- **Form Fields:**
  - name, description, price, category, code, img, available
- **Validations:**
  - Name and price required
  - Code uniqueness
  - Price parsing
- **User Feedback:** SweetAlert2 notifications for operations

### Orders Management

**File:** [app/admin/orders/page.tsx](app/admin/orders/page.tsx) (1518 lines)

- **Comprehensive Order Handling:**
  - List all active orders
  - Pagination (10 items/page)
  - Search by customer name
  - View order details
  - Update order status
  - Create new orders
  - Edit existing orders
  - Archive orders
- **Order Creation Form:**
  - Customer info (name, contact, email, address)
  - Desired date/time
  - Order type (Delivery/Pickup)
  - Dynamic item selection from menu
  - Quantity and notes per item
  - Automatic total calculation
- **Order Editing:**
  - Modify customer information
  - Update item quantities
  - Add/remove items
  - Recalculate totals
- **Status Management:**
  - Mark orders as ACCEPTED, COMPLETED, CANCELLED
  - Visual status indicators
- **Archive Operation:**
  - Soft archive (sets archived=true, archivedAt timestamp)
  - Maintains order history

### Income/Revenue Analytics

**File:** [app/admin/Income/page.tsx](app/admin/Income/page.tsx)

- **Analytics Calculations:**
  - Filter periods: Daily, Weekly, Monthly, Yearly
  - Completed orders only (status === 'COMPLETED')
  - Income = sum(lineTotal) for all items in order
  - Order counts per period
  - Total income across all periods
- **Data Visualization:**
  - Period-based breakdown
  - Revenue by time period
  - Order frequency
- **Export:**
  - CSV export with headers: Period, Income (₱), Orders
  - Filename includes filter type and date
- **Tooltip Interactions:** Hover-based data display

### Archive Management

**File:** [app/admin/archive/page.tsx](app/admin/archive/page.tsx)

- **Archived Orders Display:**
  - Fetch only archived orders (`archived=true`)
  - Same pagination as orders page
  - Search functionality
- **Archive Operations:**
  - **Restore:** PATCH to set `archived=false`, `archivedAt=null`, status reset to PENDING
  - **Permanent Delete:**
    - DELETE items first
    - DELETE order (permanent)
    - No recovery possible
  - Confirmation dialogs via SweetAlert2
- **Audit Trail:** Shows `archivedAt` timestamp

---

## 4. Data Integrity & Factual Concerns

### Strengths:

✅ **Proper Decimal Precision:** Prices stored as DECIMAL(10,2) preventing float rounding errors
✅ **Foreign Key Relations:** OrderItem properly linked to Order and FoodItem
✅ **Timestamp Tracking:** All entities have createdAt/updatedAt for audit trail
✅ **Status Enum:** Defined order statuses prevent invalid values
✅ **Price History:** OrderItem stores unitPrice at order time (captures historical pricing)
✅ **Email Notifications:** Sent on order creation (mentioned in imports)

### Concerns/Issues:

⚠️ **No JWT/Session Token:** Login returns simple OK flag without persistent token mechanism

- Impact: Auth state relies only on localStorage `admin_token` (not validated on backend)
- Risk: Any client can set localStorage value and gain access

⚠️ **Hardcoded Dashboard Metrics:** Room/booking/guest counts are hardcoded constants

- Values: 32 rooms, 18 bookings, 46 guests
- Impact: Not reflecting actual data
- Should fetch from Reservation model instead

⚠️ **No Audit Log for Permanent Deletes:** Orders deleted permanently without logging

- No way to trace what was deleted or by whom
- Violates typical business record keeping practices

⚠️ **Email Notification Implementation:** Email functions imported but actual trigger logic unclear

- `sendOrderConfirmationEmail`, `sendOrderPickupConfirmationEmail` called in POST route
- No error handling shown for email failures
- May fail silently if email service is unavailable

⚠️ **Food Item Price Upsert Logic:** When creating order, food items are upserted with current name/price

```typescript
prisma.foodItem.upsert({
  where: { id: it.foodId },
  update: { name: it.name, price: it.unitPrice },
  create: { id: it.foodId, name: it.name, price: it.unitPrice },
});
```

- This could modify existing menu items if order references non-existent ID
- Unexpected side effect during order creation

⚠️ **Missing Data Validation:**

- No email format validation
- No phone number format validation
- No address field validation
- OrderType defaults to DELIVERY silently if invalid

⚠️ **Archive Field Not Fully Implemented:**

- Created orders have `archived=false` by default
- Soft delete implementation is incomplete (no hard delete prevention)
- No migration to handle existing non-archived orders

---

## 5. Data Flow Summary

```
Admin Login
    ↓
localStorage admin_token (no backend validation)
    ↓
Dashboard / Orders / Menu / Income / Archive Pages
    ↓
API Routes (/api/...)
    ↓
Prisma ORM
    ↓
MySQL Database
```

### Key Data Operations:

1. **Menu Management:** FoodItem CRUD via API
2. **Order Lifecycle:** Create → Update Status → Complete/Cancel → Archive → Delete
3. **Financial Tracking:** Income calculations from completed orders
4. **Historical Records:** Reservation and OrderItem store temporal data

---

## 6. Recommendations

### Critical:

1. **Implement JWT/Session:** Replace localStorage-only auth with proper backend validation
2. **Audit Logging:** Add audit_logs table for deletions and critical operations
3. **Dynamic Dashboard Metrics:** Fetch actual data instead of hardcoded values

### Important:

4. Fix food item upsert logic (don't modify menu during order creation)
5. Add email failure handling
6. Implement comprehensive input validation

### Nice-to-Have:

7. Soft delete for all critical records (audit trail)
8. Rate limiting on API endpoints
9. Role-based access control (if multiple admin types needed)
