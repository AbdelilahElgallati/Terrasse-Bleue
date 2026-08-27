# Terrasse Bleue — Étude du projet de production

**Version :** 1.0  
**Date :** 13 août 2026  
**Équipe :** 2 développeurs  
**Durée cible :** 2,5 à 3 mois  
**Document source :** `Cahier_des_Charges_Terrasse_Bleue_Full_V1.md`

---

## 1. Objet du document

Ce document prépare les réunions de cadrage avec le client Terrasse Bleue. Il présente :

1. les choix technologiques et leur justification ;
2. une architecture de base et les communications entre les composants ;
3. trente questions à poser au client ;
4. une estimation des coûts fixes d’exploitation ;
5. une estimation réaliste du prix du projet ;
6. une estimation de la charge et un planning de 2,5 à 3 mois.

Le prototype actuel constitue une bonne preuve de concept. La version commerciale devra être créée dans un nouveau projet propre, en réutilisant uniquement les composants validés, et non en publiant le prototype tel quel.

---

## 2. État actuel du prototype

Le prototype est un monorepo TypeScript comprenant :

- une application mobile React Native avec Expo ;
- une interface d’administration Next.js ;
- un menu public Next.js ;
- une API NestJS ;
- une base PostgreSQL gérée avec Prisma ;
- une communication temps réel avec Socket.IO ;
- Neon pour la base de démonstration ;
- Render pour l’API de démonstration ;
- Vercel pour le menu et l’administration.

### 2.1 Éléments déjà présents

- authentification JWT ;
- hachage Argon2id des mots de passe ;
- catalogue, catégories, produits et options ;
- panier et checkout ;
- commandes sur place, à emporter et en livraison ;
- historique des changements de statut ;
- simulation de paiement ;
- suivi temps réel ;
- administration des commandes et du catalogue ;
- gestion initiale du personnel et des rôles ;
- paramètres du restaurant ;
- clients, rapports et indicateurs simples ;
- menu public accessible par QR code ;
- déploiement fonctionnel de démonstration.

### 2.2 Éléments à développer ou professionnaliser

- paiement réel CMI ou autre prestataire ;
- webhooks signés, idempotence et remboursements réels ;
- mot de passe oublié et réinitialisation ;
- validation d’adresse e-mail et gestion renforcée des sessions ;
- notifications push et e-mail ;
- stockage objet pour les images ;
- journal d’audit ;
- permissions RBAC détaillées ;
- horaires, jours fériés et fermetures exceptionnelles ;
- gestion complète des adresses ;
- monitoring, alertes, sauvegardes et tests de restauration ;
- CI/CD et environnements séparés ;
- tests métier, intégration et end-to-end ;
- politique de confidentialité, CGU et conservation des données ;
- builds Android/iOS et publication sur les stores ;
- validation définitive du menu, des prix, des photos et des règles métier.

---

# Partie 1 — Choix technologiques et architecture

## 3. Technologies recommandées

| Composant | Technologie | Justification |
|---|---|---|
| Application mobile | React Native + Expo + TypeScript | Une base commune Android/iOS, développement rapide et accès aux fonctions natives |
| Navigation mobile | Expo Router | Navigation structurée adaptée à Expo |
| État serveur | TanStack Query | Cache, synchronisation, invalidation et gestion des erreurs |
| État local | Zustand | Solution légère pour le panier et les données locales |
| Administration | Next.js + TypeScript | Interface performante, responsive et maintenable |
| Menu public | Next.js | SEO, accès sans installation, URL publique et QR code |
| API | NestJS | Architecture modulaire, validation, injection de dépendances et WebSocket |
| Base de données | PostgreSQL | Transactions et intégrité adaptées aux commandes et paiements |
| ORM | Prisma | Schéma typé, migrations et accès sécurisé à PostgreSQL |
| Temps réel | Socket.IO | Mises à jour immédiates et gestion de la reconnexion |
| Authentification | JWT court + refresh token rotatif | Compatible mobile/web avec révocation serveur |
| Images | Cloudflare R2 ou S3 compatible | Stockage adapté aux médias sans alourdir PostgreSQL |
| Paiement | Adaptateur CMI/provider | Évite de coupler tout le système à un seul prestataire |
| Push | Expo Notifications | Adapté à une première version Expo Android/iOS |
| E-mail | Brevo, Resend ou service SMTP | Mot de passe oublié et messages transactionnels |
| Hébergement API | Render payant ou VPS managé | API disponible sans mise en veille en production |
| Base hébergée | Neon Launch ou PostgreSQL managé | Sauvegardes, restauration et montée en charge |
| Hébergement web | Vercel Pro ou alternative commerciale | CDN, HTTPS, previews et déploiement automatique |
| DNS/CDN | Cloudflare | DNS, TLS, cache et protections réseau |
| Gestion de projet | Jira + GitHub | Backlog, sprints, code review et traçabilité |
| CI/CD | GitHub Actions | Vérification automatique des types, tests et builds |

