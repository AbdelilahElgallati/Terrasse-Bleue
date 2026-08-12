# Terrasse Bleue — free demo hosting guide

## Target architecture

- Public menu: Vercel project rooted at `apps/menu`
- Administration: Vercel project rooted at `apps/admin`
- NestJS API and Socket.IO: Render free Web Service
- PostgreSQL: Neon free project
- Mobile application: uses the public Render API URL

The API is mandatory. The Vercel applications do not connect directly to PostgreSQL: menu, authentication, orders, administration, and real-time updates all pass through the NestJS API.

## 1. Prepare the repository

1. Create a private GitHub repository at <https://github.com/new>.
2. Push the project branch that contains all migrations and the latest UI changes.
3. Never commit `.env`, `.env.local`, database URLs, JWT secrets, or passwords.
4. Confirm locally:

   ```powershell
   pnpm install --frozen-lockfile
   pnpm typecheck
   pnpm lint
   pnpm test
   pnpm build
   pnpm db:validate
   ```

## 2. Create the free PostgreSQL database on Neon

1. Create an account and project at <https://console.neon.tech/>.
2. Select a European region close to Morocco.
3. Open **Connect**, select the pooled connection, and copy its PostgreSQL connection string.
4. Keep that string private. It becomes `DATABASE_URL` on Render and is used locally only while applying migrations or creating the administrator.
5. From the project root, temporarily set the Neon connection in the current PowerShell session and deploy the schema:

   ```powershell
   $env:DATABASE_URL="PASTE_NEON_POOLED_CONNECTION_STRING"
   pnpm db:generate
   pnpm exec prisma migrate deploy
   pnpm db:seed
   pnpm exec prisma migrate status
   ```

6. Clear the temporary value when finished:

   ```powershell
   Remove-Item Env:DATABASE_URL
   ```

`prisma migrate deploy` must report that the database schema is up to date. The seed is safe to rerun because catalogue records use upserts.

## 3. Host the NestJS API on Render

1. Open <https://dashboard.render.com/> and choose **New → Web Service**.
2. Connect the GitHub repository.
3. Configure:

   - Name: `terrasse-bleue-api`
   - Runtime: Node
   - Branch: the deployment branch
   - Root directory: leave empty (repository root)
   - Build command: `pnpm install --frozen-lockfile && pnpm db:generate && pnpm exec prisma migrate deploy && pnpm build:api`
   - Start command: `pnpm --filter @terrasse-bleue/api start:prod`
   - Health check path: `/health`
   - Instance type: Free

4. Add environment variables:

   ```text
   NODE_ENV=production
   HOST=0.0.0.0
   DATABASE_URL=<Neon pooled connection string>
   JWT_ACCESS_SECRET=<long random secret, minimum 32 characters>
   JWT_REFRESH_SECRET=<different long random secret>
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL=7d
   CORS_ORIGIN=https://YOUR-ADMIN.vercel.app,https://YOUR-MENU.vercel.app
   ```

   Do not manually set `PORT`; Render provides it.

5. Deploy and save the resulting URL, for example `https://terrasse-bleue-api.onrender.com`.
6. Open `https://YOUR-API.onrender.com/health`. It must return HTTP 200 and the API health JSON.

Render free services sleep after inactivity. Wake the API by opening `/health` about one minute before the presentation. Render supports WebSockets, but the first request after sleep can take around a minute.

## 4. Create the initial administrator

1. Register a normal account once against the hosted API:

   ```powershell
   $body = @{ name="Administrator"; email="YOUR_ADMIN_EMAIL"; password="YOUR_STRONG_PASSWORD" } | ConvertTo-Json
   Invoke-RestMethod -Method Post -Uri "https://YOUR-API.onrender.com/auth/register" -ContentType "application/json" -Body $body
   ```

2. In a new PowerShell session, temporarily set the Neon URL and promote only that account:

   ```powershell
   $env:DATABASE_URL="PASTE_NEON_POOLED_CONNECTION_STRING"
   pnpm user:set-role -- YOUR_ADMIN_EMAIL ADMIN
   Remove-Item Env:DATABASE_URL
   ```

3. Never promote the customer account used for mobile testing.

## 5. Deploy the admin to Vercel

