# Cahier des Charges — Terrasse Bleue
## Application mobile de commande & plateforme de gestion restaurant
**Version : Full V1 — Document de cadrage technique et fonctionnel**  
**Date : 09 août 2026**  
**Statut : Draft V1 à valider avec le client**

---

## 1. Présentation du projet

### 1.1 Contexte

Terrasse Bleue souhaite disposer d'une plateforme numérique permettant à ses clients de consulter le menu, composer une commande, effectuer un paiement en ligne et suivre l'évolution de leur commande.

Le système comprendra :

- une application mobile destinée aux clients ;
- une interface web d'administration destinée au restaurant ;
- une API backend centralisant la logique métier ;
- une base de données relationnelle ;
- un système de notifications ;
- un mécanisme de suivi en temps réel des commandes ;
- une intégration avec un prestataire de paiement en ligne ;
- les composants nécessaires au déploiement et à l'exploitation du service.

### 1.2 Objectifs

Les objectifs principaux sont :

1. Digitaliser la consultation du menu.
2. Permettre la prise de commandes depuis l'application.
3. Réduire les erreurs liées à la prise de commande manuelle.
4. Permettre au personnel de gérer les commandes depuis une interface dédiée.
5. Donner au client une visibilité sur l'état de sa commande.
6. Permettre le paiement en ligne de manière sécurisée.
7. Constituer une base technique évolutive pour de futures fonctionnalités.

### 1.3 Périmètre

La Full V1 couvre le parcours complet :

**Client → Menu → Panier → Commande → Paiement → Restaurant → Préparation → Suivi → Finalisation**

Les fonctionnalités de livraison avancée, application chauffeur, multi-restaurant et programme de fidélité avancé sont hors périmètre de la Full V1 sauf ajout contractuel.

---

# 2. Acteurs et rôles

## 2.1 Client

Le client peut :

- créer un compte ;
- se connecter et se déconnecter ;
- modifier son profil ;
- consulter le menu ;
- rechercher des produits ;
- consulter les catégories ;
- consulter les détails d'un produit ;
- sélectionner des options/add-ons lorsque disponibles ;
- ajouter et modifier des articles dans le panier ;
- passer une commande ;
- choisir le mode de commande proposé ;
- choisir le mode de paiement disponible ;
- payer en ligne ;
- consulter ses commandes ;
- suivre une commande ;
- recevoir des notifications ;
- consulter l'historique de commandes.

## 2.2 Personnel / Kitchen Staff

Le personnel peut :

- consulter les nouvelles commandes ;
- accepter/refuser une commande selon les règles définies ;
- passer une commande en préparation ;
- marquer une commande comme prête ;
- marquer une commande comme terminée ;
- consulter les détails d'une commande.

## 2.3 Manager / Restaurant Admin

Le manager peut :

- gérer les produits ;
- gérer les catégories ;
- gérer les prix ;
- gérer la disponibilité des produits ;
- gérer les options ;
- gérer les commandes ;
- consulter les clients ;
- gérer les horaires ;
- consulter les paiements ;
- consulter les statistiques ;
- gérer les membres du personnel ;
- modifier les paramètres du restaurant.

## 2.4 Super Admin technique

Le super administrateur est réservé à l'administration technique de la plateforme.

Il peut :

- gérer les comptes administrateurs ;
- gérer les rôles ;
- consulter les logs/audits ;
- gérer les paramètres techniques ;
- surveiller l'état du système.

---

# 3. Périmètre fonctionnel

## 3.1 Application mobile client

### Authentification

Écrans :

- Splash Screen
- Onboarding optionnel
- Connexion
- Inscription
- Mot de passe oublié
- Réinitialisation du mot de passe
- Vérification du compte si nécessaire

### Accueil

L'accueil doit afficher :

- identité visuelle Terrasse Bleue ;
- informations principales du restaurant ;
- catégories principales ;
- produits populaires/recommandés ;
- accès rapide au menu ;
- accès au panier ;
- état d'ouverture du restaurant ;
- éventuellement promotions actives.

### Menu

Fonctionnalités :

- affichage des catégories ;
- liste des produits ;
- recherche ;
- filtrage ;
- disponibilité ;
- prix ;
- description ;
- image ;
- options.

