# Terrasse Bleue — Demo Delivery, Demo Online Payment, and Responsive Admin Plan

**Status:** Proposed — awaiting team confirmation  
**Prepared:** 2026-08-12  
**Implementation authorization:** Not yet granted  

## 1. Objective

Prepare Terrasse Bleue for its demonstration by:

1. Adding a delivery checkout experience to the Expo mobile application.
2. Limiting delivery to Essaouira with a fixed delivery fee of **25 MAD** whit posibiliyy of chnge by admin.
3. Collecting a delivery address for the current order only.
4. Allowing both cash and simulated online payment in the demo checkout.
5. Making the complete Next.js admin application correctly responsive.
6. Preserving the existing QR/web menu without responsive changes.

This phase is intentionally a demonstration implementation. It must present a convincing end-to-end user experience without pretending that money has been processed by a real payment provider.

## 2. Confirmed Product Decisions

| Topic | Confirmed decision |
|---|---|
| Delivery availability | All of Essaouira city for the demo |
| Delivery fee | Fixed at 25 MAD |
| Delivery address | Used for the current order only; not saved to the customer profile |
| Cash for delivery | Available |
| Online payment | Simulated demo flow only |
| Real payment provider | To be discussed during demo-day scheduling |
| Admin scope | Make only `apps/admin` fully responsive |
| QR/web menu | Out of scope; considered already responsive |

## 3. Safety and Demo Rules

The current API supports only `DINE_IN` and `TAKEAWAY`, and explicitly rejects `ONLINE`. The database also has no delivery address or delivery fee on an order. Therefore, this demo phase will use a controlled frontend simulation.

The following rules are mandatory:

- The application must not claim that a bank, card, or payment provider charged the customer.
- Online payment must be labelled as a demo/simulation in the payment screen and confirmation.
- No real card number, expiry date, CVV, banking credential, or identity document will be requested or stored.
- Demo card fields, if shown, will accept only non-sensitive fictional values or use a single “Simulate successful payment” action.
- Unsupported demo data must not be silently converted into misleading server data.
- Existing real dine-in/takeaway cash ordering must continue working.
- Demo state must be isolated so it can later be removed or replaced by a real provider integration.

## 4. Current Architecture

```text
Expo mobile app ───────┐
                       ├── REST + Socket.IO ── NestJS API ── Prisma ── PostgreSQL
Next.js admin ─────────┤
                       │
Next.js QR/web menu ───┘

Shared terminology/types: packages/types
Mobile local state: Zustand
Remote state/cache: TanStack Query
Authentication: JWT + refresh tokens
Realtime tracking: Socket.IO
```

Relevant implementation areas:

- Mobile checkout: `apps/mobile/src/app/checkout.tsx`
- Mobile order mapping: `apps/mobile/src/types/menu.ts`
- Mobile order state: `apps/mobile/src/store/order-store.ts`
- Mobile cart state: `apps/mobile/src/store/cart-store.ts`
- Admin shell: `apps/admin/src/components/admin-shell.tsx`
- Admin global styles: `apps/admin/src/app/globals.css`
- Admin pages: `apps/admin/src/app/(protected)/*`
- Current order DTO: `apps/api/src/orders/dto/create-order.dto.ts`
- Current order service: `apps/api/src/orders/orders.service.ts`
- Database schema: `prisma/schema.prisma`

## 5. Demo Architecture

### 5.1 Supported paths

| Service type | Cash | Demo online payment | Server persistence |
|---|---:|---:|---|
| Dine-in | Yes | Yes, simulated | Cash path uses existing API; demo-online uses demo state |
| Takeaway | Yes | Yes, simulated | Cash path uses existing API; demo-online uses demo state |
| Delivery | Yes | Yes, simulated | Demo state only unless a small demo API extension is separately approved |

### 5.2 Recommended demo strategy

Use two explicit order modes inside the mobile application:

```text
REAL_SUPPORTED_ORDER
  └── DINE_IN or TAKEAWAY + CASH
      └── Existing POST /orders

DEMO_ORDER
  └── DELIVERY and/or ONLINE
      ├── Validate locally
      ├── Simulate payment when selected
      ├── Create a local demo-order snapshot
      └── Show demo confirmation and demo tracking state
```

This strategy avoids weakening the API validation or inserting incomplete delivery/payment records into PostgreSQL.

### 5.3 Demo limitations shown to the user

- Delivery checkout will state: “Livraison disponible à Essaouira — frais fixes 25 MAD.”
- Online payment will state: “Simulation de paiement pour la démonstration — aucun débit réel.”
- Confirmation will show a visible “Mode démonstration” badge for simulated orders.
- Demo orders will not appear in the real admin order queue unless a later demo-persistence extension is explicitly approved.
- The demo payment must not use real financial branding unless the chosen provider has been approved.

## 6. Mobile Checkout Design

### 6.1 Proposed feature structure

```text
apps/mobile/src/features/checkout/
├── types.ts
├── validation.ts
├── demo-order.ts
├── components/
│   ├── FulfillmentSelector.tsx
│   ├── DeliveryAddressForm.tsx
│   ├── PaymentMethodSelector.tsx
│   ├── DemoPaymentPanel.tsx
│   └── CheckoutSummary.tsx
└── hooks/
    └── useCheckout.ts
```

The route `apps/mobile/src/app/checkout.tsx` remains the screen entry point and composes the feature components.

### 6.2 Checkout types

```ts
type CheckoutFulfillment = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
type CheckoutPayment = 'CASH' | 'ONLINE_DEMO';

type DeliveryAddressDraft = {
  recipientName: string;
  phone: string;
  addressLine: string;
  neighborhood?: string;
  landmark?: string;
  instructions?: string;
  city: 'Essaouira';
};

type CheckoutDraft = {
  fulfillment: CheckoutFulfillment;
  payment: CheckoutPayment;
  deliveryAddress?: DeliveryAddressDraft;
  notes: string;
};
```

These frontend types will remain distinct from the API `OrderType` and `PaymentMethod` contracts. That separation prevents `DELIVERY` or `ONLINE_DEMO` from being accidentally submitted to the current API.

### 6.3 Service selection

The checkout will display three options:

1. Sur place
2. À emporter
3. Livraison

Selecting delivery will:

- Display the Essaouira delivery message.
- Show the address form.
- Add 25 MAD to the displayed total.
- Allow cash or simulated online payment.

### 6.4 Address form

Required fields:

- Recipient/customer name
- Telephone number
- Street/address description
- City fixed to Essaouira

Optional fields:

- Neighborhood
- Nearby landmark
- Delivery instructions

Validation rules:

- Trim all text input.
- Require a meaningful address length.
- Require a plausible phone length without claiming carrier verification.
- Keep city fixed and non-editable.
- Limit all fields to safe lengths.
- Do not save the address in SecureStore, profile state, or PostgreSQL.
- Retain it only while the current checkout/demo order exists.
- Clear it after the demo order is completed, cancelled, or explicitly cleared.

### 6.5 Price calculation

```text
Products subtotal       existing cart total
Delivery fee            25 MAD when DELIVERY; otherwise 0 MAD
Final displayed total   subtotal + delivery fee
```

The delivery fee will be declared once as a named constant, not repeated as magic numbers in UI components.

For real API orders, the API-calculated total remains authoritative. The 25 MAD fee applies only to the local delivery demo flow until backend delivery is implemented.

### 6.6 Payment selection

Options:

- Cash
- Online payment — demo

Cash copy:

- Dine-in/takeaway: payment at the restaurant.
- Delivery: payment to the delivery person on arrival.

Demo online-payment flow:

1. Customer selects online payment.
2. A clear demo notice appears.
3. Customer presses “Simulate payment.”
4. A short processing state is displayed.
5. The simulation resolves to success.
6. A local demo order is created with payment status `DEMO_PAID`.
7. Confirmation states that no real debit occurred.

