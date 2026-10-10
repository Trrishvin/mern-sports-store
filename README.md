# Fieldwork SportsGear

A demo MERN sports equipment store with a React/Vite client, Express API, and
MongoDB database.

## Requirements

- Node.js 20 or newer and npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup

From the project root, create the server environment file:

```powershell
Copy-Item server\.env.example server\.env
```

The example uses a local MongoDB URI:

```env
MONGO_URI=mongodb://127.0.0.1:27017/mern_project
```

If you use MongoDB Atlas, replace `MONGO_URI` in `server/.env` with your Atlas
connection string. Keep `.env` private and do not commit it.

Install dependencies in each app:

```powershell
Set-Location server
npm install
Set-Location ..\client
npm install
Set-Location ..
```

Seed five product categories, 15 sample sports products, and the demo admin:

```powershell
Set-Location server
npm run seed
```

The seed script is repeatable. It reads `ADMIN_NAME`, `ADMIN_EMAIL`, and
`ADMIN_PASSWORD` from `server/.env`, creates or updates that admin account,
and sets the account password to the configured value.

## Demo admin login

The checked-in `server/.env.example` is configured for this local-only demo
account:

- **Email:** `admin@example.com`
- **Password:** `SportsGearAdmin123!`

These credentials work after copying the example environment file and running
the seed script. Change them in `server/.env` before sharing a deployment. The
example `JWT_SECRET` is also for local development only; replace it with a
long, random secret outside your local machine.

Customers can register through the client at `/register`.

## Run the applications

Start MongoDB first. Then run the API in one terminal:

```powershell
Set-Location server
npm run dev
```

The API runs at `http://localhost:5000`; check
`http://localhost:5000/api/health` for server and database status.

Run the client in a second terminal:

```powershell
Set-Location client
npm run dev
```

Open the Vite URL printed in the terminal (usually
`http://localhost:5173`). The client connects to `http://localhost:5000/api` by
default. To override it, set `VITE_API_URL` in `client/.env.local`.

## Features

- Product browsing with search, category filter, sorting, pagination, and
  product details.
- Persistent browser cart and authenticated Cash on Delivery checkout.
- Registration, login, and personal order history.
- Admin dashboard at `/admin` for product/category management, order status
  updates, and product/order/revenue summaries.
- Responsive Tailwind CSS UI.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/products` (search, category, price range, sort, pagination),
  `GET /api/products/:id`
- `GET /api/categories`
- Admin-only product and category `POST`, `PATCH /:id`, and `DELETE /:id`
- `POST /api/orders`, `GET /api/orders/my`
- Admin-only `GET /api/orders` and `PUT /api/orders/:id/status`

Send the JWT returned by login or registration in the `Authorization: Bearer
<token>` header for authenticated API requests.