1. Open <https://vercel.com/new> and import the same GitHub repository.
2. Create a project named `terrasse-bleue-admin`.
3. Set **Root Directory** to `apps/admin`.
4. Keep the detected Next.js framework and default install/build commands.
5. Ensure **Include source files outside of the Root Directory** is enabled because this monorepo uses `packages/types` and the root lockfile.
6. Add for Production, Preview, and Development:

   ```text
   NEXT_PUBLIC_API_URL=https://YOUR-API.onrender.com
   ```

7. Deploy and record the production URL.
8. Return to Render and update `CORS_ORIGIN` with the exact production admin origin, then redeploy/restart the API.

## 6. Deploy the public menu to Vercel

1. Import the repository again as a second Vercel project.
2. Name it `terrasse-bleue-menu`.
3. Set **Root Directory** to `apps/menu`.
4. Enable **Include source files outside of the Root Directory**.
5. Add:

   ```text
   NEXT_PUBLIC_API_URL=https://YOUR-API.onrender.com
   NEXT_PUBLIC_MENU_URL=https://YOUR-MENU.vercel.app/menu
   NEXT_PUBLIC_MOBILE_APP_URL=
   NEXT_PUBLIC_MOBILE_APP_DISTRIBUTION=demo
   ```

6. Deploy. Confirm these public routes:

   - `/menu`
   - `/robots.txt`
   - `/sitemap.xml`
   - `/manifest.webmanifest` if later added to the menu

7. Add the menu origin to Render `CORS_ORIGIN` and redeploy/restart the API.

## 7. Generate and test the production menu QR

1. Set `NEXT_PUBLIC_MENU_URL` in `apps/menu/.env.local` to the final Vercel `/menu` URL.
2. From the repository root run:

   ```powershell
   pnpm qr:menu
   ```

3. Confirm that `apps/menu/public/menu-qr.png` changed.
4. Commit that generated QR, push it, and wait for the menu project to redeploy.
5. Scan the QR using at least one Android phone and one iPhone if available. It must open the HTTPS production menu directly, without a Vercel authentication screen or redirect loop.

If a custom domain is added later, regenerate and recommit the QR using the custom URL.

## 8. Connect the mobile application

Set the Expo production/demo environment value before building or launching the application:

```text
EXPO_PUBLIC_API_URL=https://YOUR-API.onrender.com
```

Restart Expo with its cache cleared after changing this value. The mobile app, admin, and menu must all use the same hosted API and Neon database.

## 9. End-to-end acceptance test

Perform this in order shortly before the presentation:

1. Open API `/health` and wait until it responds.
2. Open the menu QR on a physical phone.
3. Verify categories, pagination, search, images, product details, logo/favicon, and responsive layout.
4. Log into the hosted admin with the promoted administrator account.
5. Create a temporary category and product, edit them, confirm they appear in the public menu, then hide them rather than deleting presentation data.
6. In mobile, place:
   - a café order;
   - a takeaway order;
   - an Essaouira delivery order with the 25 MAD fee;
   - an online-payment order.
7. Confirm every order appears in hosted admin with the correct service, address, fee, total, and payment state.
8. Advance one order through `PENDING → CONFIRMED → PREPARING → READY → COMPLETED` and verify mobile tracking updates.
9. Cancel one online-paid order and verify its payment becomes refunded.
10. Test admin and menu on desktop and a narrow phone viewport.
11. Check that browser developer tools show no CORS, mixed-content, failed API, or failed image requests.
12. Reopen `/health` immediately before the live presentation to wake the free Render service.

## 10. Free-tier caveats

- Vercel Hobby is appropriate for the two Next.js demo sites.
- Render free Web Services sleep after 15 minutes without inbound traffic and can take about one minute to wake.
- Neon Free is preferable to Render Free Postgres for this demo because Render's free PostgreSQL database expires after 30 days, whereas Neon provides a persistent free project subject to its usage limits.
- Uploaded catalogue images are currently stored as compressed data URLs in PostgreSQL. This works for a small demo catalogue, but real hosting should move uploads to object storage such as Cloudinary or an S3-compatible service.
- Keep a local export of essential demo data and all credentials in a secure password manager.