Optional QA-only controls may simulate failure or cancellation, but they should not appear in the normal demo presentation unless requested.

### 6.7 Demo order snapshot

The current order store will be extended carefully or a separate demo checkout store will be created. The snapshot needs:

- Generated demo identifier
- `isDemo: true`
- Items and quantities
- Product subtotal
- Delivery fee
- Final total
- Service type
- Payment method
- Demo payment status
- Address snapshot for delivery
- Notes
- Created date
- A short demo status timeline

No demo order will be mixed into server-fetched order history unless explicitly identified and merged by a dedicated adapter.

### 6.8 Confirmation and order details

Demo confirmation must show:

- “Commande de démonstration” badge
- Service type
- Address when delivery is selected
- Product subtotal
- Delivery fee of 25 MAD
- Final total
- Cash or simulated online payment
- “Aucun débit réel” for online demo payment

Existing confirmation and tracking screens must continue rendering real API orders correctly.

## 7. Responsive Admin Architecture

### 7.1 Scope

The following routes and shared states are in scope:

1. Login
2. Admin shell/navigation/topbar
3. Dashboard
4. Orders list
5. Order details
6. Menu landing/workspace
7. Products list
8. Product editor
9. Categories list/editor
10. Customers
11. Reports
12. Settings
13. Staff management
14. Notifications
15. Dialogs
16. Loading, error, and empty states

The QR/web menu under `apps/menu` is out of scope.

### 7.2 Breakpoint policy

| Range | Intended layout |
|---|---|
| 1200px and wider | Full desktop layout |
| 900–1199px | Compact desktop/tablet landscape |
| 600–899px | Tablet/large mobile with drawer navigation |
| Below 600px | Single-column mobile layout |

Required verification viewports:

- 320 × 568
- 360 × 800
- 390 × 844
- 430 × 932
- 768 × 1024
- 1024 × 768
- 1280 × 800
- 1440 × 900

### 7.3 Shell and navigation

- Preserve the desktop sidebar.
- Use an accessible drawer below the tablet breakpoint.
- Close the drawer on navigation, backdrop press, and Escape.
- Trap focus inside the open drawer.
- Restore focus to the menu button when it closes.
- Lock background scrolling while open.
- Support short landscape viewports by allowing sidebar content to scroll.
- Prevent long user names or status labels from overflowing.
- Simplify the API-status label on narrow screens.
- Maintain at least 44 × 44 px interactive targets.

### 7.4 Responsive data views

Desktop and tablet may retain semantic tables. On small phones, important tables will become labelled record cards.

Order cards must display:

- Order number
- Customer
- Time
- Service type
- Item count
- Payment status
- Order status
- Total
- Primary action

Product/category/customer cards must preserve their important fields and actions instead of hiding columns.

No route may rely on `overflow-x: hidden` to conceal content. Horizontal table scrolling may remain as a tablet fallback, but phone layouts should be purpose-built.

### 7.5 Forms and editors

- Use two columns only where the viewport safely allows it.
- Use one column on phones.
- Make primary actions full-width where appropriate.
- Stack product option/value rows on small screens.
- Stack image upload and image URL controls.
- Prevent long file names, emails, and descriptions from expanding layouts.
- Keep form validation adjacent to its field.
- Use mobile-friendly dialogs or full-screen panels below 600px.
- Base dialog height on dynamic viewport height and allow internal scrolling.
- Keep dialog headings and close actions visible.

### 7.6 Dashboard and reports

- Four metric cards on large desktop, two on tablet, one on phone.
- Stack dashboard panels below desktop widths.
- Remove rigid fixed-height panels on phones.
- Avoid nested scrolling where normal page scrolling is sufficient.
- Keep numerical/text summaries available for every visual chart.
- Prevent chart labels and best-seller rows from clipping.

### 7.7 CSS organization