## 4. Architecture de production simplifiée

```text
                         CLIENTS
            ┌──────────────┼──────────────┐
            │              │              │
       Mobile Expo    Menu public      Admin/Kitchen
       Android/iOS     Next.js           Next.js
            │              │              │
            └──────────────┼──────────────┘
                           │ HTTPS / Socket.IO
                           ▼
                   Cloudflare / DNS / TLS
                           │
                           ▼
                      API NestJS
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
    PostgreSQL/Neon   Object Storage     Services externes
    données métier    photos produits    paiement/push/e-mail
```

## 5. Communication entre les composants

1. Les applications ne se connectent jamais directement à PostgreSQL.
2. Le mobile, le menu et l’administration communiquent avec l’API par HTTPS/JSON.
3. L’API contrôle l’identité, les permissions et la validité des données.
4. PostgreSQL reste la source officielle des données.
5. Socket.IO transmet les changements rapidement, mais ne remplace jamais la base.
6. Le paiement est initié par l’API et confirmé par un webhook signé du prestataire.
7. Les données bancaires sensibles ne sont jamais enregistrées par Terrasse Bleue.
8. Les images sont stockées dans un stockage objet ; la base conserve uniquement leurs URL.
9. Le menu public reste accessible sans compte et sans installation mobile.
10. Les environnements développement, staging et production utilisent des bases et secrets différents.

## 6. Structure recommandée du nouveau projet

```text
terrasse-bleue-production/
├── apps/
│   ├── api/
│   ├── admin/
│   ├── menu/
│   └── mobile/
├── packages/
│   ├── contracts/
│   ├── validation/
│   ├── config/
│   └── tooling/
├── prisma/
├── docs/
├── infrastructure/
└── .github/workflows/
```

Le monorepo reste approprié pour deux développeurs : il facilite les types partagés, les changements atomiques et la CI. Le nouveau dépôt devra cependant contenir uniquement le code et les données validés.

---

# Partie 2 — Questions à poser au client

## 7. Trente questions de cadrage

### 7.1 Activité, problème et objectifs

1. Quel problème opérationnel principal voulez-vous résoudre avec cette solution ?
2. Comment recevez-vous actuellement les commandes et où se produisent les erreurs ?
3. Quel résultat mesurable définira le succès trois mois après le lancement ?
4. Combien de commandes recevez-vous en moyenne par jour et aux heures de pointe ?
5. Le système concerne-t-il uniquement Terrasse Bleue ou de futures succursales ?
6. Quelle date de lancement est obligatoire et quels événements doivent être pris en compte ?

### 7.2 Parcours de commande

7. Autorisez-vous les commandes sur place, à emporter et en livraison ?
8. Pour une commande sur place, faut-il identifier la table avec un QR spécifique ?
9. Le client peut-il commander sans créer de compte ?
10. Une commande doit-elle être acceptée manuellement avant sa préparation ?
11. Jusqu’à quel statut le client peut-il annuler sa commande ?
12. Que faut-il faire si un produit devient indisponible après la commande ?
13. Quelles sont les zones, les horaires, les minimums et les frais de livraison ?
14. Le client peut-il planifier une commande pour une heure ultérieure ?
15. Faut-il limiter le nombre de commandes acceptées pendant une période de pointe ?

### 7.3 Menu et règles commerciales

16. Qui fournit et valide le menu, les prix, les descriptions, les photos et les traductions ?
17. Les prix affichés sont-ils TTC et quelles informations fiscales doivent apparaître ?
18. Quels produits possèdent des tailles, suppléments, cuissons ou options obligatoires ?
19. Faut-il gérer des promotions, coupons, formules ou prix selon l’horaire ?
20. Qui sera autorisé à modifier les prix et la disponibilité des produits ?
21. Le français suffit-il ou faut-il prévoir l’arabe/RTL et l’anglais dès la V1 ?

