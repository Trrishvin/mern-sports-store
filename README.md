# Fieldwork SportsGear

A full-stack MERN e-commerce application for sports equipment. Built with MongoDB, Express, React (Vite), and Node.js, it provides a complete online store experience — from product browsing and cart management to order placement and a full admin dashboard.

The product catalog is seeded from the free [DummyJSON](https://dummyjson.com) API, with real product images and prices converted to Indian Rupees (₹).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 4, React Router 7, Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB (Atlas or local) via Mongoose |
| Auth | JWT (JSON Web Tokens), bcryptjs |

## Features

### Customer
- Product browsing with search, category filter, price sorting, and pagination
- Product detail pages with multiple images and stock status
- Persistent browser cart (survives page refresh)
- User registration and login
- Cash-on-delivery checkout
- Personal order history with status tracking

### Admin
- Dedicated dashboard with revenue, product, and order summaries
- Full product management (create, edit, delete) with image URL support
- Category management
- Order status updates

### Catalog
- 17 real sports products imported from DummyJSON (cricket, football, tennis, badminton, and training gear)
- 5 categories matching the store's sport themes
- Prices stored and displayed in Indian Rupees (₹)
- Real product images served from DummyJSON's CDN

## Project Structure

```
mern-project/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/   # Navbar, ProductCard, etc.
│       ├── contexts/     # Auth, Cart, Toast providers
│       ├── lib/          # Axios API client
│       └── pages/        # Home, Products, Cart, Admin, etc.
└── server/          # Express backend
    ├── config/      # Database connection
    ├── middleware/  # Auth and admin guards
    ├── models/      # Mongoose schemas (User, Product, Category, Order)
    ├── routes/      # API route handlers
    └── scripts/     # Seed scripts
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- MongoDB Atlas account, or a local MongoDB instance

### 1. Clone and install

```bash
git clone https://github.com/Trrishvin/mern-sports-store.git
cd mern-sports-store

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
cd ..
```

### 2. Configure the server

Copy the example environment file and fill in your values:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?appName=Cluster0
JWT_SECRET=a-long-random-secret-string
JWT_EXPIRES_IN=7d
ADMIN_NAME=SportsGear Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SportsGearAdmin123!
```

> **Never commit `.env`** — it is already listed in `.gitignore`.

### 3. Seed the database

Import 17 real sports products from DummyJSON into your database (categories and products, no admin account touched):

```bash
cd server
npm run seed:api
```

To also create/update the demo admin account and sample data, run:

```bash
npm run seed
```

### 4. Run the app

Start the API server (terminal 1):

```bash
cd server
npm run dev
```

Start the React client (terminal 2):

```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser. The Vite dev server proxies
`/api` requests to the API at `http://localhost:5000` automatically, so no
extra configuration is needed for local development.

## Deploy to Vercel

This repo is configured as a Vercel **services** project (see `vercel.json`):
the `client` service (Vite) serves the React app, and the `server` service
(Express) handles `/api/*` routes on the same domain.

To deploy:

1. Push the repository to GitHub.
2. In [Vercel](https://vercel.com/new), import the repository — Vercel
   auto-detects the services setup from `vercel.json`.
3. Add these environment variables for the **server** service (Project
   Settings → Environment Variables):
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random secret
   - `JWT_EXPIRES_IN` — e.g. `7d`
4. Deploy. The client and API share one domain; the client calls the API at
   the relative path `/api`, which Vercel routes to the server service.

To test the full services setup locally, use
[`vercel dev`](https://vercel.com/docs/services) instead of running `npm run
dev` in each folder.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Log in, returns JWT |
| GET | `/api/products` | — | List products (search, filter, sort, paginate) |
| GET | `/api/products/:id` | — | Get a single product |
| POST | `/api/products` | Admin | Create a product |
| PATCH | `/api/products/:id` | Admin | Update a product |
| DELETE | `/api/products/:id` | Admin | Delete a product |
| GET | `/api/categories` | — | List categories |
| POST | `/api/categories` | Admin | Create a category |
| POST | `/api/orders` | User | Place an order (COD) |
| GET | `/api/orders/my` | User | Get current user's orders |
| GET | `/api/orders` | Admin | Get all orders |
| PUT | `/api/orders/:id/status` | Admin | Update order status |
| GET | `/api/health` | — | Health check (server + DB) |

Send the JWT in the `Authorization: Bearer <token>` header for authenticated requests.

## Demo Admin Login

After running `npm run seed` with the default `.env.example` values:

- **Email:** `admin@example.com`
- **Password:** `SportsGearAdmin123!`

Change these in `server/.env` before any real deployment.

## License

This project is open source and available for educational use.