The current global stylesheet contains many unrelated page rules and overlapping media queries. The responsive work will separate responsibilities without changing the visual identity.

Target organization:

```text
apps/admin/src/app/
├── globals.css
└── design-system.css

apps/admin/src/components/
├── admin-shell.module.css
├── data-view.module.css
├── forms.module.css
└── dialogs.module.css
```

Page-specific styles may remain beside their page or feature. No new UI framework will be introduced.

## 8. Implementation Phases

### Phase 0 — Baseline and change protection

Tasks:

- Inspect and preserve the current dirty working tree.
- Record baseline typecheck, lint, tests, and builds.
- Inventory every admin route and major component state.
- Record baseline screenshots at the required viewports.
- Identify existing horizontal overflow and clipping.
- Define demo constants and boundaries.

Deliverables:

- Baseline verification record
- Responsive defect inventory
- No product behavior change

### Phase 1 — Checkout domain separation

Tasks:

- Define frontend checkout types distinct from API types.
- Add the 25 MAD delivery constant.
- Add address validation.
- Add a reliable predicate that selects real API flow versus demo flow.
- Add local demo-order types and mapping.
- Add unit-testable pure calculation/validation helpers.

Deliverables:

- Type-safe demo foundation
- No unsupported API payloads

### Phase 2 — Mobile delivery UI

Tasks:

- Refactor the existing checkout into focused components.
- Add delivery to the service selector.
- Add the address form.
- Add fixed Essaouira messaging.
- Add delivery fee and final-total presentation.
- Preserve the address during authentication/navigation within the active checkout.
- Clear address data after the active demo order lifecycle ends.

Deliverables:

- Complete delivery checkout UI
- Cash-for-delivery option

### Phase 3 — Demo online-payment UI

Tasks:

- Add cash/online selection.
- Add explicit demo disclosure.
- Implement processing, success, failure-safe, and cancellation states.
- Generate a demo payment reference.
- Avoid collecting real card data.
- Add confirmation wording that no debit occurred.

Deliverables:

- Presentation-ready simulated payment flow
- Clear separation from real payment processing

### Phase 4 — Demo confirmation and tracking

Tasks:

- Extend order presentation types to distinguish real and demo orders.
- Display delivery address and fee.
- Display demo payment state.
- Add a short deterministic demo timeline.
- Keep existing real order confirmation, details, cancellation, and realtime tracking unchanged.

Deliverables:

- Coherent demo journey from cart to confirmation

### Phase 5 — Admin responsive foundation

Tasks:

- Correct the shell and mobile drawer.
- Consolidate responsive breakpoints.
- Add reusable page container, toolbar, grid, and responsive data-view patterns.
- Correct modal/dialog mobile behavior.
- Normalize touch targets, truncation, wrapping, and focus behavior.

Deliverables:

- Stable responsive primitives used by all admin routes

### Phase 6 — Admin route correction

Implementation order:

1. Login and shell
2. Dashboard
3. Orders list and details
4. Menu workspace
5. Products and editor
6. Categories and editor
7. Customers
8. Reports
9. Settings and staff management
10. Notifications and shared states

For every route:

- Test all required viewports.
- Test empty, loading, error, normal, and long-content states.
- Verify touch and keyboard interaction.
- Verify no unintended page-level horizontal scroll.

Deliverables:

- Complete responsive admin application

### Phase 7 — Automated verification

Run and record:

- Workspace typecheck
- Workspace lint
- Mobile typecheck and lint
- Expo dependency compatibility check
- Android export
- Admin typecheck and lint
- Admin production build
- Existing API unit tests
- Existing API end-to-end tests when the configured PostgreSQL environment is available
- Checkout calculation and validation tests
- Demo flow tests
- Responsive browser tests/screenshots
- Horizontal-overflow checks
- Keyboard/focus checks for navigation and dialogs
- `git diff --check`

Deliverables:

- Verification report with failures resolved or explicitly documented

### Phase 8 — Manual demo rehearsal