### 7.4 Paiement et remboursement

22. Quels moyens de paiement seront proposés : espèces, TPE, CMI en ligne ou autre ?
23. Le restaurant possède-t-il déjà un contrat et des identifiants marchands ?
24. Le paiement doit-il être réalisé avant ou après l’acceptation de la commande ?
25. Quelles règles appliquer aux annulations, échecs et remboursements partiels ?
26. Qui traitera les litiges, remboursements et rapprochements comptables ?

### 7.5 Personnel, exploitation et propriété

27. Quels rôles utiliseront le dashboard et quelles actions chaque rôle peut-il effectuer ?
28. Quels appareils et quelle connexion Internet sont disponibles en cuisine et à la caisse ?
29. Qui possédera et paiera le domaine, le cloud, CMI et les comptes Apple/Google ?
30. Quelle maintenance attendez-vous après livraison : horaires de support, délai d’intervention, formation, garantie et budget mensuel ?

## 8. Exploitation des réponses

Chaque réponse importante doit devenir :

- une décision écrite et validée ;
- une règle métier ;
- un ou plusieurs critères d’acceptation ;
- une story Jira ;
- une éventuelle exclusion contractuelle ;
- une dépendance avec un responsable et une date limite.

## 8.1 Questions complémentaires de préparation (31 à 60)

### Exploitation du restaurant

31. Qui confirme les commandes pendant le service : caisse, cuisine ou manager ?
32. Faut-il imprimer automatiquement les tickets de commande ?
33. Le restaurant utilise-t-il déjà une caisse ou un logiciel POS à intégrer ?
34. Combien de personnes utiliseront simultanément l’administration ?
35. Une alerte sonore doit-elle continuer jusqu’à l’acceptation de la commande ?
36. Quels motifs de refus ou d’annulation doivent être proposés au personnel ?
37. Faut-il afficher une estimation de préparation calculée ou saisie manuellement ?
38. Comment gérer une commande partiellement disponible ?
39. Le restaurant souhaite-t-il suspendre temporairement toutes les commandes ?
40. Qui est responsable de la mise à jour quotidienne des disponibilités ?

### Données, sécurité et conformité

41. Quelles données client sont réellement nécessaires au fonctionnement ?
42. Pendant combien de temps faut-il conserver comptes, commandes et factures ?
43. Le client doit-il pouvoir supprimer son compte et exporter ses données ?
44. Qui peut consulter le chiffre d’affaires et les données personnelles ?
45. Faut-il une authentification renforcée pour les managers ?
46. Quelles actions doivent obligatoirement apparaître dans le journal d’audit ?
47. Qui doit être alerté en cas de panne, erreur de paiement ou sauvegarde échouée ?
48. Quel délai maximal de restauration est acceptable après une panne ?
49. Qui valide la politique de confidentialité, les CGU et les mentions légales ?
50. Existe-t-il des exigences comptables ou fiscales particulières à respecter ?

### Livraison, qualité et évolution

51. La livraison est-elle assurée par le restaurant ou un partenaire externe ?
52. Comment vérifier qu’une adresse appartient à la zone de livraison ?
53. Faut-il communiquer le numéro du client au livreur ?
54. Le client doit-il recevoir une preuve de livraison ?
55. Quels modèles de téléphones et versions Android/iOS doivent être supportés ?
56. Quels navigateurs et appareils seront utilisés dans le restaurant ?
57. Qui participera à la recette et qui signera l’acceptation finale ?
58. Combien de personnes doivent être formées et sous quelle forme ?
59. Quelles statistiques seront réellement utilisées chaque semaine ?
60. Quelles évolutions sont envisagées dans les douze mois suivant le lancement ?

---

# Partie 3 — Coûts fixes d’exploitation

## 9. Hypothèses financières

Les montants sont des estimations de cadrage, hors TVA éventuelle. Pour simplifier les conversions :

```text
1 USD ≈ 10 MAD
```

Les tarifs des fournisseurs, le taux de change et la consommation réelle peuvent évoluer. Ils doivent être vérifiés avant la signature du contrat.

## 10. Coût de la démonstration actuelle

