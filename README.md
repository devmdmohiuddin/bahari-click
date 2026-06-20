# Bahari Click

E-commerce storefront for products sourced from China and sold in Bangladesh.
**Cash on Delivery only** at launch · Currency: **BDT**.

One Next.js app serves three surfaces — storefront (`/`), admin (`/admin`), and
API/webhooks (`/api/*`) — backed by Postgres via Prisma, with BD integrations
(SMS, courier) behind swappable adapters. Full docs in [`docs/`](./docs).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 + shadcn/ui · Prisma 7 +
PostgreSQL · Better Auth (phone+OTP for customers, email+role for admins) ·
Zod · Cloudinary · Sentry.

## Getting started (Phase 0)

Dev runs at **৳0** — paid services are mocked (see
[docs/06-cost-and-free-tiers.md](./docs/06-cost-and-free-tiers.md)).

```bash
cp .env.example .env          # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
npm install
npm run db:up                 # local Postgres in Docker (host port 5433)
npm run db:migrate            # apply migrations
npm run db:seed               # create the first OWNER admin
npm run dev                   # http://localhost:3000
```

Seed creates `owner@bahari.local` / `Owner@12345` — sign in at `/admin/login`.
Customer OTP codes are logged to the server console by the mock SMS adapter.

## Scripts

| Script                                         | What it does                           |
| ---------------------------------------------- | -------------------------------------- |
| `npm run dev` / `build` / `start`              | Next.js dev / production build / serve |
| `npm run typecheck` / `lint` / `format`        | TS check · ESLint · Prettier write     |
| `npm run db:up` / `db:down`                    | Start / stop the Postgres container    |
| `npm run db:migrate` / `db:seed` / `db:studio` | Migrate · seed · Prisma Studio         |

## Project layout

```
src/
  app/                 storefront, admin (auth-guarded), api routes
  components/ui/        shadcn components
  lib/                  db, auth, cloudinary, result/error helpers
  server/
    actions/            Server Actions (thin: validate → service → Result)
    services/           domain logic (only layer that touches Prisma/integrations)
    validators/         Zod schemas (shared client/server)
    integrations/       sms/ + courier/ adapters (mock in dev, real at launch)
  proxy.ts             edge guard for /admin
prisma/                schema, migrations, seed
```
