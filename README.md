# Savor POS — Restaurant Point of Sale & Order Management System

A production-grade, full-stack Restaurant POS and Kitchen Order Management system built with Next.js (React, TypeScript), Node.js, Express, MongoDB (Mongoose), and JWT authentication.

---

## 🚀 Live Demo & Deployed URLs

| Service | Platform | Live URL | Status |
|---|---|---|---|
| **Frontend Web App** | **Vercel** | [https://restaurent-pos-task-1.vercel.app](https://restaurent-pos-task-1.vercel.app/) | Active |
| **Backend REST API** | **Render** | [https://restaurent-pos-task-1.onrender.com](https://restaurent-pos-task-1.onrender.com/api/health) | Active |
| **Source Code** | **GitHub** | [https://github.com/rishi-chowdary/Restaurent-pos-Task-1](https://github.com/rishi-chowdary/Restaurent-pos-Task-1) | Active |

---

## Tech Stack & Architecture

- **Frontend:** Next.js 14 (App Router, React, TypeScript), Vanilla CSS design system with glassmorphism, responsive grid layout, Lucide icons.
- **Backend:** Node.js, Express.js (TypeScript), Helmet, CORS, Express Rate Limit, Zod runtime validation schemas.
- **Database:** MongoDB with Mongoose ODM (supports both local/Atlas MongoDB and automatic in-memory fallback for zero-config testing).
- **Authentication:** JWT in `Authorization: Bearer <token>` header, bcrypt password hashing, role-guard middleware (`Admin` vs `Staff`).
- **Monorepo:** `/client` (frontend), `/server` (backend), `/docs` (architectural explainer & interview preparation).

---

## Default Demo Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@restaurant.com` | `admin123` | Full Access: menu edit/deactivate, tax config, order cancel, daily sales reports |
| **Staff** | `staff@restaurant.com` | `staff123` | Order taker, kitchen status updates, payment recording, order board |

*Tip: The login screen contains one-click buttons to instantly autofill either demo profile.*

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

## Reviewer Setup & Database Configuration

To run the project with the live connected cloud database, create a file named `.env` in the `server/` directory:

### `server/.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://f6729502_db_user:TMRY60dal294xGQl@restaurent-pos.loqfgyo.mongodb.net/restaurant-pos?retryWrites=true&w=majority
JWT_SECRET=da9dfffe7a3fc6a59d12128d52382a24ba99440ee699d10eed33464ca265bceb
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000
DEFAULT_TAX_RATE=5.0
```

> **Note for Reviewers:**
> - The MongoDB Atlas URI above is pre-configured and seeded with sample admin/staff accounts and the authentic Indian restaurant menu catalog.
> - If you prefer zero-config or offline testing, leave `MONGODB_URI` blank and the server will automatically spin up an isolated in-memory database instance (`mongodb-memory-server`).

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
Create `server/.env` with the values provided in the **Reviewer Setup** section above.

### 3. Start the Backend API
```bash
cd server
npm run dev
```
The API will run on `http://localhost:5000`.
*(Optional: run `npm run seed` to re-seed demo accounts and menu catalog if needed).*

### 4. Start the Next.js Frontend
```bash
cd client
npm run dev
```
The client will run on `http://localhost:3000`. Open `http://localhost:3000` in your browser.

### 5. Run the Automated Test Suite
With the server running on port 5000:
```bash
cd server
node test-suite.js
```
*Runs 32 automated tests verifying auth, role guards, tamper protection, billing math, status progression, payments, and reports.*

---

## Project Structure

```
restaurant-pos/
├── client/                      # Next.js frontend
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── login/           # Authentication page
│   │   │   ├── pos/             # Interactive POS order taker
│   │   │   ├── orders/          # Live kitchen order board & transitions
│   │   │   ├── menu/            # Admin menu catalog management
│   │   │   ├── reports/         # Admin daily sales analytics
│   │   │   └── settings/        # Admin tax rate configuration
│   │   ├── components/          # Reusable UI components
│   │   │   ├── navbar.tsx       # Role-aware navigation header
│   │   │   ├── receipt-modal.tsx# Thermal printable receipt modal
│   │   │   ├── payment-modal.tsx# Multi-channel checkout modal
│   │   │   └── edit-order-modal.tsx # Pending order editor
│   │   ├── lib/
│   │   │   ├── api.ts           # Centralized typed API client
│   │   │   └── auth-context.tsx # Auth context and role state
│   │   └── styles/
│   │       └── globals.css      # CSS design system & glassmorphism
├── server/                      # Express TypeScript backend
│   ├── src/
│   │   ├── config/              # Database connection & env config
│   │   ├── controllers/         # Thin request handlers
│   │   ├── middleware/          # Auth, role-guard, validation, error handler
│   │   ├── models/              # Mongoose models (User, MenuItem, Order, Settings, Counter)
│   │   ├── routes/              # Express API route modules
│   │   ├── services/            # Pure business logic (billing, orders, reports)
│   │   ├── utils/               # AppError, asyncHandler, seed data
│   │   ├── validations/         # Zod schemas for all endpoints
│   │   ├── app.ts               # Express application configuration
│   │   └── server.ts            # Entrypoint bootstrap
│   └── test-suite.js            # Comprehensive test runner
├── docs/
│   └── EXPLAINER.md             # Architecture walkthrough & 10 interview Q&A
└── README.md
```

---

## API Reference

### Auth
- `POST /api/auth/login` — Authenticate and receive JWT token (rate limited)
- `GET /api/auth/me` — Return currently authenticated user profile

### Menu
- `GET /api/menu` — Retrieve menu items (query: `?q=`, `?category=`, `?available=`)
- `GET /api/menu/:id` — Retrieve single menu item
- `POST /api/menu` — Create menu item *(Admin only)*
- `PUT /api/menu/:id` — Update menu item *(Admin only)*
- `PATCH /api/menu/:id/deactivate` — Toggle active state *(Admin only)*

### Orders
- `POST /api/orders` — Place order (server calculates all totals)
- `GET /api/orders` — List orders (query: `?status=`, `?q=`, `?page=`, `?limit=`)
- `GET /api/orders/:id` — Get order by ID
- `PUT /api/orders/:id/items` — Update items/quantities *(Allowed only while Pending)*
- `PATCH /api/orders/:id/status` — Forward status transition (`Pending -> Preparing -> Ready -> Completed`)
- `POST /api/orders/:id/payment` — Record tender (Cash, UPI, Card)
- `PATCH /api/orders/:id/cancel` — Cancel order *(Admin only)*

### Reports & Settings
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
   - `JWT_SECRET`: `pos_secret_key_development_change_in_production_jwt_9921`
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
