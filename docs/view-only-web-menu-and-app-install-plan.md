# Terrasse Bleue — View-Only Web Menu and App Installation Plan

**Status:** Proposed — awaiting confirmation  
**Prepared:** 2026-08-12  
**Implementation authorization:** Not yet granted

## 1. Objective

Convert `apps/menu` from a public ordering application into a focused, view-only digital menu.

Customers scanning the café QR code will be able to:

- Browse categories and products.
- Search and sort the menu.
- Open product details and see available choices/supplements.
- See current prices and availability from the API.
- Learn that orders inside the café should be placed directly with a server.
- Open or install the Terrasse Bleue mobile application through a configured link.
- Scan a separate application-installation QR when viewing the site on another device.

Customers will no longer be able to create orders from the web menu.

## 2. Current Architecture and Findings

The public web menu currently includes a complete order client:

```text
Menu listing
  ├── Product quick-add
  ├── Product option selection
  ├── Persistent browser cart
  ├── Cart route
  ├── Guest/register/login checkout
  ├── POST /orders
  ├── Browser order cache
  └── Authenticated realtime order tracking
```

Current ordering responsibilities are distributed across:

- `src/components/menu-experience.tsx`: floating cart and cart total.
- `src/components/product-card.tsx`: quantity and quick-add behavior.
- `src/app/menu/product/[id]/page.tsx`: option selection, quantity, and add-to-cart.
- `src/components/site-header.tsx`: cart badge and last-order tracking link.
- `src/components/providers.tsx`: cart persistence and customer authentication.
- `src/app/cart/page.tsx`: cart management.
- `src/app/checkout/page.tsx`: authentication and order creation.
- `src/app/order/[id]/page.tsx`: REST/Socket.IO tracking and cancellation.
- `src/lib/cart.ts`: cart pricing and reducer.
- `src/lib/cart.test.ts`: cart behavior tests.
- `src/lib/types.ts`: cart, authentication, and order types.
- Global and feature stylesheets: cart, checkout, quantity, tracking, and order states.
- `README.md` and progress documentation: currently describe web ordering.

Therefore, commenting out the visible “Order” button alone would leave hidden routes, stored cart/auth data, dead dependencies, misleading metadata, and direct URLs that still create orders.

## 3. Proposed Target Architecture

```text
Public menu QR
  ↓
Next.js view-only menu
  ├── GET /categories
  ├── GET /products
  ├── Search and sorting
  ├── Category navigation
  ├── Product details
  ├── “Ask your server” in-café guidance
  └── Mobile application CTA
      ├── Open/install button
      └── Optional app-install QR

Mobile application
  └── Ordering, delivery, demo payment, history, and tracking
```

The web menu will use only public read endpoints. It will no longer call authentication or order endpoints and will no longer connect to Socket.IO.

## 4. Recommended Customer Experience

### 4.1 Main menu page

Keep:

- Branded hero.
- Category pills and progress.
- Product search.
- Price sorting.
- Category sections.
- Product cards.
- Product images, descriptions, prices, featured labels, and availability.
- Product detail links.
- Back-to-top control.

Remove:

- Quantity selectors.
- “Ajouter” actions.
- “Choisir les options” wording that implies configuration for purchase.
- Floating cart.
- Cart total/count.
- Order tracking shortcut.

Replace card actions with:

- “Voir le détail” for every product.
- An optional small “Options disponibles” label when a product has choices or supplements.

### 4.2 Product details

The product detail remains useful as information.

Display:

- Product name, image, description, and base price.
- Available option groups.
- Every option value and its price supplement.
- A clear notice that selections are informational and should be communicated to the server.

Do not display radio buttons, quantities, calculated basket totals, or add-to-cart actions. Options should become a semantic read-only list rather than disabled form controls.

Recommended message:

> Pour commander au café, indiquez votre choix et vos éventuelles options à votre serveur.

### 4.3 In-café ordering message

Add a visible but non-intrusive service card after the menu hero and near the end of the menu:

