# freelancy-platform

## Core auth backend added

This project now includes an Express API for:

- User CRUD
- Register/Login
- JWT generation and validation
- Protected routes with `authMiddleware`

## Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (running locally or remote)

## Setup & Run

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file from example:

```bash
cp .env.example .env
```

3. Configure `.env` with your MySQL credentials:

```
DB_HOST=your-database-host
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=freelancy
JWT_SECRET=your-long-random-secret-key
```

4. Initialize the database schema:

```bash
npm run db:init
```

5. Start frontend + backend:

```bash
npm run dev
```
(Frontend on `http://localhost:5173`, API on `http://localhost:4000`)

Or run them separately:
- Frontend: `npm run dev`
- Server: `npm run dev:server`

## API routes

Public:

- `POST /api/register`
- `POST /api/login`
- `GET /health`

Protected (requires JWT Bearer token):

- `GET /api/profile`
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

Example protected route usage:

```js
app.get("/profile", authMiddleware, (req, res) => {
  res.json({ userId: req.user.id });
});
```

## Token format

Send the JWT as:

```http
Authorization: Bearer <token>
```

If token is missing/invalid/expired, API returns `401`.