### Fiche produit

Une fiche produit contient :

- nom ;
- description ;
- image ;
- prix ;
- catégorie ;
- disponibilité ;
- options/variantes ;
- quantité ;
- bouton d'ajout au panier.

### Panier

Le panier permet :

- ajout ;
- suppression ;
- modification de quantité ;
- modification des options ;
- calcul du sous-total ;
- éventuels frais ;
- éventuelle remise ;
- calcul du total.

### Checkout

Le checkout comprend :

- récapitulatif ;
- informations client ;
- type de commande ;
- informations de livraison si la livraison est activée ;
- mode de paiement ;
- confirmation.

### Commande

Après validation :

- génération d'un numéro de commande ;
- création côté backend ;
- confirmation au client ;
- création de l'événement de commande ;
- notification au restaurant.

### Suivi

États principaux :

1. `PENDING`
2. `CONFIRMED`
3. `PREPARING`
4. `READY`
5. `COMPLETED`

États alternatifs :

- `CANCELLED`
- `PAYMENT_FAILED`
- `REFUNDED`

Pour une commande avec livraison :

- `OUT_FOR_DELIVERY`
- `DELIVERED`

Le client doit voir visuellement l'état courant et l'historique des changements.

---

# 4. Gestion des commandes

## 4.1 Cycle de vie

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
```

Branches possibles :

```text
PENDING ------> CANCELLED

CONFIRMED -----> CANCELLED

PAID ----------> REFUNDED
```

Pour livraison :

```text
READY
   |
   v
OUT_FOR_DELIVERY
   |
   v
DELIVERED
```

## 4.2 Règles

- Une commande validée possède un identifiant unique.
- Le prix de chaque article est conservé dans `order_items`.
- Le prix historique doit rester indépendant du prix courant du produit.
- Toute transition importante est enregistrée dans un historique.
- Le serveur est la source de vérité pour l'état d'une commande.
- Le client ne peut jamais modifier directement le statut d'une commande.
- Le personnel ne peut effectuer que les transitions autorisées par son rôle.

---

# 5. Paiement en ligne

## 5.1 Architecture

Le paiement doit être abstrait afin de ne pas coupler toute l'application à un seul prestataire.

```text
Mobile App
    |
    v
Backend API
    |
    v
Payment Service
    |
    +---- CMI
    |
    +---- Future Provider
    |
    +---- Mock Provider
```

## 5.2 Flux

```text
Client
  |
  | Checkout
  v
Backend
  |
  | Create payment
  v
Payment Provider
  |
  | Secure payment / 3DS
  v
Provider
  |
  | Callback/Webhook
  v
Backend
  |
  | Verify transaction
  v
Payment = PAID
  |
  v
Order confirmed
```

## 5.3 Règles de sécurité

L'application ne doit jamais stocker :

- numéro complet de carte ;
- CVV ;
- données bancaires sensibles.

Le paiement doit être confirmé côté serveur à partir de la réponse du prestataire.

Les frais et conditions commerciales du prestataire de paiement sont à la charge du restaurant et font l'objet d'un contrat séparé avec celui-ci.

---

# 6. Notifications

Le système doit pouvoir notifier le client pour :

- commande reçue ;
- commande confirmée ;
- commande en préparation ;
- commande prête ;
- commande terminée ;
- commande annulée ;
- paiement accepté ;
- paiement échoué.

Canaux possibles :

- Push notification ;
- notification interne ;
- e-mail pour certains événements.

---

# 7. Interface restaurant

## 7.1 Dashboard

Le dashboard doit présenter :

- commandes en cours ;
- nouvelles commandes ;
- chiffre d'affaires selon les droits ;
- commandes du jour ;
- produits indisponibles ;
- indicateurs principaux.

## 7.2 Gestion des commandes

Vue Kanban recommandée :

```text
NOUVELLES
    |
    v
CONFIRMÉES
    |
    v
EN PRÉPARATION
    |
    v
PRÊTES
    |
    v