**Title:** Prêt à commander ?  
**Message:** Appelez votre serveur ou indiquez-lui directement les plats et options souhaités.  
**Supporting text:** La carte en ligne sert à consulter nos produits et nos prix.

This avoids suggesting that a waiter-request system exists. No fake “Call server” button should be added unless the café later provides a real operational mechanism.

### 4.4 Mobile application promotion

Add a dedicated application card containing:

- Terrasse Bleue application icon/logo.
- Short benefits: order remotely, delivery in Essaouira, order history, and tracking.
- Primary link: “Ouvrir ou installer l’application.”
- Application-install QR on tablet/desktop layouts.
- A fallback message if no installation URL is configured.

Recommended placement:

1. Compact install link in the header.
2. Full promotional card after several menu sections or at the end of the menu.
3. No modal or automatic popup; scanning the café QR should lead directly to the menu.

## 5. Application Link and QR Strategy

### 5.1 Current constraint

The Expo app defines the custom scheme `terrassebleue`, but no public App Store or Google Play URL is currently configured. A custom scheme alone cannot install an absent app.

### 5.2 Demo recommendation

Use a configurable HTTPS installation URL:

```env
NEXT_PUBLIC_MOBILE_APP_URL=https://...
NEXT_PUBLIC_MOBILE_APP_DISTRIBUTION=demo
```

For the demo, this may point to an approved EAS internal-distribution page or another controlled installation landing page.

Official Expo documentation confirms that internal distribution provides a shareable installation URL. Android requires an installable APK. iOS ad hoc installation requires registered devices and appropriate Apple provisioning, so it is not suitable as an unrestricted public-install promise.

Demo copy must say “Version de démonstration” when using internal distribution.

### 5.3 Production recommendation

Later replace the demo URL with a stable HTTPS application landing page that detects the platform and routes to:

- Apple App Store listing.
- Google Play listing.
- Web fallback when the application is unavailable.

After a production domain and store release exist, universal links/App Links can open the installed application and fall back to the website when it is absent. Expo Router already supports deep-link routing, but domain association and native app configuration will still be required.

### 5.4 Two distinct QR codes

Do not reuse the same file or purpose:

| QR | Purpose | Target |
|---|---|---|
| Menu QR | Printed at tables/café | Public `/menu` URL |
| App QR | Shown inside the web menu or separate promotion | Mobile application installation URL |

Proposed generated assets:

```text
public/menu-qr.png
public/app-install-qr.png
```

Update the QR generator to accept separate explicit variables and retain loopback protection:

```env
NEXT_PUBLIC_MENU_URL=https://...
NEXT_PUBLIC_MOBILE_APP_URL=https://...
```

If `NEXT_PUBLIC_MOBILE_APP_URL` is missing:

- The menu must still build.
- The app QR must not be rendered.
- The CTA should state that the application link is being prepared, or be hidden according to one centralized configuration rule.
- No broken link or placeholder QR should appear.

### 5.5 Same-device behavior

A customer viewing the menu on a phone cannot conveniently scan a QR displayed on that same phone. Therefore:

- Always provide a tappable installation button.
- Treat the app QR as a secondary desktop/tablet visual.
- Hide or reduce the QR on narrow phone layouts.

## 6. Route Decommissioning

Recommended handling:

| Route | New behavior |
|---|---|
| `/menu` | View-only menu |
| `/menu/product/[id]` | Read-only product detail |
| `/cart` | Redirect to `/menu?notice=ordering-moved` |
| `/checkout` | Redirect to `/menu?notice=ordering-moved` |
| `/order/[id]` | Redirect to `/menu?notice=use-mobile-app` |

The menu page may show a dismissible informational notice for these legacy redirects:

> Les commandes en ligne sont désormais disponibles dans l’application Terrasse Bleue. Au café, adressez-vous directement à votre serveur.

Why redirect instead of leaving dead pages:

- Existing bookmarks do not return a confusing 404.
- Old shared links receive an explanation.
- Direct URLs can no longer reach order creation or web authentication.
- Search engines converge on the intended menu route.

For a production system with historical web customers, preserving a limited order-tracking route could be justified temporarily. This project has not launched that flow publicly, so the recommended demo architecture is a complete redirect and decommission.

## 7. State and Dependency Cleanup

### 7.1 Providers

The root `Providers` component becomes unnecessary after removing cart/auth/order state. Remove it from the layout rather than leaving an empty client boundary.

Benefits:

- No cart hydration.
- No refresh-token calls on menu load.
- No browser storage writes.
- More of the menu remains server-rendered.
- Less JavaScript is sent to customers.

### 7.2 Browser storage cleanup

Previously stored keys may remain on returning devices:

- `tb-web-cart`
- `tb-web-refresh`
- `tb-last-order`
- `tb-order-*` session entries

Add one small, versioned, one-time client cleanup component that removes only these known menu-owned keys. Do not call `localStorage.clear()` or remove unrelated browser data.

After one transition release, the cleanup component can be removed.

### 7.3 Code cleanup

Remove when no longer referenced:

- Cart reducer and pricing helpers used only for ordering.
- Cart tests.
- Cart/auth/order types from the menu package.
- Web authentication actions.
- Socket.IO order tracking code.
- Status/stepper component if unused elsewhere.
- Ordering-specific CSS.

Retain:

- Product/category types.
- Public API client.
- Price and supplement formatting from shared types.
- Image fallback utilities.

### 7.4 Dependency cleanup

After confirming no remaining imports, remove `socket.io-client` from `apps/menu`. Keep `qrcode` because it generates both menu and app-install QR assets.

No API, database, admin, or mobile dependency changes are required.

## 8. Metadata, Accessibility, and SEO

Update metadata from “menu and online ordering” to “digital menu.”

Recommended description:

> Consultez la carte, les produits et les prix de Terrasse Bleue à Essaouira.

Accessibility requirements:

- Product choices use lists/headings, not disabled form controls.
- App-install link has an explicit accessible name.
- QR image has useful alternative text describing its destination.
- The same destination is available as a normal text link.
- Informational notices use appropriate status semantics without repeatedly interrupting screen readers.
- All CTA targets are at least 44 × 44 px.
- Focus remains visible.
- Reduced-motion behavior remains respected.

SEO and routing requirements:

- Menu and product pages retain meaningful headings and server-fetched content.
- Retired routes redirect rather than expose duplicate or stale content.
- Metadata contains no ordering promise.
- The app installation URL should use HTTPS.
- External installation links should use safe link attributes where appropriate.

## 9. Responsive Behavior

The existing menu is responsive, but the new CTA must be verified at:

- 320 × 568
- 360 × 800
- 390 × 844
- 430 × 932
- 768 × 1024
- 1024 × 768
- 1280 × 800
- 1440 × 900

Expected behavior:

- Header app link remains compact and does not displace the logo.
- Full app-promotion card stacks vertically on phones.
- App QR is secondary or hidden on phones.
- Product detail option lists do not overflow.
- In-café service card remains readable without excessive prominence.
- No cart bottom bar or sticky purchase action remains.
- No unintended horizontal scrolling.

## 10. Implementation Phases

### Phase 0 — Baseline and protection

- Preserve current uncommitted work.
- Record menu typecheck, lint, tests, and production build.
- Record current route inventory and browser storage keys.
- Confirm the chosen demo installation URL before generating an app QR.

### Phase 1 — Centralized menu configuration

- Add a small server-safe configuration module for the app URL and distribution label.
- Define one source of truth for app CTA visibility and wording.
- Add environment-variable examples.
- Ensure a missing app URL cannot break builds.

### Phase 2 — Convert listing and product details to view-only

- Remove cart state from `MenuExperience`.
- Remove product-card quantities and quick-add.
- Replace purchase/configuration actions with detail links and informational badges.
- Convert product option radio groups into read-only lists.
- Remove product quantity/add controls.
- Add “ask your server” guidance.

