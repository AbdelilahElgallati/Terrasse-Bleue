# Terrasse Bleue — Technical Architecture

## Architecture

```text
                 CUSTOMER
                    |
                    v
          React Native / Expo
                    |
                  HTTPS
                    |
                    v
             NestJS REST API
                    |
          +---------+---------+
          |                   |
          v                   v
       Prisma             Socket.IO
          |                   |
          v                   v
     PostgreSQL        Live order updates
          |
          v
   Persistent source of truth


                 REST / HTTPS
                    |
                    v
             Next.js Admin
```

## Applications

```text
apps/
├── api/       NestJS + TypeScript
├── mobile/    Expo + React Native + TypeScript
└── admin/     Next.js + TypeScript
```

## Day 6.5 Public QR/Web Menu

```text
QR / Web (apps/menu) ----+
                         +--> SAME NestJS API --> SAME Prisma/PostgreSQL
Expo Mobile -------------+                              |
                                                        v
                                               SAME admin order queue
```

`apps/menu` reads active categories, available products, current prices, and active options from the public catalog API. Its localStorage cart is only a presentation estimate. CUSTOMER registration/login reuses the existing auth model; `POST /orders` validates availability/options, recalculates totals, and creates the same Order, OrderItems, Payment, and StatusHistory used by mobile and admin. No schema, web-order table, or second backend exists.

Tracking loads REST as truth, joins the existing authenticated private `order:<orderId>` Socket.IO room, refetches after events/reconnect, and polls as a fallback. The optional `?table=` URL shape is reserved for later metadata support and is not trusted or persisted in Day 6.5.

## Shared

```text
packages/
└── types/
```

Use shared types only where this reduces duplication and does not create unnecessary coupling.

## Day 3 Application Flow

```text
Expo Router screens
        |
Reusable presentation components
        |
TanStack Query + central API client
        |
NestJS controllers -> services -> singleton PrismaService
        |
PostgreSQL
```

Zustand remains responsible for the local cart and current-order navigation state.
SecureStore holds the refresh token; access tokens remain in memory and are
rotated through the central API client. Menu, authentication, order history, and
tracking use the REST API. Product image keys returned by PostgreSQL resolve to
bundled mobile assets, avoiding unstable external image URLs.

The provisional catalogue source is retained at
`prisma/data/terrasse_bleue_demo_seed.json`. The repeatable seed preserves its
14 restaurant-defined menu sections and 58 products, uses stable UUIDs derived
from source IDs, and deactivates obsolete seeded catalogue records instead of
deleting data that may later be referenced by orders. The supplied official
logo is bundled locally in mobile and admin; no remote branding URL is required.

Order creation is a single nested Prisma write: order, immutable item snapshots,
initial status history, and payment are committed atomically. Prices and the
authenticated user ID are always selected or calculated by the API.

## Database

PostgreSQL is the source of truth.

Prisma is the ORM/database access layer.

Initial entities:

- User
- Category
- Product
- ProductOption
- ProductOptionValue
- Order
- OrderItem
- OrderStatusHistory
- Payment
- Notification

## Order State Machine

```text
PENDING
   |
   v
CONFIRMED
   |
   v
PREPARING
   |
   v
READY
   |
   v
COMPLETED

PENDING ------> CANCELLED
CONFIRMED -----> CANCELLED
```

The backend must validate transitions. The client must never be trusted to send arbitrary valid-looking status changes.

## Payment Abstraction

Use an interface:

```text
PaymentProvider
├── MockPaymentProvider
└── Real provider later
```

The rest of the system must not depend directly on a specific payment company.

## Demo stabilization contract (2026-08-11)

- CASH/payment-on-site is the only actionable customer payment method. Both clients submit `CASH`, and the API rejects `ONLINE` with a validation error. Payment-provider schema fields remain only as an extension point.
- Every active product option is required by the current data model. Quick-add is available only when a product has no options; configurable products route through their option-selection screen. The API independently validates selections and calculates authoritative prices, option supplements, totals, and order snapshots.
- Customer tracking remains Socket.IO-first with reconnect and REST refresh/polling fallback. Admin status transitions and the room authorization model are unchanged.
- The admin connectivity badge now reflects `/health` checks. Pending-order notifications retain unseen orders in a session queue so bursts are not represented by one short-lived alert.
- QR generation requires an explicitly configured public URL and rejects localhost/loopback values. Table-aware QR metadata is not part of the current schema; table identifiers remain checkout notes and are a future enhancement.
- This pass does not add deployment infrastructure, a payment provider, push notifications, or a new domain model.

## Cross-platform design system (2026-08-12)

The UI architecture now follows three layers: shared framework-neutral presentation contracts in `@terrasse-bleue/types`, platform token adapters, and platform-native components. The shared package owns order-status presentation, canonical experience terminology, MAD formatting, brand primitives and base metrics. It does not expose React or React Native visual components.

Mobile maps the foundation through its native theme and Ionicons. The QR menu and admin use separate semantic CSS adapters and local SVG icon components. This preserves Expo/native interaction, public editorial menu presentation and admin operational density while removing duplicated status and currency logic.

