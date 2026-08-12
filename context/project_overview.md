# Terrasse Bleue — Project Overview

## Project

Terrasse Bleue is a café & restaurant in Essaouira, Morocco. The project is a mobile ordering platform allowing customers to browse the restaurant menu, create an account, place café/restaurant orders, pay online in the future, and track orders.

The project has two principal user-facing applications:

1. Customer mobile application
2. Restaurant/admin web dashboard

A backend API and PostgreSQL database support both.

## Business Goal

The immediate goal is to produce a convincing functional MVP/demo in 7 days so the client can validate the project and award/continue the full project.

The MVP must demonstrate the complete core loop:

Customer → Menu → Cart → Checkout → Order → Restaurant → Preparation → Live customer tracking

## Important Scope Rule

The 7-day MVP is NOT the complete production V1.

Prioritize:

- working core order flow
- polished mobile UX
- functional restaurant dashboard
- real PostgreSQL persistence
- authentication
- authorization
- order status machine
- real-time order status updates
- demo payment abstraction/mock payment

Postpone unless explicitly requested:

- real payment provider integration
- delivery management
- driver application
- loyalty
- coupons
- advanced analytics
- reservations
- POS integration
- AI features
- advanced multi-branch architecture

## Target Users

### Customer

Can:

- register/login
- browse menu
- view categories
- view products
- add products to cart
- checkout
- create an order
- view order history
- track current order

### Staff

Can:

- login
- view incoming orders
- view order details
- update order status

### Manager

Can:

- do staff actions
- manage categories
- manage products
- change product availability

## Future Production Direction

After MVP validation:

- real online payment
- push notifications
- production security hardening
- cloud image storage
- backups
- monitoring
- App Store publication
- Google Play publication
- production QA
- delivery if required
- multilingual support if required

## Current Project Principle

Build the smallest clean architecture that can become the production application without rewriting the core order system.
