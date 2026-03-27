# freelancy-platform

## Core auth backend added

This project now includes an Express API for:

- User CRUD
- Register/Login
- JWT generation and validation
- Protected routes with `authMiddleware`

## Run

1. Install dependencies:

```bash
npm install
```

2. Create local env:

```bash
cp .env.example .env
```

3. Start frontend + backend:

```bash
npm run dev:all
```

Frontend runs on `http://localhost:5173` and API on `http://localhost:4000`.

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
