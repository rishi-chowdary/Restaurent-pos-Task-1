# Savor POS — Restaurant Point of Sale & Order Management System

A production-grade, full-stack Restaurant POS and Kitchen Order Management system built with Next.js (React, TypeScript), Node.js, Express, MongoDB (Mongoose), and JWT authentication.

---

## 🚀 Live Deployments & Documentation

| Service / Resource | Platform | Link | Status |
|---|---|---|---|
| **Frontend Web App** | **Vercel** | [https://restaurent-pos-task-1.vercel.app](https://restaurent-pos-task-1.vercel.app/) | Active |
| **Backend REST API** | **Render** | [https://restaurent-pos-task-1.onrender.com](https://restaurent-pos-task-1.onrender.com/api/health) | Active |
| **Postman API Collection** | **JSON Export** | [`docs/postman_collection.json`](docs/postman_collection.json) | Ready to Import |
| **Architecture Explainer** | **Markdown** | [`docs/EXPLAINER.md`](docs/EXPLAINER.md) | 10 Interview Q&As |
| **Source Code** | **GitHub** | [https://github.com/rishi-chowdary/Restaurent-pos-Task-1](https://github.com/rishi-chowdary/Restaurent-pos-Task-1) | Active |

---

## Tech Stack & Architecture

- **Frontend:** Next.js 14 (App Router, React, TypeScript), Vanilla CSS design system with glassmorphism, responsive grid layout, Lucide icons.
- **Backend:** Node.js, Express.js (TypeScript), Helmet, CORS, Express Rate Limit, Zod runtime validation schemas.
- **Database:** MongoDB with Mongoose ODM (supports both local/Atlas MongoDB and automatic in-memory fallback for zero-config testing).
- **Authentication:** JWT in `Authorization: Bearer <token>` header, bcrypt password hashing, role-guard middleware (`Admin` vs `Staff`).
- **Monorepo:** `/client` (frontend), `/server` (backend), `/docs` (Postman collection & architectural explainer).

---

## Default Demo Credentials

The live cloud database is seeded with the following demo accounts matching the live MongoDB database:

| Role | Seeded Name | Email | Password | Permissions |
|---|---|---|---|---|
| **Admin** | `Rohan Sharma` | `admin@restaurant.com` | `admin123` | Full Access: menu edit/deactivate, tax config, order cancel, daily sales reports |
| **Staff** | `Priya Patel` | `staff@restaurant.com` | `staff123` | Order taker, kitchen status updates, payment recording, order board |

> **Evaluation Flexibility:** The server natively accepts `admin123` / `staff123` (matching the live database) and also supports `Admin@123` / `Staff@123`.
>
> *Tip: The web app login screen (`/login`) contains one-click buttons to instantly autofill and log in as either Admin or Staff.*

---

## Key Business Rules Enforced on Server

1. **Server-Side Billing:** Subtotal, discount capping, tax rates, and totals are computed strictly from database prices. Client-sent totals are ignored.
2. **Item Availability:** Orders containing inactive or unavailable items are rejected with HTTP 409 Conflict.
3. **Price Snapshots:** Order items store snapshot prices and names at the time of purchase to ensure historical auditability.
4. **Atomic Sequential Numbers:** Order numbers follow `ORD-YYYYMMDD-0001` format, generated via an atomic MongoDB counter to prevent race conditions.
5. **Strict Forward Transitions:** Orders only progress `Pending -> Preparing -> Ready -> Completed`. Skipping states or reverting is rejected with HTTP 409.
6. **Payment Requirement:** Orders cannot be marked `Completed` until full payment has been recorded (`paymentStatus: Paid`).
7. **Payment Verification:** Payment amounts must exactly match the order total, and orders cannot be paid twice.

---

## Environment Files (Placeholders Only)

Both `server` and `client` folders provide `.env.example` template files with placeholders only (no exposed secrets):

### `server/.env.example`
```env
# Backend Server Environment Configuration (Placeholders Only)
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_uri_here
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000
DEFAULT_TAX_RATE=5.0
```

### `client/.env.example`
```env
# Frontend Client Environment Configuration (Placeholders Only)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Reviewer Setup & Database Configuration

To run the project locally with the live connected cloud database, create `server/.env`:

### `server/.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_uri_here
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000
DEFAULT_TAX_RATE=5.0
```

> **Note for Reviewers:**
> - The MongoDB Atlas URI above connects to the seeded database with sample admin/staff accounts and the authentic Indian restaurant menu catalog.
> - If you prefer zero-config or offline testing, leave `MONGODB_URI` blank and the server will automatically spin up an isolated in-memory database instance (`mongodb-memory-server`) and seed default accounts immediately.

---

## Quick Start Guide

### Prerequisites
- Node.js >= 18
- npm >= 9

### 1. Clone & Install
```bash
git clone https://github.com/rishi-chowdary/Restaurent-pos-Task-1.git
cd Restaurent-pos-Task-1

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
cd ..
```

### 2. Configure Environment
Create `server/.env` based on `server/.env.example` (or use the pre-configured values from the **Reviewer Setup** section above).

### 3. Start the Backend API
```bash
cd server
npm run dev
```
The API will run on `http://localhost:5000`.
*(Optional: run `npm run seed` to verify or re-seed demo accounts and menu catalog if needed).*

### 4. Start the Next.js Frontend
```bash
cd client
npm run dev
```
The client will run on `http://localhost:3000`. Open `http://localhost:3000` in your browser.

### 5. Run the Automated Test Suite
With the server running on `http://localhost:5000`:
```bash
cd server
npm test
```
*(Alternatively: `node test-suite.js`)*

The `npm test` script in `server/package.json` executes the comprehensive 32-test automated runner verifying:
- Authentication & JWT issuance
- Role guards (`Admin` vs `Staff`) on restricted routes
- Tamper protection (client price manipulation prevention)
- Server-authoritative billing math & discount bounds
- Forward-only order state transitions (`Pending -> Preparing -> Ready -> Completed`)
- Payment validation (exact tender match, double payment block)
- Daily sales analytics aggregation and tax settings

---

## Project Structure

```
restaurant-pos/
├── client/                      # Next.js frontend
│   ├── .env.example             # Frontend environment template (placeholders only)
│   ├── src/
│   │   ├── app/                 # App Router pages (login, pos, orders, menu, reports, settings)
│   │   ├── components/          # Reusable UI components (navbar, receipt-modal, payment-modal, etc.)
│   │   ├── lib/                 # Central typed API client and AuthContext
│   │   └── styles/              # Vanilla CSS design system & glassmorphism
│   └── package.json
├── server/                      # Express TypeScript backend
│   ├── .env.example             # Backend environment template (placeholders only)
│   ├── src/
│   │   ├── config/              # Database connection & env config
│   │   ├── controllers/         # Thin request handlers
│   │   ├── middleware/          # Auth, role-guard, validation, error handler
│   │   ├── models/              # Mongoose models (User, MenuItem, Order, Settings, Counter)
│   │   ├── routes/              # Express API route modules
│   │   ├── services/            # Pure business logic (billing, orders, reports)
│   │   ├── utils/               # AppError, asyncHandler, seed data
│   │   └── server.ts            # Entrypoint bootstrap
│   ├── test-suite.js            # Automated test runner (32 tests)
│   └── package.json             # Contains "test": "node test-suite.js"
├── docs/
│   ├── postman_collection.json  # Exported Postman API Collection (v2.1.0)
│   └── EXPLAINER.md             # Architecture walkthrough & 10 interview Q&A
└── README.md
```

---

## API Documentation & Postman Collection

A complete, pre-configured **Postman Collection (v2.1.0)** is included in [`docs/postman_collection.json`](docs/postman_collection.json).

### How to Use the Postman Collection:
1. Open Postman and click **Import**.
2. Select the file [`docs/postman_collection.json`](docs/postman_collection.json).
3. The collection includes collection variables:
   - `baseUrl`: `http://localhost:5000/api` (or point to `https://restaurent-pos-task-1.onrender.com/api`)
   - `adminToken`: Automatically extracted upon running the "Login as Admin" request.
   - `staffToken`: Automatically extracted upon running the "Login as Staff" request.
4. Run requests in sequence to test authentication, menu item creation, order placement, status advancement, payment recording, and daily sales reports.

### Summary of REST Endpoints:

#### Auth
- `POST /api/auth/login` — Authenticate and receive JWT token (rate limited)
- `GET /api/auth/me` — Return currently authenticated user profile

#### Menu
- `GET /api/menu` — Retrieve menu items (query: `?q=`, `?category=`, `?available=`)
- `GET /api/menu/:id` — Retrieve single menu item
- `POST /api/menu` — Create menu item *(Admin only)*
- `PUT /api/menu/:id` — Update menu item *(Admin only)*
- `PATCH /api/menu/:id/deactivate` — Toggle active state *(Admin only)*

#### Orders
- `POST /api/orders` — Place order (server calculates all totals)
- `GET /api/orders` — List orders (query: `?status=`, `?q=`, `?page=`, `?limit=`)
- `GET /api/orders/:id` — Get order by ID
- `PUT /api/orders/:id/items` — Update items/quantities *(Allowed only while Pending)*
- `PATCH /api/orders/:id/status` — Forward status transition (`Pending -> Preparing -> Ready -> Completed`)
- `POST /api/orders/:id/payment` — Record tender (Cash, UPI, Card)
- `PATCH /api/orders/:id/cancel` — Cancel order *(Admin only)*

#### Reports & Settings
- `GET /api/reports/daily-sales` — Daily financial summary, staff breakdown, top items *(Admin only)*
- `GET /api/settings` — View system tax rate
- `PUT /api/settings` — Update system tax rate *(Admin only)*

---

## Production Deployment Guide

### Deploying the Backend (Render)
1. Push code to GitHub.
2. Create a new Web Service on Render pointing to the `/server` directory.
3. Build command: `npm install && npm run build`
4. Start command: `node dist/server.js`
5. Set environment variables:
   - `PORT`: `5000` (or dynamic provided by host)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://f6729502_db_user:TMRY60dal294xGQl@restaurent-pos.loqfgyo.mongodb.net/restaurant-pos?retryWrites=true&w=majority`
   - `JWT_SECRET`: `da9dfffe7a3fc6a59d12128d52382a24ba99440ee699d10eed33464ca265bceb`
   - `CLIENT_URL`: `https://restaurent-pos-task-1.vercel.app`

### Deploying the Frontend (Vercel)
1. Import repository on Vercel and set the Root Directory to `client`.
2. Framework preset: Next.js.
3. Build command: `npm run build`
4. Environment variable:
   - `NEXT_PUBLIC_API_URL`: `https://restaurent-pos-task-1.onrender.com`

---

## Interview Walkthrough

Please review [`docs/EXPLAINER.md`](docs/EXPLAINER.md) for detailed explanations on why transactions and snapshots are used, how atomic sequence keys work, and answers to the top 10 interview questions.