Mobile rehearsal:

- Dine-in + cash real order
- Takeaway + cash real order
- Delivery + cash demo order
- Delivery + online demo order
- Dine-in/takeaway + online demo order
- Invalid/empty address
- Keyboard-open checkout
- Authentication interruption and return
- Confirmation and reset for a second customer

Admin rehearsal:

- Login on phone, tablet, and desktop
- Navigation drawer
- Dashboard
- Order queue and details
- Menu editing
- Customers and reports
- Settings/staff
- Realtime notification
- Long content and small-screen behavior

Deliverables:

- Signed demo-readiness checklist

## 9. Test Matrix

### Mobile functional cases

| Case | Expected result |
|---|---|
| Dine-in + cash | Existing API order succeeds |
| Takeaway + cash | Existing API order succeeds |
| Delivery selected | Address form and 25 MAD fee appear |
| Delivery + missing address | Confirmation blocked with field errors |
| Delivery + cash | Local demo order succeeds and shows cash on delivery |
| Online selected | Demo disclosure appears |
| Online simulation succeeds | Local demo order shows demo-paid state |
| Online simulation interrupted | Cart and checkout draft remain recoverable |
| New checkout after completion | Previous delivery address is cleared |
| Existing API rejects ONLINE | Existing backend safety test continues passing |

### Admin responsive cases

For every route and viewport:

- No unintended horizontal page scrolling.
- No clipped primary content or actions.
- Navigation remains reachable.
- Text wraps or truncates intentionally.
- Forms remain operable.
- Dialogs fit within the viewport.
- Loading/error/empty states fit correctly.
- Keyboard focus is visible.
- Touch targets remain usable.

## 10. Definition of Done

The demo scope is complete only when:

- Delivery is available in the mobile checkout.
- Delivery is visibly limited to Essaouira.
- Delivery adds exactly 25 MAD.
- Address is required for delivery and used only for the current order.
- Cash is available for delivery.
- Online payment is convincingly simulated and clearly labelled as a demo.
- No real card or bank data is collected.
- Existing real cash order flows continue working.
- Unsupported demo values are never sent to the current API.
- Confirmation correctly distinguishes demo orders from real orders.
- Every admin route passes the responsive viewport matrix.
- No critical responsive, keyboard, or focus defect remains.
- Typecheck, lint, relevant tests, and builds pass.
- A physical/mobile and browser demo rehearsal is completed.

## 11. Explicitly Out of Scope

- Real online-payment provider integration
- Real payment webhooks
- Card-data collection
- Refund processing
- Persistent delivery addresses
- Delivery-zone maps or GPS/geocoding validation
- Dynamic delivery pricing
- Backend `DELIVERY` order persistence
- Showing local demo delivery orders in the real admin queue
- QR/web menu responsive changes
- Deployment changes unless separately requested

## 12. Post-Demo Production Roadmap

After the provider and operational rules are chosen:

1. Add `DELIVERY` to the Prisma/API order domain.
2. Add immutable delivery-address snapshots.
3. Add server-authoritative delivery fee configuration.
4. Add delivery availability and zone validation.
5. Select and integrate the approved payment provider.
6. Add payment session creation and signed webhooks.
7. Add idempotency and reconciliation.
8. Add cancellation/refund rules.
9. Add delivery/payment details and actions to admin.
10. Replace the demo adapter while preserving the checkout UI contract.
11. Run sandbox, security, end-to-end, and production-readiness verification.

## 13. Proposed Execution Order

```text
Approval
  ↓
Baseline and responsive audit
  ↓
Checkout domain separation
  ↓
Delivery UI and address validation
  ↓
Demo online-payment flow
  ↓
Demo confirmation/tracking
  ↓
Admin responsive foundation
  ↓
Admin route-by-route correction
  ↓
Automated verification
  ↓
Manual demo rehearsal
  ↓
Demo sign-off
```

No implementation should begin until this plan is confirmed.
