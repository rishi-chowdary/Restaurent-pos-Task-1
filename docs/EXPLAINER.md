# System Architecture & Code Explainer

This document outlines the architecture, data flow, key engineering decisions, and interview preparation questions for the Restaurant POS & Order Management System.

---

## Major Features & Code Walkthrough

### 1. Server-Side Billing Engine & Tamper-Proof Pricing
- **Files to open:**
  - `server/src/services/order-billing.service.ts`
  - `server/src/models/order.model.ts`
  - `server/src/validations/order.validation.ts`
- **Flow:**
  1. The client sends only item IDs, desired quantities, and any optional discount request.
  2. The server queries active menu items by ID from MongoDB, immediately rejecting any inactive or out-of-stock items with HTTP 409.
  3. Prices are pulled strictly from the database document to create a frozen `priceSnapshot`, completely ignoring any prices or totals sent by the client.
  4. Subtotal, discount capping (ensuring discount never exceeds subtotal), configurable sales tax, and final order total are rounded to 2 decimal places using half-up arithmetic.
- **Key Decision & Why:**
  - *Why Price Snapshots?* If a restaurant changes the price of a burger tomorrow from $14.99 to $16.99, historical receipts and accounting reports for today's orders must preserve the exact price charged at checkout. Snapshots decouple historic financial records from catalog changes.

---

### 2. Atomic Sequential Order Numbering
- **Files to open:**
  - `server/src/models/counter.model.ts`
  - `server/src/services/order.service.ts` (function `generateNextOrderNumber`)
- **Flow:**
  1. Each calendar day generates a unique sequence key: `ORD-YYYYMMDD`.
  2. The service executes MongoDB's atomic `findOneAndUpdate` with `$inc: { sequenceValue: 1 }` and `upsert: true`.
  3. The returned sequence integer is zero-padded to 4 digits (e.g., `ORD-20261016-0001`).
- **Key Decision & Why:**
  - *Why an Atomic Counter Collection instead of `countDocuments()`?* Calling `countDocuments()` before insert creates a classic race condition where two simultaneous orders at peak rush hour receive the exact same order number, violating uniqueness constraints. MongoDB's atomic `$inc` guarantees unique, gapless, sequential numbering even under heavy concurrency.

---

### 3. Strict Forward-Only Order Status Transitions
- **Files to open:**
  - `server/src/services/order.service.ts` (function `updateOrderStatus`)
  - `client/src/app/orders/page.tsx`
- **Flow:**
  1. An order starts in `Pending` upon creation.
  2. Kitchen staff can advance it forward: `Pending` -> `Preparing` -> `Ready` -> `Completed`.
  3. Any backward transitions (e.g. `Ready` -> `Pending`) or transition leaps (e.g. `Pending` -> `Completed`) are caught by the state transition map and rejected with HTTP 409.
  4. Marking an order `Completed` checks `order.paymentStatus === 'Paid'`; if unpaid, the server rejects the completion with HTTP 409.
- **Key Decision & Why:**
  - *Why enforce state transitions strictly on the server?* Prevent inventory loss and cash leakage. Orders cannot simply be moved to "Completed" by unauthorized users without recorded tender, ensuring all food made by the kitchen is accounted for at checkout.

---

### 4. Dual-Role Authentication & Role-Guards
- **Files to open:**
  - `server/src/middleware/auth.middleware.ts`
  - `server/src/middleware/role-guard.middleware.ts`
  - `server/src/routes/report.routes.ts`
  - `server/src/routes/settings.routes.ts`
- **Flow:**
  1. The user logs in via `POST /api/auth/login` (guarded by an IP rate limiter to mitigate brute-force attacks).
  2. Passwords are verified against bcrypt hashes, and a signed JWT containing user ID and role (`Admin` or `Staff`) is issued.
  3. On protected routes, `authenticateToken` validates the Bearer token and attaches the user session.
  4. The `requireRole('Admin')` middleware halts non-admin users with HTTP 403 before any business logic executes for menu editing, order cancellations, daily sales reports, or tax configurations.
- **Key Decision & Why:**
  - *Why separate auth and role guards?* Separation of concerns. Authentication verifies *who* the caller is; authorization verifies *what* they are permitted to perform. This allows combining roles flexibly across any route.

---

### 5. Multi-Channel Payment Recording & Change Calculation
- **Files to open:**
  - `server/src/services/order.service.ts` (function `recordOrderPayment`)
  - `client/src/components/payment-modal.tsx`
  - `client/src/components/receipt-modal.tsx`
