# scheduling-api

NestJS + TypeScript backend for a scheduling app. Hosts publish time slots; guests book them. Booking confirmations are generated with OpenRouter (`nvidia/nemotron-3.5-lightning:free`).

## Stack

- NestJS 11
- PostgreSQL + Prisma
- OpenRouter Chat Completions API

## Setup

```bash
cp .env.example .env
docker compose up -d
npx prisma migrate dev --name init
npm run start:dev
```

Fill `OPENROUTER_API_KEY` in `.env` from [OpenRouter](https://openrouter.ai/keys).

## API (`/api`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/slots` | List all time slots |
| POST | `/api/slots` | Host creates a slot `{ date, startTime, duration }` |
| POST | `/api/slots/:id/book` | Guest books a slot `{ guestName, guestEmail }` |

Double-booking a slot returns `400 Bad Request`. Successful bookings include `aiConfirmationMessage`.

## Deploy (Render)

The repo ships a `render.yaml` blueprint. In the Render dashboard: **New → Blueprint**, point it at this repo, then set the two secrets it asks for:

| Secret | Value |
| --- | --- |
| `DATABASE_URL` | Supabase session-pooler URL, e.g. `postgresql://...@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require` |
| `OPENROUTER_API_KEY` | Key from https://openrouter.ai/keys |

Build runs `prisma generate` + `nest build`; start runs `prisma migrate deploy` before booting the server, so schema migrations apply automatically on deploy. Render injects `PORT` itself and the app listens on it. Health check hits `GET /api/slots`.

Alternatively create a plain **Web Service** with:

- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `npx prisma migrate deploy && node dist/main`
