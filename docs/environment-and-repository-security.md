# Environment and repository security

## Rule: public variables versus secrets

Variables prefixed with `NEXT_PUBLIC_` or `EXPO_PUBLIC_` are compiled into browser or mobile bundles. They are public configuration, never secrets. `DATABASE_URL` and JWT secrets belong only to the API/Prisma environment.

## Local files

### Repository root `.env`

Used by Prisma commands, seed scripts, role-management scripts, and the local API:

```dotenv
DATABASE_URL="postgresql://postgres:LOCAL_PASSWORD@127.0.0.1:5432/terrasse_bleue?schema=public"
PORT=3001
HOST=0.0.0.0
JWT_ACCESS_SECRET="GENERATE_A_RANDOM_VALUE_OF_AT_LEAST_32_CHARACTERS"
JWT_REFRESH_SECRET="GENERATE_A_DIFFERENT_RANDOM_VALUE_OF_AT_LEAST_32_CHARACTERS"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"
CORS_ORIGIN="http://localhost:3000,http://localhost:3002,http://localhost:19006,http://localhost:8081,http://127.0.0.1:8081"
NODE_ENV="development"
```

Generate each JWT value independently, for example:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

### `apps/admin/.env.local`

```dotenv
NEXT_PUBLIC_API_URL="http://127.0.0.1:3001"
```

### `apps/menu/.env.local`

```dotenv
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_MENU_URL="http://localhost:3002/menu"
NEXT_PUBLIC_MOBILE_APP_URL=
NEXT_PUBLIC_MOBILE_APP_DISTRIBUTION="demo"
```

### `apps/mobile/.env`

Use the computer's LAN address when testing on a physical phone:

```dotenv
EXPO_PUBLIC_API_URL="http://YOUR_COMPUTER_LAN_IP:3001"
```

All real local environment files are ignored. Only `.env.example` files are committed.

## Hosted environments

### Render API — secrets and server configuration

Set these in the Render service Environment page:

```dotenv
NODE_ENV="production"
HOST="0.0.0.0"
DATABASE_URL="NEON_POOLED_POSTGRESQL_CONNECTION_STRING"
JWT_ACCESS_SECRET="RANDOM_VALUE_AT_LEAST_32_CHARACTERS"
JWT_REFRESH_SECRET="A_DIFFERENT_RANDOM_VALUE_AT_LEAST_32_CHARACTERS"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"
CORS_ORIGIN="https://YOUR-ADMIN.vercel.app,https://YOUR-MENU.vercel.app"
```

Do not set `PORT` on Render; Render injects it. Never add these API secrets to Vercel or Expo.

### Vercel admin — public configuration

```dotenv
NEXT_PUBLIC_API_URL="https://YOUR-API.onrender.com"
```

Set it for Production and Preview. If preview deployments must call the API, their exact origins also need to be allowlisted; otherwise configure only Production while preparing the demo.

### Vercel menu — public configuration

```dotenv
NEXT_PUBLIC_API_URL="https://YOUR-API.onrender.com"
NEXT_PUBLIC_MENU_URL="https://YOUR-MENU.vercel.app/menu"
NEXT_PUBLIC_MOBILE_APP_URL=
NEXT_PUBLIC_MOBILE_APP_DISTRIBUTION="demo"
```

If an approved HTTPS installation page becomes available, set `NEXT_PUBLIC_MOBILE_APP_URL` to it and redeploy.

### Expo mobile — public configuration

```dotenv
EXPO_PUBLIC_API_URL="https://YOUR-API.onrender.com"
```

This is embedded at build time. Restart/rebuild the app after changing it.

## Values that must never enter Git

- Real `.env`, `.env.local`, `.env.production`, or platform-exported env files
- Neon connection strings and database passwords
- JWT access/refresh secrets
- Administrator, staff, or customer passwords
- Vercel, Render, Neon, GitHub, Expo/EAS, or cloud tokens
- Android keystores, Apple certificates/provisioning files, private keys, or PEM files
- Database dumps containing customer/order data

## Pre-push cleanup

Safe to remove because they are generated locally:

- `node_modules/`
- every `.next/`, `dist/`, `build/`, `out/`, `coverage/`, `.expo/`, and `web-build/` directory
- `.vercel/`, `.turbo/`, `.cache/`
- `*.log`, `*.tsbuildinfo`, `npm-debug.log*`, `pnpm-debug.log*`
- temporary screenshots and `.demo-android-export/`

Keep and commit:

- `pnpm-lock.yaml`
- all source code and package manifests
- `prisma/schema.prisma`, every `prisma/migrations/*/migration.sql`, and seed data
- public brand/menu images and the final `menu-qr.png`
- all `.env.example` files
- deployment documentation under `docs/`

Before pushing, run `git status --short` and `git check-ignore -v <sensitive-file>` for any uncertain file. Never delete a file merely because it is untracked; verify whether it is source, migration, documentation, or a generated artifact first.