TERMINÉES
```

Chaque commande affiche :

- numéro ;
- heure ;
- client ;
- articles ;
- quantités ;
- total ;
- paiement ;
- type de commande ;
- statut.

## 7.3 Gestion du menu

Le manager peut :

- créer une catégorie ;
- modifier une catégorie ;
- supprimer une catégorie ;
- créer un produit ;
- modifier un produit ;
- désactiver un produit ;
- modifier le prix ;
- ajouter une image ;
- gérer les options ;
- gérer la disponibilité.

---

# 8. Base de données

## 8.1 Technologie

**PostgreSQL**

ORM :

**Prisma**

## 8.2 Entités principales

```text
users
roles
categories
products
product_options
product_option_values
orders
order_items
order_item_options
order_status_history
payments
notifications
restaurant_settings
staff
audit_logs
addresses
promotions
coupons
```

Certaines tables de la liste V2 peuvent être désactivées si elles ne sont pas nécessaires au lancement.

## 8.3 Relations principales

```text
User
 |
 +---- Orders
 |       |
 |       +---- OrderItems
 |                |
 |                +---- Product
 |
 +---- Notifications
 |
 +---- Addresses

Category
 |
 +---- Products
          |
          +---- ProductOptions

Order
 |
 +---- Payment
 |
 +---- OrderStatusHistory
```

## 8.4 Principes

- UUID recommandé pour les identifiants publics.
- Clés étrangères avec intégrité référentielle.
- Index sur les champs fréquemment recherchés.
- Timestamps sur les entités principales.
- Soft delete pour les données qui doivent être conservées.
- Contraintes d'unicité pour les données appropriées.
- Transactions PostgreSQL pour les opérations critiques.

---

# 9. API Backend

## 9.1 Architecture

```text
React Native
      |
      | HTTPS / JSON
      v
API Gateway / Reverse Proxy
      |
      v
NestJS
      |
      +---- Auth Module
      +---- Users Module
      +---- Menu Module
      +---- Cart/Order Module
      +---- Payment Module
      +---- Notification Module
      +---- Admin Module
      +---- Analytics Module
      |
      v
Prisma
      |
      v
PostgreSQL
```

## 9.2 Modules NestJS

```text
src/
├── auth/
├── users/
├── roles/
├── restaurants/
├── categories/
├── products/
├── product-options/
├── orders/
├── payments/
├── notifications/
├── staff/
├── analytics/
├── admin/
├── audit/
├── common/
└── config/
```

## 9.3 Endpoints principaux

### Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/me
```

### Menu

```http
GET    /categories
GET    /categories/:id
GET    /products
GET    /products/:id
```

### Orders

```http
POST   /orders
GET    /orders
GET    /orders/:id
PATCH  /orders/:id/cancel
GET    /orders/:id/status-history
```

### Restaurant

```http
GET    /admin/orders
GET    /admin/orders/:id
PATCH  /admin/orders/:id/status

POST   /admin/categories
PATCH  /admin/categories/:id
DELETE /admin/categories/:id

POST   /admin/products
PATCH  /admin/products/:id
DELETE /admin/products/:id
```

### Payment

```http
POST /payments/create
GET  /payments/:id
POST /payments/webhook
POST /payments/:id/refund
```

Les endpoints exacts seront finalisés lors de la conception de l'API.

---

# 10. Temps réel

Technologie recommandée :

**WebSocket / Socket.IO**

## Flux

```text
Restaurant Dashboard
       |
       | status changed
       v
NestJS
       |
       +---- Database
       |
       +---- WebSocket
                |
                v
          Customer App
```

Le WebSocket ne remplace pas la base de données.

La base reste la source de vérité.

---

# 11. Architecture mobile

## Technologie

- React Native
- Expo
- TypeScript
- Expo Router
- TanStack Query
- Zustand
- React Hook Form
- Zod

Structure :

```text
mobile/
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   ├── product/
│   ├── cart/
│   ├── checkout/
│   └── orders/
├── components/
├── features/
│   ├── auth/
│   ├── menu/
│   ├── cart/
│   ├── orders/
│   └── profile/
├── services/
├── stores/
├── hooks/
├── lib/
├── constants/
└── assets/
```

---

# 12. Architecture Admin

Technologie recommandée :

- Next.js
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod

Structure :

```text
admin/
├── app/
├── components/
├── features/
├── services/
├── hooks/
├── lib/
└── types/
```