| Service | Estimation |
|---|---:|
| Render Free | 0 MAD/mois |
| Neon Free | 0 MAD/mois |
| Vercel Hobby | 0 MAD/mois |
| Expo Go | 0 MAD |
| Sous-domaines fournis par les hébergeurs | 0 MAD |
| **Total** | **0 MAD/mois** |

Cette architecture est adaptée à une démonstration, mais pas à une exploitation commerciale permanente. Les services gratuits peuvent être limités, suspendus ou mis en veille.

## 11. Petite production recommandée

| Poste | Mensuel estimé | Annuel estimé |
|---|---:|---:|
| API Render Starter ou équivalent | 70–150 MAD | 840–1 800 MAD |
| Neon Launch | 50–250 MAD | 600–3 000 MAD |
| Vercel Pro | environ 200 MAD | environ 2 400 MAD |
| Stockage images R2 | 0–50 MAD | 0–600 MAD |
| E-mail transactionnel | 0–150 MAD | 0–1 800 MAD |
| Monitoring et logs | 0–150 MAD | 0–1 800 MAD |
| Nom de domaine `.ma` ou `.com` | — | 120–400 MAD |
| Sauvegarde externe complémentaire | 30–100 MAD | 360–1 200 MAD |
| **Total estimé** | **350–1 000 MAD/mois** | **4 200–12 000 MAD/an** |

## 11.1 Dimensionnement réel pour environ 100 utilisateurs par jour

Cent utilisateurs par jour représentent une petite charge. Il n’est pas nécessaire d’acheter tous les plans Pro dès le lancement.

### Socle minimal recommandé au lancement

| Poste | Plan retenu | Montant contractuel de référence |
|---|---|---:|
| API | Render Starter, 512 MB | **7 USD/mois ≈ 70 MAD/mois** |
| Web commercial | Vercel Pro, un compte propriétaire | **20 USD/mois ≈ 200 MAD/mois** |
| PostgreSQL | Neon Free au démarrage | **0 MAD/mois** |
| Expo/EAS | Free | **0 MAD/mois** |
| Stockage images | Cloudflare R2 Free dans les limites | **0 MAD/mois** |
| E-mail | Offre gratuite du fournisseur dans les limites | **0 MAD/mois** |
| Monitoring | Offres gratuites intégrées | **0 MAD/mois** |
| **Total mensuel fixe de départ** |  | **270 MAD/mois** |

### Budget à annoncer au client

Pour couvrir les variations de change et de petites consommations :

```text
Budget infrastructure récurrent conseillé : 300 MAD/mois
Plafond de sécurité proposé : 500 MAD/mois sans nouvelle validation
```

Le montant de **270 MAD/mois** est le socle calculé à partir de 7 USD + 20 USD. Le montant facturé en MAD varie avec le taux bancaire, les taxes et le change. **300 MAD/mois** est donc le budget de négociation raisonnable, pas une garantie du fournisseur.

### Coûts annuels et uniques séparés

| Poste | Budget à annoncer |
|---|---:|
| Domaine `.ma` ou `.com` | **300 MAD/an provisionnés**, achat au prix réel du registrar choisi |
| Google Play Console | **25 USD ≈ 250 MAD**, une seule fois |
| Apple Developer Program | **99 USD ≈ 990 MAD/an** |

### Total de première année

Sans publication iOS :

```text
300 MAD × 12 + 300 MAD domaine + 250 MAD Google Play
= 4 150 MAD la première année
```

Avec publication Android et iOS :

```text
4 150 MAD + 990 MAD Apple
= 5 140 MAD la première année
```

Ces totaux n’incluent pas les commissions du prestataire de paiement, les SMS, la maintenance ni les dépassements de consommation.

### Quand passer à un plan supérieur ?

- Neon Launch : lorsque la base approche 0,5 GB, lorsque la fenêtre de restauration de six heures est insuffisante ou lorsqu’une disponibilité contractuelle supérieure est demandée.
- Render supérieur : lorsque la mémoire/CPU est insuffisante ou que les temps de réponse se dégradent sous charge réelle.
- Expo Starter : uniquement si les builds gratuits ou la file d’attente deviennent gênants.
- Stockage payant : uniquement après dépassement du quota gratuit.
- Monitoring payant : seulement si la conservation des logs ou les alertes gratuites ne suffisent plus.