Authentication, RBAC, pricing, payment persistence, Prisma models, Socket.IO and the order transition graph are unchanged by this UI convergence.

## Real-time

Socket.IO is used only to notify clients of committed order status updates. REST
and PostgreSQL remain authoritative.

```text
Expo tracking/detail screen
        | REST GET /orders/:id (initial truth)
        | Socket.IO /orders namespace + access JWT
        v
NestJS OrderEventsGateway
        | ownership check
        v
order:<orderId> room

ADMIN/STAFF PATCH /admin/orders/:id/status
        -> existing transition validation
        -> Prisma transaction (order + status history)
        -> transaction resolves
        -> order.status.updated emitted to order:<orderId>
```

Protocol:

```text
Namespace: /orders
Client events: order.join, order.leave
Server event: order.status.updated { orderId, status, updatedAt }
Error event: order.error
Room: order:<orderId>
```

The handshake accepts the existing access JWT in Socket.IO `auth.token` (or a
Bearer header). The gateway verifies it with `JWT_ACCESS_SECRET`; client-provided
user IDs and roles are ignored. Customer room membership requires a database query
matching both order ID and authenticated user ID. ADMIN/MANAGER/STAFF may join an
existing order for operational use. Room events contain no customer, payment, or
authentication data.

The Expo application owns one lazy socket instance. Login/session refresh updates
its token; logout disconnects it. Tracking and order-detail screens subscribe and
clean up listeners through a shared hook. Reconnect and app foreground cause a
room rejoin and TanStack Query invalidation/refetch. Background pauses the socket.
Malformed events are ignored. If Socket.IO is unavailable, manual refresh and REST
queries continue to work without blocking the screen.

## Security Baseline

- Argon2id password hashing
- short-lived access tokens
- refresh tokens
- RBAC
- DTO validation
- server-side price calculation
- order ownership checks
- CORS restrictions
- rate limiting for authentication
- HTTPS in deployed environments
- no secrets in Git
- no card data storage
- sanitized production errors

## Architectural Principle

Avoid:

- microservices
- Kubernetes
- complex event buses
- unnecessary abstractions
- premature optimization

The 7-day goal is reliable delivery, not maximum architectural complexity.

## Day 4 Restaurant Dashboard

The existing `apps/admin` Next.js application is the only restaurant dashboard.
It uses TanStack Query and a centralized authenticated API client. Access tokens
remain in memory and the existing refresh flow restores browser sessions. Frontend
code contains no JWT secret.

Only `/login` is public. Protected routes are `/dashboard`, `/orders`,
`/orders/[id]`, `/menu`, `/menu/categories`, `/menu/products`,
`/menu/products/[id]`, `/customers`, `/reports`, and `/settings`. The UI polls active
order data every 8-15 seconds, invalidates queries after mutations, and supports
manual refresh. NestJS guards remain the authoritative security boundary.

All `/admin/*` endpoints require JWT authentication and ADMIN, MANAGER, or STAFF.
They cover dashboard aggregates, order lists/details/status transitions, categories,
products/options, customers, reports, and settings. Category/product/option mutations
are restricted to ADMIN or the preserved legacy MANAGER role. STAFF can read
operational data and perform valid order transitions. CUSTOMER is always denied.
The backend validates the state machine and calculates aggregates; revenue counts
COMPLETED orders only.

Migration `20260810160841_day4_admin_dashboard` adds ADMIN and non-destructive
`isActive` fields to product options and values. Historical orders are not deleted
or rewritten. New order option selections store label and price snapshots so later
menu edits cannot change their historical display.

No settings table was invented. `/admin/settings` is read-only and returns only
known restaurant identity data; unmodeled contact, address, and opening-status fields
remain explicitly unconfigured.

## Day 6 Security and Test Hardening

Production and e2e startup share `configureSecurity`, which installs the strict
global ValidationPipe (`whitelist`, `forbidNonWhitelisted`, transformation), the
REST/Socket.IO `CORS_ORIGIN` allowlist, and the global exception filter. Unknown
errors and HTTP 5xx responses return only a generic French message; validation,
authentication, authorization, conflict, and not-found responses retain useful
4xx details. Full errors and stacks are logged server-side only.

Registration requires 8–128 characters with upper/lowercase, number, and symbol.
Order option selections must be UUID-to-UUID records. Client user IDs, roles,
prices, totals, payment state, ownership, and order status remain non-authoritative.

`POST /auth/login` is limited to 10 requests/IP/minute, registration to 5/IP per
5 minutes, and refresh to 20/IP/minute. This deliberately affects only sensitive
auth routes. It returns HTTP 429 and uses per-process memory; a shared Redis-backed
limiter is required before horizontal scaling or multi-instance deployment.

The e2e application uses the same validation/CORS/error/socket configuration and
a live PostgreSQL database. Its full flow creates isolated users, persists an
order, verifies cross-customer denial, promotes an isolated admin fixture, commits
a valid transition, observes `order.status.updated` through a real private Socket.IO
room, verifies REST history/final state, and removes its fixture records.