---

# 13. Sécurité

La sécurité est une exigence transversale.

## 13.1 Authentification

- JWT access token ;
- refresh token ;
- expiration ;
- rotation/révocation des refresh tokens ;
- mots de passe hashés avec Argon2id ;
- validation des entrées.

## 13.2 Autorisation

RBAC :

```text
CUSTOMER
STAFF
MANAGER
SUPER_ADMIN
```

Les permissions sont vérifiées côté serveur.

## 13.3 API

- HTTPS obligatoire en production ;
- validation DTO ;
- rate limiting ;
- CORS configuré ;
- headers de sécurité ;
- protection contre les injections ;
- journalisation ;
- gestion centralisée des erreurs ;
- secrets dans variables d'environnement/secret manager.

## 13.4 Paiement

- aucune donnée bancaire sensible dans la base ;
- vérification server-side ;
- validation des webhooks ;
- protection contre les doubles traitements ;
- idempotency keys pour les opérations critiques.

## 13.5 Audit

Les actions sensibles peuvent être enregistrées :

```text
actor
action
resource
resource_id
timestamp
ip
metadata
```

---

# 14. Design UI/UX

## 14.1 Identité

Le design doit reprendre l'identité réelle de Terrasse Bleue.

La palette définitive sera validée à partir :

- du logo ;
- des photos du restaurant ;
- de la signalétique ;
- du mobilier ;
- du menu existant ;
- des réseaux sociaux officiels.

### Direction initiale proposée

```text
Deep Blue       #123B4A
Turquoise       #2C8C8C
Warm Ivory      #F7F1E5
Terracotta      #D9785B
Charcoal        #242424
```

Cette palette est une proposition de départ et non une charte graphique définitive.

## 14.2 Principes UX

- navigation simple ;
- parcours de commande court ;
- CTA clairement visibles ;
- prix toujours visibles ;
- disponibilité clairement indiquée ;
- feedback après chaque action ;
- états loading/error/empty ;
- accessibilité ;
- responsive admin ;
- prise en charge du français ;
- architecture compatible avec l'arabe/RTL si demandé.

---

# 15. Écrans mobile

## Auth

1. Splash
2. Onboarding
3. Login
4. Register
5. Forgot Password
6. Reset Password

## Principal

7. Home
8. Categories
9. Menu
10. Search
11. Product Details

## Commande

12. Cart
13. Checkout
14. Payment
15. Order Confirmation
16. Order Tracking
17. Order History
18. Order Details

## Profil

19. Profile
20. Edit Profile
21. Addresses si nécessaire
22. Notifications
23. Settings

---

# 16. Écrans administrateur

1. Login
2. Dashboard
3. Orders
4. Order Details
5. Kitchen/Order Board
6. Categories
7. Products
8. Product Editor
9. Product Options
10. Customers
11. Staff
12. Payments
13. Analytics
14. Restaurant Settings
15. Notifications
16. Audit Logs
17. Admin Profile

---

# 17. Infrastructure

## Architecture de production

```text
                    INTERNET
                       |
                    HTTPS
                       |
                  Cloudflare
                       |
                Reverse Proxy
                       |
                 NestJS API
                       |
        +--------------+--------------+
        |                             |
    PostgreSQL                   Object Storage
        |                         / Images
        |
    Backups

Mobile App  ---------------------> API
Admin Web   ---------------------> API

API -----------------------------> Payment Provider
API -----------------------------> Push Provider
API -----------------------------> Email Provider
```

## Déploiement

Docker recommandé pour :

- backend ;
- admin ;
- éventuellement services auxiliaires.

PostgreSQL peut être :

- managé ;
- ou hébergé sur VPS selon la stratégie finale.

---

# 18. Environnements

Trois environnements sont recommandés :

```text
Development
     |
     v
Staging
     |
     v
Production
```

Chaque environnement possède :

- base de données distincte ;
- variables d'environnement distinctes ;
- credentials distincts ;
- paiement sandbox en staging ;
- paiement réel uniquement en production.

---

# 19. CI/CD

GitHub Actions peut gérer :