## 12. Publication mobile

| Poste | Coût indicatif |
|---|---:|
| Google Play Console | environ 250 MAD, une fois |
| Apple Developer Program | environ 990 MAD/an |
| EAS Build | gratuit dans les limites, puis selon usage |
| Appareils de test | à fournir, acheter ou emprunter |

Les comptes stores doivent appartenir au client, pas aux développeurs.

## 13. Éléments non compris dans l’infrastructure

- commission CMI ou du prestataire de paiement ;
- frais bancaires par transaction ;
- envoi de SMS ;
- photographie professionnelle ;
- tablette, écran, imprimante ou matériel réseau ;
- maintenance applicative ;
- support après la période de garantie ;
- publicité et marketing ;
- frais juridiques et comptables ;
- TVA éventuelle ;
- création ou régularisation des comptes professionnels.

Le tarif et le délai CMI doivent être confirmés directement par une offre officielle du prestataire.

---

# Partie 4 — Estimation du prix du projet

## 14. Hypothèses de l’estimation

L’estimation suppose :

- deux développeurs ;
- dix à douze semaines ;
- une seule enseigne ;
- une base React Native commune Android/iOS ;
- un menu web et une administration web ;
- un seul prestataire de paiement ;
- une langue principale ;
- aucune application chauffeur ;
- aucune fidélité avancée ;
- aucun fonctionnement multi-restaurant ;
- contenu et validations client fournis sans retard majeur.

## 15. Fourchettes commerciales

| Offre | Contenu | Prix indicatif |
|---|---|---:|
| MVP commercial | Auth, menu, panier, commandes, admin, suivi et déploiement ; paiement éventuellement reporté | **70 000–95 000 MAD** |
| V1 recommandée | MVP + paiement réel, push, personnel, rapports, médias, CI/CD, sécurité et publication | **95 000–140 000 MAD** |
| Full V1 étendue | Cahier complet avec audit, analytics avancées, horaires, adresses, multilingue et publication complète | **140 000–190 000 MAD** |

### Proposition recommandée

```text
Projet V1 : 105 000 à 135 000 MAD
Infrastructure, comptes stores et frais CMI : à la charge du client
Maintenance après garantie : contrat séparé
```

Cette fourchette devra être ajustée après les ateliers de cadrage et la validation du périmètre.

## 16. Calcul interne possible

```text
750 à 900 heures d’équipe
× 130 à 160 MAD/heure
= 97 500 à 144 000 MAD
```

Le prix ne couvre pas uniquement le codage. Il inclut également :

- ateliers et analyse ;
- conception technique ;
- organisation Jira ;
- UI/UX ;
- développement ;
- revues croisées ;
- tests ;
- déploiement ;
- documentation ;
- formation ;
- corrections de recette ;
- coordination avec les fournisseurs ;
- risque technique et commercial.

## 17. Échéancier de paiement conseillé

| Jalon | Pourcentage |
|---|---:|
| Signature et lancement | 20 % |
| Validation UX et architecture | 20 % |
| Parcours de commande fonctionnel | 25 % |
| Administration, paiement et staging | 20 % |
| Recette et livraison | 15 % |

Le contrat doit aussi préciser :

- le périmètre détaillé ;
- les exclusions ;
- la procédure de demande de changement ;
- le nombre de cycles de correction compris ;
- les obligations et délais de réponse du client ;
- la propriété intellectuelle après paiement intégral ;
- une garantie corrective de 30 à 60 jours ;
- un contrat de maintenance séparé.

### Maintenance indicative

```text
1 500 à 4 000 MAD/mois selon le périmètre et le SLA
```

---

# Partie 5 — Temps de travail et planning

## 18. Capacité de deux développeurs

En considérant environ 35 heures productives par développeur et par semaine :

| Durée | Capacité brute | Capacité planifiable à 80 % |
|---|---:|---:|
| 10 semaines | 700 h | 560 h |
| 11 semaines | 770 h | 616 h |
| 12 semaines | 840 h | 672 h |

Les 20 % non planifiés couvrent les réunions, changements de contexte, blocages, déploiements et corrections imprévues.

Une V1 stricte peut tenir en 11 à 12 semaines. La totalité du cahier des charges actuel demanderait plutôt 14 à 18 semaines sans réduction de périmètre.

## 19. Planning recommandé sur 12 semaines

