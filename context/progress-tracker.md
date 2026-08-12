# Terrasse Bleue — 7-Day Progress Tracker

## How AI agents must use this file

Update this file after every meaningful milestone.

Do not mark a task complete unless it has actually been implemented and verified.

Use:

```text
[ ] Not started
[-] In progress
[x] Completed
[!] Blocked
```

Always include a short verification note and date.

---

# Day 1 — Foundation

## Repository

- [x] Git repository initialized
- [x] Day 1 foundation committed before Day 2 began
- [x] Root project structure created
- [x] README created
- [x] .env.example created

## API

- [x] NestJS app created
- [x] TypeScript configured
- [x] Environment configuration
- [x] Prisma installed
- [x] PostgreSQL connection configured through `DATABASE_URL`
- [x] `/health` implemented
- [x] API starts successfully

## Mobile

- [x] Expo app created
- [x] Expo Router configured
- [x] TypeScript configured
- [x] Base theme created
- [x] Mobile app starts

## Admin

- [x] Next.js app created
- [x] TypeScript configured
- [x] Tailwind configured
- [x] Admin app starts

## Database

- [x] Prisma initialized
- [x] Minimal PostgreSQL schema created (no application models yet)
- [ ] Migration runs (intentionally deferred until the first application schema)
- [ ] Seed runs (intentionally deferred until seedable models exist)

## Day 1 Verification

Status:

```text
PASS
```

Notes:

```text
Verified 2026-08-09 with Node.js 22.20.0 and pnpm 10.28.2.
pnpm install --frozen-lockfile, typecheck, lint, unit test, API e2e test,
NestJS build, Next.js production build, Prisma validate, and Prisma generate pass.
Runtime smoke tests: GET /health returned the expected JSON, the admin app returned
HTTP 200, and Expo/Metro opened its development-server port successfully.
Migration and seed are not failures: Day 1 explicitly has no application models yet.
The working tree remains uncommitted; no commit was requested or created.
```

---

# Day 2 — Customer UI

- [x] Splash
- [x] Home
- [x] Categories
- [x] Menu
- [x] Product card
- [x] Product detail
- [x] Cart
- [x] Checkout UI
- [x] Order confirmation
- [x] Order tracking
- [x] Order history and details
- [x] Profile and authentication placeholder
- [x] Loading states
- [x] Empty states
- [x] Error states

Verification:

```text
PASS

Verified 2026-08-09:
- workspace TypeScript typecheck passes
- workspace ESLint passes
- Expo SDK dependency compatibility check passes
- Expo Router generated typed routes for the complete customer flow
- Expo/Metro starts successfully
- production-style Android bundle exports successfully (1,328 modules)
- web bundle exports successfully (901 modules)
- focused cart behavior harness passes add, option pricing, totals, increase,
  decrease, retained Zustand state, and remove behavior
- five local optimized demo menu images were generated and visually inspected

Physical Android testing completed with the SDK 57-compatible Expo Go client.
The complete customer flow was reviewed on-device. A cart-card thumbnail stretch
found during device QA was corrected and the mobile typecheck and lint rerun pass.
```

---

# Day 3 — Backend + Authentication + Orders

## Auth

- [x] Register
- [x] Login
- [x] Refresh
- [x] Logout
- [x] `/auth/me`
- [x] Protected routes and reusable RBAC guards

## Menu

- [x] Categories API
- [x] Products API
- [x] Product details API

## Orders

- [x] Create order service and endpoint
- [x] Server-side price and option calculation
- [x] Order ownership enforcement
- [x] Get own orders
- [x] Get order details and status
- [x] Status history creation
- [x] Cancel eligible order
- [x] Payment abstraction record

## Mobile integration

- [x] Auth connected and manually verified against PostgreSQL
- [x] Menu connected and manually verified against PostgreSQL
- [x] Local cart retained and connected to order request payload
- [x] Checkout connected and manually verified
- [x] Real order created and persisted

## Database

- [x] Application schema validates
- [x] Prisma Client generates
- [x] Initial PostgreSQL migration SQL generated
- [x] Repeatable seed script implemented
- [x] Supplied café menu validated and mapped (14 sections, 58 products)
- [x] Supplied logo integrated in mobile splash and admin foundation
- [x] Migration applied to PostgreSQL 18.4
- [x] Seed executed (14 categories and 58 products)

Verification:

```text
PASS

Manually verified 2026-08-10:
- PostgreSQL 18.4, migration, seed, API, Expo authentication, real menu, cart,
  checkout, order persistence, order history, and logout/login persistence all pass.
- The seeded database contains 14 categories and 58 products.
```

---

# Day 4 — Restaurant Dashboard

