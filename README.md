# Terrasse Bleue

## Project

Terrasse Bleue is a café & restaurant in Essaouira, Morocco. The project is a mobile ordering platform allowing customers to browse the restaurant menu, create an account, place café/restaurant orders, pay online in the future, and track orders.

The project has two principal user-facing applications:

1. Customer mobile application
2. Restaurant/admin web dashboard

A backend API and PostgreSQL database support both.
## Requirements

- Node.js 22+
- pnpm 10+
- PostgreSQL 14+ running locally or an accessible hosted development database

## Setup

1. Run `pnpm install`.
2. Create a PostgreSQL database named `terrasse_bleue`.
3. Copy `.env.example` to `.env` and replace all placeholder values. Never commit `.env`.
4. Run `pnpm db:validate`, `pnpm db:generate`, `pnpm exec prisma migrate deploy`, then `pnpm db:seed`.
5. Copy `apps/mobile/.env.example` to `apps/mobile/.env`. On a physical phone, replace `YOUR_COMPUTER_LAN_IP` with the computer's current Wi-Fi/LAN IPv4 address; `localhost` points to the phone itself.

The seed creates `client@terrassebleue.local` only when `SEED_CUSTOMER_PASSWORD` is supplied. Keep that password private and never commit it.

The menu seed is sourced from `prisma/data/terrasse_bleue_demo_seed.json` and preserves the café's 14 supplied sections and 58 provisional products. Entries marked `approx` or `demo` must be confirmed against the final restaurant menu before production. Detailed Windows instructions are in `docs/database-setup-windows.md`.

## Start

```bash
pnpm dev:api       # API on http://0.0.0.0:3001
pnpm dev:mobile    # Expo/Metro
pnpm dev:admin     # Next.js admin on http://localhost:3000
pnpm dev:menu      # Public menu on http://localhost:3002/menu
```