```text
Pull Request
     |
     v
Lint
     |
     v
Type Check
     |
     v
Unit Tests
     |
     v
Build
     |
     v
Deploy Staging
```

Production :

```text
main
 |
 v
Tests
 |
 v
Build
 |
 v
Deploy
```

---

# 20. Tests

## Backend

- unit tests ;
- integration tests ;
- API tests ;
- authorization tests ;
- payment tests.

## Mobile

- tests des composants critiques ;
- tests du panier ;
- tests du checkout ;
- tests du parcours commande.

## E2E

Le scénario principal doit être automatisé :

```text
Register/Login
      ↓
Browse Menu
      ↓
Add Product
      ↓
Cart
      ↓
Checkout
      ↓
Create Order
      ↓
Restaurant receives order
      ↓
Confirm
      ↓
Preparing
      ↓
Ready
      ↓
Customer sees update
      ↓
Completed
```

## Paiement

Le paiement réel doit être testé avec le mode sandbox fourni par le prestataire lorsque disponible.

---

# 21. Observabilité

Le système doit disposer de :

- logs backend ;
- monitoring ;
- alertes ;
- suivi des erreurs ;
- métriques de disponibilité ;
- suivi des erreurs de paiement.

Sentry ou une solution équivalente peut être utilisée.

---

# 22. Sauvegardes

La base de données doit disposer de sauvegardes régulières.

Minimum recommandé :

- sauvegarde quotidienne ;
- rétention définie ;
- possibilité de restauration ;
- test périodique de restauration.

---

# 23. Comptes et services externes

Les comptes de production doivent idéalement appartenir au client :

- Apple Developer ;
- Google Play Console ;
- domaine ;
- fournisseur de paiement ;
- hébergement ;
- base de données ;
- stockage média.

Le développeur reçoit les accès nécessaires sans devenir propriétaire des comptes.

---

# 24. Publication mobile

## Android

Publication sur Google Play.

Coût de compte développeur :

**25 USD en paiement unique**, selon la tarification officielle de Google Play.

## iOS

Publication sur Apple App Store.

Apple Developer Program :

**99 USD/an**, selon la tarification officielle d'Apple.

Les frais de comptes développeurs sont à la charge du client.

---

# 25. Coûts d'infrastructure estimatifs

Les coûts réels dépendent du trafic et des fournisseurs sélectionnés.

Pour un lancement à faible trafic :

| Poste | Budget initial indicatif |
|---|---:|
| Backend | 5–15 USD/mois |
| PostgreSQL | 0–25 USD/mois |
| Stockage images | 0–10 USD/mois |
| Email | 0–10 USD/mois |
| Notifications push | 0 USD initialement |
| Monitoring | 0 USD initialement |
| Domaine | ~10–20 USD/an |
| Apple Developer | 99 USD/an |
| Google Play | 25 USD une fois |

Une architecture économique peut donc démarrer autour de quelques dizaines de dollars par mois.

Ces montants ne comprennent pas les frais du prestataire de paiement, qui dépendent du contrat commercial du restaurant.

---

# 26. Paiement et frais tiers

Les frais suivants sont hors prix de développement sauf accord contraire :

- frais bancaires ;
- frais du prestataire de paiement ;
- commissions par transaction ;
- frais de marketplace ;
- hébergement ;
- domaine ;
- comptes développeurs ;
- services SaaS payants ;
- services SMS ;
- services e-mail premium.

Pour le paiement en ligne, le restaurant doit contracter avec le prestataire choisi.

---

# 27. Estimation du projet

## Full V1

Budget de développement indicatif :

**20 000 à 30 000 MAD**

Le prix définitif dépendra du périmètre validé avec le client.

La proposition recommandée est de séparer :

### Développement

Paiement forfaitaire selon le cahier des charges.

### Services tiers

Payés directement par le client.

### Maintenance

Contrat mensuel optionnel.

Exemple :

- Maintenance Basic : 500 MAD/mois
- Maintenance Standard : 1 000 MAD/mois
- Maintenance Premium : à partir de 1 500 MAD/mois

---

# 28. Hors périmètre Full V1

Sauf ajout contractuel :

