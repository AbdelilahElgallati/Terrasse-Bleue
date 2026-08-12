# Terrasse Bleue — Demo Rehearsal Checklist

**Prepared:** 2026-08-12  
**Purpose:** Final manual validation before the presentation

## Mobile checkout

- [ ] Dine-in + cash creates a real API order.
- [ ] Takeaway + cash creates a real API order.
- [ ] Delivery displays the Essaouira-only address form.
- [ ] Delivery adds exactly 25 MAD to the subtotal.
- [ ] Empty or invalid delivery details block confirmation.
- [ ] Delivery + cash creates a clearly labelled local demo order.
- [ ] Delivery + online creates a clearly labelled local demo order.
- [ ] Dine-in/takeaway + online creates a clearly labelled local demo order.
- [ ] Online demo never requests a card number, expiry date, or CVV.
- [ ] Confirmation states that no real debit occurred.
- [ ] Demo tracking states that it is local and not synchronized with the restaurant.
- [ ] Starting a new checkout does not reuse the previous delivery address.
- [ ] Keyboard does not hide address fields or the confirmation action.
- [ ] Checkout works with increased system font size.

## Admin viewports

Test every route at 320×568, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800, and 1440×900.

Routes:

- [ ] Login
- [ ] Dashboard
- [ ] Orders
- [ ] Order details
- [ ] Menu workspace
- [ ] Products
- [ ] Product editor
- [ ] Categories
- [ ] Customers
- [ ] Reports
- [ ] Settings and staff management

For each route:

- [ ] No unintended page-level horizontal scrolling.
- [ ] Primary information and actions remain visible.
- [ ] Long names, emails, and descriptions do not break the layout.
- [ ] Tables scroll safely on tablet/narrow layouts.
- [ ] Forms become one column where necessary.
- [ ] Dialogs fit the viewport and remain scrollable.
- [ ] Loading, empty, error, and populated states are usable.
- [ ] Touch targets remain comfortable.
- [ ] Keyboard focus is visible.

## Navigation accessibility

- [ ] Mobile drawer opens from the menu button.
- [ ] Focus enters the drawer.
- [ ] Tab and Shift+Tab remain inside the open drawer.
- [ ] Escape closes the drawer.
- [ ] Backdrop press closes the drawer.
- [ ] Selecting a navigation link closes the drawer.
- [ ] Focus returns to the menu button.
- [ ] Background content does not scroll while the drawer is open.
- [ ] Drawer remains usable in landscape/short viewports.

## Demo reset

- [ ] Use only fictional delivery and payment information.
- [ ] Clear the active demo order before handing the phone to a new participant.
- [ ] Confirm the API and admin connection indicators before starting.
- [ ] Confirm private ADMIN/STAFF credentials.
- [ ] Rehearse the distinction between real cash orders and local demo orders.
- [ ] Explain that the payment provider will be selected after the demo.

## Sign-off

| Area | Reviewer | Date | Result | Notes |
|---|---|---|---|---|
| Mobile delivery |  |  |  |  |
| Demo online payment |  |  |  |  |
| Admin phone |  |  |  |  |
| Admin tablet |  |  |  |  |
| Admin desktop |  |  |  |  |
| Cross-device rehearsal |  |  |  |  |
