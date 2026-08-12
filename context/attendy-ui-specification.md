# Terrasse Bleue — UI Specification

> Note: The filename is retained from the initial project context naming. The application itself is Terrasse Bleue.

## Brand Direction

The visual identity should resemble a Mediterranean/coastal café and restaurant in Essaouira.

The design should feel:

- elegant
- warm
- coastal
- modern
- welcoming
- premium but not luxurious/formal
- simple enough for fast ordering

Do not make the application look like a generic food-delivery marketplace.

## Provisional Palette

These colors are starting values only and must be updated when the restaurant provides its official branding/logo.

```text
Primary Blue       #123B4A
Turquoise          #2C8C8C
Warm Ivory         #F7F1E5
Terracotta         #D9785B
Charcoal           #242424
White              #FFFFFF
```

Use the palette consistently through:

- buttons
- navigation
- cards
- status indicators
- backgrounds
- headings
- borders

## Typography

Preferred starting font:

```text
Inter
```

Use a clean readable hierarchy.

## Customer App

### Splash

- logo
- restaurant identity
- subtle loading state

### Home

Sections:

```text
Header / greeting
Restaurant status
Categories
Featured products
Popular products
CTA to menu
```

### Menu

- category selector
- product cards
- image
- name
- short description
- price
- availability
- add button

### Product Details

- large image
- product name
- description
- price
- options
- quantity selector
- add to cart

### Cart

- cart items
- quantity
- options
- subtotal
- total
- checkout CTA

### Checkout

- order summary
- order type
- payment method
- notes
- total
- confirmation CTA

### Order Tracking

Use a clear visual stepper:

```text
✓ Commande reçue
✓ Confirmée
● En préparation
○ Prête
○ Terminée
```

The active state must be obvious.

## Admin

The dashboard should prioritize speed for restaurant staff.

Use:

```text
Nouvelles
Confirmées
En préparation
Prêtes
Terminées
```

Order cards should expose the most important information without requiring unnecessary navigation.

## Component Rules

Create reusable components:

```text
Button
Input
ProductCard
CategoryCard
CartItem
QuantitySelector
OrderCard
OrderStatus
Badge
Modal
LoadingState
EmptyState
ErrorState
```

## UX Rules

- Primary action should be visually obvious.
- Avoid unnecessary forms.
- Keep checkout short.
- Never hide the current order status.
- Show clear confirmation after order creation.
- Use skeleton/loading states where appropriate.
- Avoid excessive animations.
- Touch targets should be comfortable on mobile.
- Handle long product names and prices gracefully.

## Accessibility

At minimum:

- readable contrast
- meaningful labels
- accessible touch targets
- error messages that explain what to do
- no information conveyed only through color

## Branding TODO

Before production, obtain from client:

- official logo
- official colors
- official fonts if any
- product photography
- restaurant photos
- exact French/Arabic wording

## Day 2 Demo Decisions

- French is the primary customer-facing language.
- Local menu photography uses a consistent warm coastal palette and can be
  replaced from the central mock catalog when official product photos arrive.
- The mobile journey uses an ivory canvas, deep-blue structural surfaces,
  turquoise informational accents, and terracotta primary highlights.
- Product and order content is explicitly demo data until the API is connected.