- application chauffeur ;
- gestion avancée de livraison ;
- multi-restaurant ;
- marketplace ;
- programme de fidélité avancé ;
- recommandations IA ;
- réservation de tables avancée ;
- comptabilité ;
- ERP ;
- intégration POS complexe ;
- gestion de plusieurs établissements ;
- chat client/support temps réel avancé.

---

# 29. Évolutions V2

Les évolutions possibles comprennent :

## QR Ordering

```text
QR Table
   ↓
Menu
   ↓
Commande
   ↓
Cuisine
```

## Livraison

- zones ;
- frais ;
- livreurs ;
- suivi ;
- statuts.

## Fidélité

- points ;
- récompenses ;
- niveaux ;
- coupons.

## Marketing

- promotions ;
- notifications ciblées ;
- codes promotionnels.

## Analytics avancés

- CA ;
- panier moyen ;
- produits populaires ;
- heures de pointe ;
- clients récurrents.

## Multi-établissement

Architecture permettant plusieurs restaurants/branches.

---

# 30. Livrables

Le projet Full V1 doit produire :

### Logiciel

- application mobile Android ;
- application mobile iOS ;
- backend API ;
- dashboard web restaurant ;
- base de données ;
- configuration de production.

### Documentation

- cahier des charges ;
- architecture ;
- modèle de données ;
- documentation API ;
- guide d'installation ;
- guide d'administration ;
- guide de déploiement.

### Publication

- build Android ;
- publication Google Play ;
- build iOS ;
- publication App Store sous réserve de validation des comptes Apple/Google.

---

# 31. Critères d'acceptation

La Full V1 sera considérée comme fonctionnelle lorsque :

1. Un utilisateur peut créer un compte.
2. Il peut consulter le menu.
3. Il peut consulter un produit.
4. Il peut ajouter un produit au panier.
5. Il peut modifier le panier.
6. Il peut passer une commande.
7. Le restaurant reçoit la commande.
8. Le restaurant peut modifier son statut.
9. Le client voit le statut mis à jour.
10. Le paiement en ligne fonctionne avec le prestataire configuré.
11. Le paiement est vérifié côté serveur.
12. L'historique des commandes est disponible.
13. Les notifications principales fonctionnent.
14. Le manager peut gérer les produits.
15. Le système applique les permissions des différents rôles.
16. Les données sensibles sont protégées.
17. Les sauvegardes sont configurées.
18. L'application peut être déployée sur Android et iOS.

---

# 32. Architecture finale recommandée

```text
                         ┌───────────────────────┐
                         │       CLIENT          │
                         │ React Native + Expo   │
                         └───────────┬───────────┘
                                     │
                                  HTTPS
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      CLOUDFLARE       │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      NESTJS API       │
                         │      TypeScript       │
                         ├───────────────────────┤
                         │ Auth                  │
                         │ Users                 │
                         │ Menu                  │
                         │ Orders                │
                         │ Payments              │
                         │ Notifications         │
                         │ Admin                 │
                         │ Analytics             │
                         └───────┬───────┬───────┘
                                 │       │
                     ┌───────────┘       └──────────────┐
                     ▼                                  ▼
          ┌─────────────────────┐            ┌──────────────────┐
          │     PostgreSQL      │            │   Object Storage │
          │       Prisma        │            │ Product Images   │
          └─────────────────────┘            └──────────────────┘
                     │
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
┌───────────────────┐   ┌──────────────────────┐
│ Payment Provider  │   │ Notification Service │
│ CMI / Provider    │   │ Push / Email         │
└───────────────────┘   └──────────────────────┘

                         ▲
                         │ HTTPS/WebSocket
                         │
              ┌──────────┴──────────┐
              │                     │
              │                     │
   ┌──────────┴─────────┐  ┌────────┴───────────┐
   │ Restaurant Admin   │  │ Kitchen Interface   │
   │ Next.js            │  │ Web                │
   └────────────────────┘  └────────────────────┘
```

---

# 33. Découpage recommandé du développement

## Phase 0 — Validation

- validation du cahier des charges ;
- validation du menu ;
- validation du design ;
- validation du mode de commande ;
- validation du paiement ;
- validation du périmètre.

## Phase 1 — Foundation

- repositories ;
- architecture ;
- database ;
- authentication ;
- CI/CD ;
- environments.