- **Flow:**
  1. Staff clicks "Record Pay" on an unpaid ticket.
  2. Tender method is selected: Cash (with quick denominations and change calculator), UPI (with QR preview and UTR reference), or Card (with auth code).
  3. The server confirms the order is neither already paid nor cancelled, asserts that `amount` matches `order.total` within 2 decimals, records the payment metadata and cashier ID, and marks `paymentStatus = 'Paid'`.
  4. The customer receipt updates in real-time and is printable in thermal paper format.
- **Key Decision & Why:**
  - *Why prevent double payments on the server?* Prevents accidental duplicate card charges or duplicate cash entries when multiple cashiers are operating parallel registers.

---

## 10 Likely Interview Questions & Short Answers

### Q1: Why did you recalculate prices on the server instead of trusting the client payload?
**Answer:** Any value sent from a browser or API client can be intercepted and modified via DevTools or cURL. If the server trusts client totals, an attacker could change an order of $100 worth of steaks to $1.00. The server must treat all client pricing as untrusted and calculate totals strictly using database prices.

### Q2: Why did you store `nameSnapshot` and `priceSnapshot` inside each order item?
**Answer:** Menu items change over time—prices increase with inflation and seasonal dishes get renamed or removed. If orders only held a reference to the `MenuItem` document, editing a menu item's price in the future would retroactively alter the financial totals on past orders and invalidate historical accounting reports.

### Q3: How does your order number generation handle concurrent requests?
**Answer:** Instead of querying `countDocuments()` or relying on timestamps, we use a separate `Counter` collection with MongoDB's atomic `findOneAndUpdate` and `$inc: { sequenceValue: 1 }`. Because `$inc` is atomic in MongoDB, concurrent requests are serialized safely without race conditions or duplicate order numbers.

### Q4: Why did you separate business logic into Services instead of keeping it in Controllers?
**Answer:** Keeping controllers thin adheres to the Single Responsibility Principle. Controllers only parse HTTP requests, extract parameters, and format the HTTP response. Services house the core domain rules (billing calculations, status progression, payment verification), making the business logic easily unit-testable and reusable without needing mock HTTP `req` and `res` objects.

### Q5: How do you prevent invalid order status transitions?
**Answer:** In `order.service.ts`, we maintain an allowed state transitions lookup map (`Pending -> Preparing -> Ready -> Completed`). Before updating an order, the service verifies that the requested status is in the allowed target list for the current status; otherwise it throws an `AppError` with HTTP 409 Conflict.

### Q6: Why did you require `paymentStatus === 'Paid'` before allowing the 'Completed' status?
**Answer:** In restaurant operations, once food is delivered or handed to the customer, collecting payment becomes difficult. Enforcing payment before completion prevents staff from closing unpaid tickets and creates an audit trail ensuring all prepared orders are settled.

### Q7: Why did you choose Zod for request validation?
**Answer:** Zod offers runtime validation combined with automatic TypeScript static type inference. It ensures incoming payloads have the exact required types, strings are sanitized, quantities are integers $\ge 1$, and rejects unexpected fields before the request reaches the controller.

### Q8: How is the application deployed to production?
**Answer:** The monorepo has two independent deploy targets:
- Frontend (`/client`): Deployable to Vercel with zero configuration, using Next.js App Router and environment variable `NEXT_PUBLIC_API_URL`.
- Backend (`/server`): Deployable as a Docker or Node service to Render, Railway, or AWS, with MongoDB Atlas connection string `MONGODB_URI` and JWT secret.
- For local review, the server includes automatic fallback to `mongodb-memory-server` so it runs out-of-the-box with zero setup.

### Q9: How do you handle error propagation and response formatting?
**Answer:** We implemented a custom `AppError` class that carries an HTTP status code, an error code string, and optional validation details. Express controllers are wrapped in an `asyncHandler` that catches rejected promises and routes them to a central error handling middleware, guaranteeing a consistent response shape `{ success: false, error: { code, message } }`.

### Q10: How does the Daily Sales report compute staff performance and payment channel metrics?
**Answer:** The `report.service.ts` queries all non-cancelled orders created within the specified UTC date window. It aggregates completed and paid tickets, grouping totals by payment method (Cash, UPI, Card), calculating cashier revenue leaderboard, and extracting top-selling items by portion count.