| Semaine | Phase | Livrables principaux |
|---|---|---|
| 1 | Cadrage | Ateliers, réponses aux questions, périmètre, risques et backlog |
| 2 | Architecture et UX | Maquettes, modèle de données, API, environnements et CI |
| 3–4 | Fondation | Auth, utilisateurs, catalogue, stockage média et administration initiale |
| 5–6 | Commande | Panier, checkout, règles de prix, livraison et création des commandes |
| 7 | Exploitation | Dashboard, cuisine, statuts et rôles |
| 8 | Temps réel | Socket.IO, historique, reconnexion et synchronisation |
| 9 | Paiement | Provider, webhook, idempotence, échecs et remboursements |
| 10 | Notifications | Push, e-mail, mot de passe oublié et préférences |
| 11 | QA et staging | E2E, sécurité, performance, sauvegarde et recette client |
| 12 | Livraison | Corrections, formation, documentation, builds et production |

## 20. Répartition indicative de l’équipe

### Développeur A — Backend et infrastructure

- NestJS ;
- Prisma/PostgreSQL ;
- authentification ;
- paiement ;
- WebSocket ;
- sécurité ;
- infrastructure et CI/CD.

### Développeur B — Frontend et mobile

- application mobile Expo ;
- administration Next.js ;
- menu public ;
- UI/UX ;
- notifications côté client ;
- accessibilité et tests visuels.

### Responsabilités partagées

- modèle métier ;
- contrats API ;
- revues de pull requests ;
- tests end-to-end ;
- démonstrations ;
- documentation ;
- suivi Jira.

Aucune pull request importante ne doit être fusionnée sans revue de l’autre membre.

## 21. Organisation Jira

### Structure

```text
Epic
└── Story
    ├── Sous-tâche frontend
    ├── Sous-tâche backend
    ├── Tests
    └── Documentation
```

### Epics principaux

1. Discovery et architecture
2. Identité et comptes
3. Catalogue et médias
4. Panier et checkout
5. Commandes
6. Administration restaurant
7. Paiement
8. Notifications
9. Temps réel
10. Sécurité
11. Infrastructure
12. Publication et formation

### Workflow

```text
Backlog → Ready → In Progress → Code Review → QA → Client Review → Done
```

## 22. Definition of Done

Une story est terminée lorsque :

- les critères d’acceptation sont satisfaits ;
- lint et vérification TypeScript passent ;
- les tests nécessaires sont ajoutés et réussissent ;
- la revue de code est approuvée ;
- les états loading, error et empty sont traités ;
- les interfaces mobile et responsive sont vérifiées ;
- aucun secret n’est commité ;
- la documentation est mise à jour ;
- la fonctionnalité est déployée sur staging ;
- la validation fonctionnelle est obtenue.

## 23. Jalons de démonstration

| Fin de semaine | Démonstration |
|---|---|
| 2 | Maquettes et architecture |
| 4 | Authentification et catalogue |
| 6 | Commande complète sans paiement réel |
| 8 | Administration et temps réel |
| 10 | Paiement et notifications |
| 12 | Candidat à la production |

## 24. Risques majeurs

| Risque | Mesure proposée |
|---|---|
| Retard CMI | Mock contractuel dès le début et intégration isolée |
| Menu ou photos non validés | Date limite client et contenu provisoire clairement identifié |
| Changements de périmètre | Change Request chiffrée et planifiée |
| Publication Apple/Google | Création des comptes client dès la première semaine |
| Trop de fonctionnalités | Priorités P0/P1/P2 strictes |
| Manque de disponibilité client | Réunion hebdomadaire et délai de validation convenu |
| Réseau du restaurant insuffisant | Test sur site avant la recette |
| Échec des notifications | Historique interne et mécanisme de rafraîchissement |
| Perte de données | Sauvegardes automatiques et test de restauration |
| Dépendance excessive au prototype | Réutilisation auditée, pas de copie aveugle |

---

## 25. Périmètre conseillé pour tenir trois mois

### V1 de lancement

- authentification ;
- menu et produits ;
- panier et checkout ;
- commandes sur place et à emporter ;
- livraison simple si les règles sont validées ;
- administration des commandes et produits ;
- rôles essentiels ;
- suivi temps réel ;
- paiement réel avec un seul prestataire ;
- notifications principales ;
- stockage des images ;
- staging, production, sauvegardes et monitoring ;
- builds Android et iOS.