## Phase 2 — Customer App

- home ;
- menu ;
- products ;
- cart ;
- checkout ;
- profile.

## Phase 3 — Orders

- creation ;
- status machine ;
- history ;
- real-time tracking.

## Phase 4 — Restaurant

- dashboard ;
- orders ;
- kitchen ;
- menu management ;
- staff.

## Phase 5 — Payment

- provider ;
- checkout ;
- webhook ;
- verification ;
- refund/cancellation.

## Phase 6 — Notifications

- push ;
- email ;
- notification history.

## Phase 7 — Security & QA

- authorization ;
- validation ;
- rate limits ;
- tests ;
- security review.

## Phase 8 — Production

- hosting ;
- database ;
- domain ;
- SSL ;
- monitoring ;
- backups ;
- Android ;
- iOS.

---

# 34. Priorité de développement

### P0 — obligatoire

- Auth
- Menu
- Product
- Cart
- Checkout
- Orders
- Restaurant dashboard
- Status tracking
- Database
- Backend
- Security

### P1 — Full V1

- Online payment
- Push notifications
- Staff roles
- Menu management
- Analytics
- Payment history
- Audit logs
- Production deployment

### P2 — V2

- Delivery
- QR ordering
- Loyalty
- Coupons
- Reviews
- Advanced analytics
- Multi-branch

---

# 35. Décisions à valider avec le client avant développement

Les points suivants doivent être confirmés :

1. Le restaurant accepte-t-il les commandes sur place ?
2. Takeaway est-il disponible ?
3. La livraison est-elle disponible ?
4. Si oui, quelles zones ?
5. Quels sont les frais de livraison ?
6. Le client peut-il commander sans compte ?
7. Quels moyens de paiement sont acceptés ?
8. Quel prestataire de paiement sera utilisé ?
9. Le paiement en ligne est-il obligatoire ou optionnel ?
10. Le restaurant possède-t-il déjà un compte marchand ?
11. Le menu définitif est-il disponible ?
12. Les prix sont-ils TTC ?
13. Quelles sont les catégories ?
14. Quels produits possèdent des options ?
15. Quelles sont les heures d'ouverture ?
16. Quels utilisateurs auront accès au dashboard ?
17. Le restaurant veut-il des statistiques ?
18. Le restaurant veut-il des QR codes de table ?
19. Le français est-il suffisant ?
20. L'arabe/RTL doit-il être supporté ?
21. Le restaurant dispose-t-il d'un logo officiel ?
22. Existe-t-il une charte graphique ?
23. Qui possède les comptes Apple/Google ?
24. Qui possède le compte de paiement ?
25. Qui paie les services cloud ?
26. Quel niveau de maintenance est attendu après livraison ?

---

# 36. Recommandation finale

La stratégie recommandée est de commencer par une démonstration fonctionnelle du parcours principal :

```text
Client
  ↓
Menu
  ↓
Produit
  ↓
Panier
  ↓
Checkout
  ↓
Commande
  ↓
Restaurant
  ↓
Confirmation
  ↓
Préparation
  ↓
Commande prête
  ↓
Client
```

Cette démonstration doit être construite avant les fonctionnalités secondaires.

La Full V1 sera ensuite développée sur la même architecture, en ajoutant le paiement réel, les notifications, la sécurité renforcée, les rôles, les statistiques et le déploiement production.

---

## Références techniques

- OWASP Mobile Application Security Verification Standard (MASVS) : https://mas.owasp.org/MASVS/
- Apple Developer Program : https://developer.apple.com/programs/
- Google Play Console : https://play.google.com/console/about/
- Expo / EAS : https://docs.expo.dev/eas/
- Supabase Pricing : https://supabase.com/pricing
- CMI — Solutions de paiement e-commerce : https://www.cmi.co.ma/fr/solutions-paiement-ecommerce

---

## Statut du document

**Version : 1.0 Draft**

Ce document constitue la base de cadrage du projet. Les éléments relatifs au menu, aux modes de commande, à la livraison, au paiement, à l'identité graphique et aux règles opérationnelles doivent être validés avec Terrasse Bleue avant le lancement de la phase de production.