- [x] Real ADMIN/STAFF authentication and protected routes
- [x] Operational dashboard using database aggregates
- [x] Polling orders list with status filters and search
- [x] Complete order details and status history
- [x] Server-authoritative status transitions
- [x] Categories create/edit/activation management
- [x] Products create/edit/availability management
- [x] Product option/supplement management
- [x] Read-only customer aggregates
- [x] V1 reports using real database data
- [x] Read-only settings for currently modeled restaurant information
- [x] CUSTOMER rejection and STAFF/ADMIN authorization tests

Verification:

```text
PARTIAL

Implemented and automatically verified 2026-08-10:
- Existing `apps/admin` provides all requested Day 4 routes.
- Dedicated authenticated `/admin/*` endpoints provide dashboard, orders, menu,
  customers, reports, and settings data.
- ADMIN and legacy MANAGER manage the menu; STAFF operates orders and reads
  dashboard data; CUSTOMER is denied all admin endpoints.
- A proper migration adds ADMIN and option/value activation flags without a reset.
- Frozen install, Prisma checks, API checks, 22 unit tests, 2 live-database e2e
  tests, admin checks, mobile checks, and Android/web Expo export pass.

Manual Day 4 verification pending:
- Promote a real existing account to ADMIN or STAFF and exercise the full staff
  browser flow alongside a physical customer phone.
- Day 4 must not be recorded as PASS until this workflow is manually observed.
```

---

# Day 5 — Real-Time Tracking

- [x] Socket.IO configured
- [x] Authenticated per-order rooms with customer ownership enforcement
- [x] Post-transaction `order.status.updated` event emission
- [x] Singleton mobile socket listener lifecycle
- [x] Customer tracking and order-detail live updates
- [x] Existing REST admin transition flow publishes confirmed updates
- [x] Reconnect, foreground refetch, and room rejoin behavior
- [x] REST/PostgreSQL remains the source of truth

Verification:

```text
PARTIAL

Implemented and automatically verified 2026-08-10:
- Socket authentication reuses the access JWT and derives user ID/role only from
  its verified claims. Anonymous sockets are disconnected.
- Customers can join only `order:<orderId>` rooms backed by an ownership query;
  staff roles may join an existing operational order room.
- Admin/staff transitions retain the Day 4 state machine and Prisma transaction.
  `order.status.updated` is emitted only after the transaction resolves.
- Mobile uses one lazy Socket.IO client, validates event shapes, removes screen
  listeners, pauses in background, and refetches REST on reconnect/foreground.
- Frozen install, Prisma validate/generate, API typecheck/lint/build, 27 unit
  tests, 2 live-database e2e tests, mobile typecheck/lint, Android export, and
  admin typecheck/lint/production build pass.

Physical phone → admin browser → phone verification remains pending. Day 5 must
not be recorded as PASS before that workflow is manually observed.
```

---

# Day 6 — Polish + Security + Tests

## UI

- [x] Branding and application metadata reviewed
- [x] Product/category/cart/detail image fallbacks
- [x] Typography and small-screen readability reviewed
- [x] Mobile/admin spacing reviewed without structural redesign
- [x] Subtle press feedback retained/extended
- [x] Six-state semantic order status visuals
- [x] Reusable sanitized loading/empty/error handling

## Security

- [x] DTO validation and nested UUID option validation
- [x] RBAC verified for CUSTOMER/STAFF/MANAGER/ADMIN
- [x] REST and realtime order ownership verified
- [x] Conservative auth-only rate limiting
- [x] Shared REST/Socket.IO CORS allowlist configuration
- [x] Tracked-file secrets and ignored `.env` audit
- [x] Production-safe exception response sanitization

## Tests

- [x] Auth
- [x] Menu
- [x] Cart
- [x] Order creation
- [x] Invalid order
- [x] Admin status change
- [x] Real-time status
- [x] PostgreSQL end-to-end flow

Verification:

```text
PARTIAL

Implemented and automatically verified 2026-08-10:
- Official mark now drives Expo icon/favicon metadata; existing mobile/admin logo
  placement remains consistent without duplication.
- Shared mobile image fallback protects remote product/category images; status
  badges distinguish all six states consistently; press feedback remains subtle.
- Registration password complexity, nested option UUID validation, whitelist input
  rejection, memory-based auth endpoint throttling, shared CORS setup, and sanitized
  5xx/unknown exception responses are implemented.
- Expanded API tests cover auth refresh/logout/rate limits, DTO manipulation,
  RBAC, product visibility, order pricing/snapshots, invalid transitions, ownership,
  realtime staff/customer rooms, malformed input, and exception sanitization.
- Live PostgreSQL e2e covers registration, menu, order persistence, cross-customer
  denial, admin transition, private Socket.IO delivery, history, and final state.
- Final verification passes: frozen install; Prisma validate/generate/migrate
  status; API typecheck/lint/build, 49 unit tests and 6 PostgreSQL e2e tests;
  cart behavior check; mobile typecheck/lint/Expo compatibility/Android export;
  admin typecheck/lint/production build; tracked-file secrets/CORS/trust audit.

Manual customer/admin UI and physical-device realtime/network-interruption checks
remain required, so Day 6 is PARTIAL rather than PASS.

Known limitation: auth throttling is per-process memory state and must be replaced
with a shared store for horizontally scaled production. `pnpm audit --prod` reports
three Expo toolchain transitive advisories (two `image-size`, one `uuid`) with no
compatible direct application fix available in the current Expo SDK lock.
```

---

# Day 6.5 — Public QR/Web Menu

- [x] Public API-backed category and product menu
- [x] Anonymous persistent web cart with product options
- [x] Existing CUSTOMER authentication at checkout
- [x] Existing server-authoritative CASH order creation
- [x] Branded confirmation and REST/Socket.IO order tracking
- [x] QR generator and production URL documentation
- [x] Responsive/accessibility styling and branded image fallback
- [x] Focused cart tests

Verification:

```text
PARTIAL

Implemented and automatically verified 2026-08-11 without a database migration
or parallel backend/order model. Menu typecheck, lint, 2 cart tests, production
build, QR generation, API typecheck, and API build pass. Physical QR scanning and
the browser → PostgreSQL → admin → realtime browser workflow remain manual checks.
```

---

# Demo Stabilization — Pre-Day-7 Safety Pass

- [x] Removed ONLINE payment from actionable mobile and web checkout
- [x] API rejects ONLINE orders while preserving future payment fields
- [x] Configurable products cannot bypass option selection through quick-add
- [x] API enforces active option selection and remains authoritative for totals
- [x] QR generation requires an explicit non-loopback URL
- [x] Admin connection status is health-derived rather than static
- [x] Admin pending-order alerts retain burst orders until acknowledged
- [x] Mobile safe-area, keyboard, touch-target, feedback, and status clarity fixes
- [x] Local seed verified: 14 active categories and 58 available products
- [ ] Final physical phone/QR/admin/realtime rehearsal on the demonstration network
- [ ] Confirm private ADMIN and STAFF credentials before the demonstration

Automated verification on 2026-08-11: frozen install, Prisma validate/generate/migration status, API typecheck/lint/54 unit tests/7 live PostgreSQL e2e tests, mobile typecheck/lint/cart assertions/Expo dependency check/Android export, menu typecheck/lint/3 tests/production build, admin typecheck/lint/production build, seed-data comparison, tracked-secret scan, and `git diff --check`. Menu lint retains four non-blocking existing `<img>` optimization warnings. No deployment or Day 7 work was performed.

## UI/UX convergence pass — 2026-08-12

- [x] Framework-neutral order-status presentation contract
- [x] Shared MAD and supplement formatting
- [x] Canonical experience/payment terminology
- [x] Semantic mobile, QR and admin token adapters
- [x] Removed hard-coded preparation-time contradictions
- [x] Accessible customer status timelines and announcements
- [x] QR contrast, compact mobile hero, checkout choice semantics and stroke-icon adapter
- [x] Admin Geist typography, global focus, reduced motion, semantic statuses and stroke-icon adapter
- [x] Accessible admin menu editor dialog with focus trap, Escape and focus restoration
- [x] No business logic, database, auth, RBAC, pricing or realtime architecture changes
- [ ] Manual browser visual/keyboard/screen-reader QA (browser runtime unavailable during this pass)
- [ ] Physical Expo device QA for font scaling, screen reader, safe areas and motion

Verification completed on 2026-08-12: frozen workspace install; shared-types, mobile, menu, admin and API typechecks; mobile, menu, admin and API lint; 54 API unit tests; 7 live PostgreSQL/Socket.IO e2e tests; 5 menu/shared-contract tests; mobile cart assertions; Expo dependency compatibility; Android export; menu and admin production builds; tracked-secret pattern scan; and `git diff --check`. Menu lint retains four known non-blocking `<img>` optimization warnings. The generated Android export directory was removed after validation. Browser visual QA could not run because the available browser-control runtime failed to initialize; no visual verification is claimed.

# Day 7 — Deployment + Demo

## View-only QR menu conversion — 2026-08-12

- [x] Public menu browsing preserved
- [x] Product options and supplements presented as read-only information
- [x] Cart, checkout, web authentication, order creation, cancellation, and tracking retired
- [x] Legacy order routes redirect with a helpful explanation
- [x] In-café customers instructed to order directly through their server
- [x] Configurable application installation CTA
- [x] Separate conditional application-install QR generation
- [x] Known legacy cart/auth/order browser storage removed safely
- [ ] Final application installation HTTPS URL pending team/provider decision
- [ ] Physical menu QR and application-link rehearsal pending

## Demo delivery/payment and responsive admin — 2026-08-12

- [x] Demo-safe delivery checkout architecture separated from API order types
- [x] Essaouira-only delivery address for the current order
- [x] Fixed 25 MAD demo delivery fee
- [x] Cash on delivery
- [x] Simulated online payment without real card-data collection
- [x] Clearly identified local demo confirmation and tracking
- [x] Existing real dine-in/takeaway cash order flow preserved
- [x] Current API continues rejecting unsupported online orders
- [x] Admin responsive shell, navigation, tables, forms, panels, and dialogs hardened
- [x] Mobile typecheck and lint
- [x] Admin typecheck, lint, and production build
- [x] Focused API order safety tests (20 tests)
- [!] Browser viewport QA blocked by unavailable in-app browser runtime; manual checklist created
- [!] Android export command exceeded the execution timeout; device/export rehearsal remains manual

Manual checklist: `docs/demo-rehearsal-checklist.md`.

- [ ] API deployed
- [ ] Production database configured
- [ ] Admin deployed
- [ ] Mobile production/preview configuration
- [ ] HTTPS verified
- [ ] Demo accounts
- [ ] Demo seed
- [ ] End-to-end test
- [ ] Demo script
- [ ] Backup plan
- [ ] Final README

Verification:

```text
NOT STARTED
```

---

# Current Blockers

```text
No known implementation blocker. Demo sign-off still requires one physical
cross-device rehearsal on the final network, confirmation of the private ADMIN
and STAFF credentials, and regeneration/scanning of the QR if the host IP changes.
```

# Current Decisions

```text
Backend: NestJS
Database: PostgreSQL
ORM: Prisma
Mobile: Expo + React Native
Admin: Next.js
Realtime: Socket.IO
Server state: TanStack Query
Local/cart state: Zustand
Auth: JWT + refresh tokens
Password hashing: Argon2id
Payment: CASH/payment-on-site only; ONLINE is rejected and reserved for a future provider
```

# Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-08-09 | Use PostgreSQL + Prisma | Relational order/menu data and TypeScript safety |
| 2026-08-09 | Use NestJS | Structured backend suitable for production evolution |
| 2026-08-09 | Use Expo React Native | Fast mobile MVP delivery |
| 2026-08-09 | Use Next.js admin | Fast restaurant dashboard development |
| 2026-08-09 | Keep future payment fields in the model | A real provider depends on client/merchant requirements |
| 2026-08-11 | Enforce CASH-only ordering for the client demo | Prevents a future-provider abstraction from appearing operational |
| 2026-08-09 | Keep Day 2 menu data in a replaceable local data module | Day 3 can swap in API data without rewriting screen components |
| 2026-08-09 | Use Zustand only for local cart and demo-order state | Preserves navigation state without introducing fake API infrastructure |
| 2026-08-09 | Keep refresh tokens in Expo SecureStore and access tokens in memory | Reduces token exposure while supporting session restoration |
| 2026-08-09 | Map database image keys to bundled mobile assets | Preserves reliable Day 2 imagery without remote URL dependencies |
| 2026-08-09 | Preserve the supplied restaurant section hierarchy as seed source | Keeps the app aligned with the café's real menu organization while content remains provisional |

# Change Log

| Date | Change | Agent/Developer |
|---|---|---|
| 2026-08-09 | Initial context pack created | Developer |
| 2026-08-09 | Day 1 foundation completed and verified | Codex |
| 2026-08-09 | Day 2 customer mobile journey implemented; interactive device QA pending | Codex |
| 2026-08-09 | Day 2 physical-device QA passed after cart thumbnail layout correction | Developer + Codex |
| 2026-08-09 | Day 3 backend/mobile integration implemented; database verification blocked by missing PostgreSQL | Codex |
| 2026-08-09 | Supplied café logo integrated and 14-section/58-product menu seed imported and validated | Codex |
| 2026-08-10 | Day 3 PostgreSQL-to-mobile flow manually verified and recorded as PASS | Developer + Codex |
| 2026-08-10 | Day 4 dashboard/API, RBAC, migration, and automated verification implemented | Codex |
| 2026-08-10 | Day 5 authenticated per-order Socket.IO tracking and automated verification implemented; physical-device workflow pending | Codex |
| 2026-08-10 | Day 6 UI resilience, security hardening, expanded tests, and PostgreSQL realtime e2e implemented; manual QA pending | Codex |
| 2026-08-11 | Pre-Day-7 demo stabilization completed and automatically verified; physical rehearsal pending | Codex |