### V1.1 ou V2

- fidélité ;
- coupons complexes ;
- application chauffeur ;
- multi-restaurant ;
- analytics avancées ;
- campagnes marketing ;
- réservations ;
- intégration caisse/POS ;
- multilingue complet s’il n’est pas indispensable au lancement ;
- gestion avancée des stocks.

---

## 26. Recommandation finale

Le prototype actuel doit servir de :

- preuve fonctionnelle ;
- référence UX ;
- support de discussion avec le client ;
- laboratoire pour valider les règles métier.

La version de production doit être un nouveau projet propre, construit avec :

- un périmètre contractuel validé ;
- une architecture renforcée ;
- des environnements séparés ;
- une vraie intégration de paiement ;
- un stockage média adapté ;
- des sauvegardes et du monitoring ;
- une stratégie de tests ;
- une organisation Jira et Git stricte.

Une durée de 2,5 à 3 mois est réaliste pour une V1 maîtrisée, mais pas pour toutes les fonctionnalités possibles du cahier des charges. La réussite dépend principalement de la stabilité du périmètre, de la rapidité des validations client et de la disponibilité précoce des comptes CMI, Apple et Google.

## 26.1 Supports visuels pour la réunion

- Architecture complète pour le rapport : `docs/architecture/architecture-pfe-full.png`
- Architecture de déploiement et coûts : `docs/architecture/architecture-pfe-deploiement.png`
- Parcours technique d’une commande : `docs/architecture/architecture-pfe-sequence.png`
- Versions vectorielles modifiables et adaptées à l’impression : fichiers `.svg` correspondants dans `docs/architecture/`

## 26.2 Documents à préparer avant de négocier

### Documents commerciaux

- présentation courte du problème, de la solution et de la valeur métier ;
- périmètre V1 avec une liste claire des exclusions ;
- devis avec prix, jalons de paiement et durée de validité ;
- contrat ou proposition précisant propriété, confidentialité et garantie ;
- formulaire de demande de changement avec impact coût/délai ;
- offre de maintenance séparée avec horaires et SLA.

### Documents produit

- compte rendu des réponses aux soixante questions ;
- personas et rôles réels ;
- parcours client et parcours restaurant ;
- règles de commande, livraison, annulation et remboursement ;
- menu définitif avec prix TTC, options et disponibilités ;
- maquettes approuvées et identité graphique officielle ;
- backlog Jira priorisé P0/P1/P2 ;
- critères d’acceptation et plan de recette signé.

### Éléments techniques et opérationnels

- matrice des rôles et permissions ;
- inventaire des comptes appartenant au client ;
- plan des environnements et secrets ;
- politique de sauvegarde et exercice de restauration ;
- stratégie de logs, monitoring et alertes ;
- stratégie de tests et appareils supportés ;
- plan de publication Android/iOS ;
- plan de formation et guide administrateur ;
- procédure en cas de panne, paiement échoué ou incident de sécurité.

### Responsabilités que le client doit accepter

- fournir et valider le contenu dans les délais ;
- ouvrir et payer les comptes cloud, CMI et stores ;
- désigner un décideur disponible ;
- fournir les informations légales et commerciales ;
- participer aux recettes et signer les jalons ;
- disposer d’une connexion et d’appareils adaptés au restaurant.

---

## 27. Références indicatives

- Cahier des charges interne : `docs/Cahier_des_Charges_Terrasse_Bleue_Full_V1.md`
- Guide de démonstration : `docs/free-demo-hosting-guide.md`
- Render Free : <https://render.com/docs/free>
- Render Pricing : <https://render.com/pricing>
- Neon Pricing : <https://neon.com/pricing>
- Vercel Pricing : <https://vercel.com/pricing>
- Expo/EAS Pricing : <https://expo.dev/pricing>
- Apple Developer Program : <https://developer.apple.com/programs/>
- Google Play Console : <https://play.google.com/console/about/>
- Cloudflare R2 Pricing : <https://developers.cloudflare.com/r2/pricing/>
- CMI : <https://www.cmi.co.ma/fr/solutions-paiement-ecommerce>

> **Note :** tous les prix sont indicatifs et doivent être vérifiés au moment de préparer l’offre commerciale définitive.