### Phase 3 — Add application promotion

- Add compact header CTA.
- Add full responsive app-promotion card.
- Add tappable installation/open link.
- Add conditional app QR.
- Add correct demo/production wording.

### Phase 4 — Retire ordering routes and client state

- Replace `/cart`, `/checkout`, and `/order/[id]` with server redirects.
- Add legacy-route notice handling on `/menu`.
- Remove the root client provider.
- Add narrowly scoped one-time storage cleanup.
- Remove order tracking and authentication client code.

### Phase 5 — Remove dead code and dependencies

- Remove unused cart/order/auth types and helpers.
- Remove obsolete tests and replace them with view-only configuration/route tests.
- Remove ordering-specific styles.
- Remove `socket.io-client` from the menu package.
- Update lockfile through the workspace package manager.

### Phase 6 — QR and documentation updates

- Keep menu QR generation unchanged in purpose.
- Add separate conditional app-install QR generation.
- Document demo URL requirements.
- Update README and progress tracker to describe the view-only menu.
- Document how to replace the demo URL with store links later.

### Phase 7 — Verification

- Menu TypeScript.
- Menu ESLint.
- View-only unit tests.
- Next.js production build.
- Verify only public GET requests occur during normal menu browsing.
- Verify retired routes cannot authenticate or create orders.
- Verify missing app URL behavior.
- Verify valid app URL/button/QR behavior.
- Scan the menu QR on a physical phone.
- Open the install link on Android and iOS test devices as applicable.
- Test every responsive viewport.
- Run `git diff --check`.

## 11. Test Matrix

| Case | Expected result |
|---|---|
| Open `/menu` | Categories/products load; no cart UI |
| Search/sort | Works as before |
| Product without options | Detail remains informational |
| Product with options | Options/supplements shown as a read-only list |
| Direct `/cart` visit | Redirects with explanation |
| Direct `/checkout` visit | Redirects with explanation |
| Direct `/order/:id` visit | Redirects to use mobile app |
| Old cart/auth storage | Only known menu keys are removed |
| App URL configured | Button works; QR uses same destination |
| App URL missing | No broken link or QR; safe fallback copy |
| Phone viewport | Tappable CTA visible; QR secondary/hidden |
| Desktop viewport | Button and QR both available |
| Network/API error | Existing menu error/retry state remains usable |
| Browser network inspection | No auth, order, or Socket.IO request |

## 12. Definition of Done

- The web menu cannot add products to a cart.
- The web menu cannot authenticate customers.
- The web menu cannot create, cancel, or track orders.
- Categories, products, prices, descriptions, images, search, sorting, and details continue working.
- Product options remain visible as information.
- Customers are clearly told to ask their server inside the café.
- A tappable application link is available when configured.
- A separate app QR is available on suitable layouts when configured.
- Demo distribution is never described as a public store release.
- Retired direct routes redirect with a helpful message.
- Obsolete browser state, code, CSS, tests, and dependencies are cleaned safely.
- Metadata and documentation describe a view-only menu.
- Typecheck, lint, tests, build, QR validation, responsive checks, and physical scan checks pass.

## 13. Out of Scope

- Changes to the Expo mobile ordering flow.
- Changes to the admin application.
- Changes to the NestJS API or Prisma schema.
- A digital “call waiter” backend or notification system.
- App Store or Google Play publication.
- Universal links/App Links before a production domain and build are ready.
- Redesigning the existing menu visual identity.

## 14. Decision Needed Before Implementation

The implementation can begin without a final store provider, but the app QR cannot be generated correctly until the team supplies one approved HTTPS destination:

1. An EAS/internal demo installation page, or
2. A temporary app landing page, or
3. Later, the final App Store/Google Play landing page.

Recommended default: implement the CTA and conditional QR now, allow the menu to build safely without the URL, and insert the approved demo installation URL when it is available.

No implementation should begin until this plan is confirmed.
