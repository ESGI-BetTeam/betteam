# Checklist API BetTeam

> **Derniere mise a jour:** 2026-01-26
> **Version:** 1.9.0 (+ Audit Securite)

Cette checklist permet de suivre l'avancement du développement de l'API BetTeam.

---

## Légende

- [x] Fonctionnalité implémentée et testée
- [ ] Fonctionnalité à implémenter
- [~] Fonctionnalité partiellement implémentée

---

## 1. Infrastructure & Configuration

### Base
- [x] Setup Express.js avec TypeScript
- [x] Configuration Prisma ORM
- [x] Connexion PostgreSQL
- [x] Variables d'environnement (.env)
- [x] CORS configuré
- [x] Middleware de gestion d'erreurs

### Documentation
- [x] Swagger UI (`/api-docs`)
- [x] Documentation YAML des endpoints
- [ ] Documentation des modèles Swagger (schemas)
- [ ] Exemples de requêtes/réponses dans Swagger

### Monitoring
- [x] Endpoint Health Check (`GET /api/health`)
- [ ] Logging structuré (Winston/Pino)
- [ ] Métriques de performance
- [ ] Alerting en cas d'erreur

### Securite (voir Section 14 - Audit Securite)
- [x] JWT Authentication
- [x] Hachage des mots de passe (bcrypt)
- [~] Validation des entrees utilisateur (partielle, Zod recommande)
- [ ] Rate limiting global **CRITIQUE**
- [ ] Protection CSRF (CORS permissif) **CRITIQUE**
- [ ] Helmet.js (headers de securite) **HAUTE**
- [ ] Protection routes sync/cleanup **CRITIQUE**

---

## 2. Authentification (`/api/auth`)

### Endpoints
- [x] `POST /api/auth/register` - Inscription (+ refresh token)
- [x] `POST /api/auth/login` - Connexion (+ refresh token)
- [x] `GET /api/auth/me` - Profil utilisateur connecté
- [x] `POST /api/auth/logout` - Déconnexion (révocation des refresh tokens)
- [x] `POST /api/auth/refresh` - Rafraîchir le token (rotation)
- [x] `POST /api/auth/forgot-password` - Mot de passe oublié
- [x] `POST /api/auth/reset-password` - Réinitialiser mot de passe

### Fonctionnalités
- [x] Access Token JWT (15 minutes)
- [x] Refresh Token (7 jours, stocké en DB, hashé)
- [x] Rotation des refresh tokens
- [x] Validation email unique
- [x] Validation username unique
- [x] Middleware d'authentification
- [x] Révocation de tous les tokens au reset password
- [x] Protection contre l'énumération d'emails (forgot-password)
- [ ] `POST /api/auth/verify-email` - Vérification email
- [ ] OAuth2 (Google, Apple, Facebook)
- [ ] Service d'envoi d'emails (actuellement: log console)

---

## 3. Utilisateurs (`/api/users`)

### Endpoints
- [x] `GET /api/users` - Liste des utilisateurs (pagination, recherche)
- [x] `GET /api/users/:id` - Détails d'un utilisateur
- [x] `PATCH /api/users/:id` - Modifier son profil
- [x] `POST /api/users/:id/password` - Changer son mot de passe
- [x] `DELETE /api/users/:id` - Désactiver son compte (soft delete)

### Fonctionnalités
- [x] Pagination (page, limit)
- [x] Recherche par username/email/nom
- [x] Auto-autorisation (modifier uniquement son propre profil)
- [x] Soft delete (isActive = false)
- [ ] Upload avatar (stockage fichiers)
- [ ] Statistiques utilisateur (nombre de paris, ligues, etc.)
- [ ] Historique d'activité

---

## 4. Compétitions (`/api/competitions`)

### Endpoints
- [x] `GET /api/competitions` - Liste des compétitions
- [x] `GET /api/competitions/:id` - Détails d'une compétition
- [x] `GET /api/competitions/:id/teams` - Équipes d'une compétition
- [x] `GET /api/competitions/:id/matches` - Matchs d'une compétition

### Fonctionnalités
- [x] Filtres: sport, country, isActive
- [x] Pagination des matchs
- [x] 12 compétitions supportées (Football, Rugby, Tennis, etc.)
- [ ] `GET /api/competitions/:id/standings` - Classement de la compétition
- [ ] Favoris utilisateur (compétitions suivies)

---

## 5. Équipes (`/api/teams`) ✅ IMPLÉMENTÉ

### Endpoints
- [x] Équipes via `/api/competitions/:id/teams`
- [x] `GET /api/teams` - Liste de toutes les équipes (pagination, recherche, filtres)
- [x] `GET /api/teams/:id` - Détails d'une équipe
- [x] `GET /api/teams/:id/stats` - Statistiques d'une équipe
- [x] `GET /api/teams/:id/matches` - Matchs d'une équipe
- [x] `GET /api/teams/:id/players` - Joueurs d'une équipe
- [x] `GET /api/teams/countries` - Liste des pays disponibles
- [x] `GET /api/teams/search` - Recherche d'équipes

### Favoris utilisateur
- [x] `POST /api/teams/:id/favorite` - Ajouter aux favoris
- [x] `DELETE /api/teams/:id/favorite` - Retirer des favoris
- [x] `GET /api/teams/:id/is-favorite` - Vérifier si favori
- [x] `GET /api/users/me/favorite-teams` - Mes équipes favorites

### Fonctionnalités
- [x] Sync depuis TheSportsDB
- [x] Recherche d'équipes
- [x] Statistiques équipe (wins, draws, losses, goals, winRate)
- [x] Favoris utilisateur (équipes suivies)
- [x] Sync joueurs (`POST /api/sync/players`)

**Modèle Prisma:** ✅ Existe (`Team`, `Player`, `UserFavoriteTeam`)

---

## 6. Matchs (`/api/matches`)

### Endpoints
- [x] `GET /api/matches` - Liste des matchs avec filtres
- [x] `GET /api/matches/today` - Matchs du jour
- [x] `GET /api/matches/upcoming` - Matchs à venir (7 jours)
- [x] `GET /api/matches/:id` - Détails d'un match

### Fonctionnalités
- [x] Filtres: sport, competitionId, status, startDate, endDate
- [x] Pagination (limit, offset)
- [x] Status: upcoming, live, finished, postponed, cancelled
- [ ] `GET /api/matches/live` - Matchs en cours
- [ ] Statistiques détaillées du match
- [ ] Événements du match (buts, cartons, etc.)
- [ ] WebSocket pour scores en temps réel

---

## 7. Synchronisation TheSportsDB (`/api/sync`)

### Endpoints
- [x] `POST /api/sync/competitions` - Sync compétitions
- [x] `POST /api/sync/competitions/football` - Sync football uniquement
- [x] `POST /api/sync/teams` - Sync équipes
- [x] `POST /api/sync/matches` - Sync matchs
- [x] `POST /api/sync/all` - Sync complète
- [x] `GET /api/sync/status` - Statut de synchronisation

### Fonctionnalités
- [x] Client HTTP avec rate limiting (30 req/min)
- [x] File d'attente de requêtes
- [x] Gestion erreur 429 avec retry
- [x] Logs de synchronisation (SyncLog)
- [x] Cache en mémoire (TTL configurable)
- [x] CRON job: sync compétitions (1x/jour à 3h)
- [x] CRON job: sync équipes (1x/jour à 4h)
- [x] CRON job: sync matchs (toutes les 6h)
- [ ] Sync des joueurs
- [ ] Sync des classements (standings)
- [ ] Webhook pour notifications de mise à jour

---

## 7b. Synchronisation The Odds API - Cotes (`/api/sync/odds`) ✅ IMPLÉMENTÉ

> **API externe:** https://the-odds-api.com/
> **Limite:** 500 requêtes/mois (gratuit)
> **Stratégie:** CRON 2x/jour (9h et 18h)

### Endpoints
- [x] `POST /api/sync/odds` - Sync cotes (toutes ou par compétition)
- [x] `GET /api/sync/odds/status` - Statut de synchronisation des cotes
- [x] `GET /api/matches/:id/odds` - Cotes d'un match spécifique
- [x] `GET /api/matches/with-odds` - Matchs avec leurs cotes

### Fonctionnalités
- [x] Client HTTP The Odds API avec cache (2h TTL)
- [x] Mapping compétitions TheSportsDB <-> The Odds API
- [x] Matching intelligent des matchs (date + noms d'équipes normalisés)
- [x] Calcul des cotes moyennes (tous bookmakers)
- [x] Stockage en BDD (`MatchOdds`)
- [x] Colonnes `oddsHomeTeam` / `oddsAwayTeam` (noms équipes selon The Odds API)
- [x] CRON job: sync cotes (2x/jour à 9h et 18h)

### Compétitions supportées (mapping)
| The Odds API | Competition | TheSportsDB ID |
|--------------|-------------|----------------|
| `soccer_epl` | Premier League (England) | 4328 |
| `soccer_france_ligue_one` | Ligue 1 (France) | 4334 |
| `soccer_germany_bundesliga` | Bundesliga (Germany) | 4331 |
| `soccer_italy_serie_a` | Serie A (Italy) | 4332 |
| `soccer_spain_la_liga` | La Liga (Spain) | 4335 |

### Variables d'environnement
```env
THE_ODDS_API_KEY=your_api_key_here
```

**Modèle Prisma:** ✅ Existe (`MatchOdds`)

---

## 7c. Cleanup - Nettoyage des données (`/api/cleanup`) ✅ IMPLÉMENTÉ

> **Objectif:** Maintenir une base de données propre et performante
> **Mode:** Safe (conserve l'historique des paris)
> **CRON:** 1x/jour à 02:00

### Endpoints
- [x] `GET /api/cleanup/stats` - Statistiques avant nettoyage
- [x] `POST /api/cleanup/run` - Exécuter le nettoyage complet
- [x] `POST /api/cleanup/match-odds` - Nettoyer uniquement les cotes
- [x] `POST /api/cleanup/matches` - Nettoyer uniquement les matchs

### Fonctionnalités (mode safe)
- [x] Suppression des `MatchOdds` des matchs terminés/annulés/reportés
- [x] Suppression des `Match` terminés **SANS** paris ni challenges
- [x] Suppression des `SyncLog` de plus de 30 jours
- [x] Suppression des tokens expirés/révoqués (RefreshToken, PasswordResetToken)
- [x] Conservation des matchs avec historique de paris (statistiques utilisateurs)
- [x] CRON job automatique à 02:00 (avant les syncs)

### Ce qui est conservé
| Donnée | Conservée | Raison |
|--------|-----------|--------|
| Matchs avec paris | ✅ Oui | Historique et statistiques |
| Matchs avec challenges | ✅ Oui | Historique et statistiques |
| Matchs sans paris (terminés) | ❌ Non | Inutile |
| Cotes des matchs terminés | ❌ Non | Inutile après le match |

**Service:** `src/services/cleanup/cleanup.service.ts`

---

## 8. Ligues (`/api/leagues`) ✅ IMPLÉMENTÉ

### Endpoints
- [x] `POST /api/leagues` - Créer une ligue
- [x] `GET /api/leagues` - Lister ses ligues
- [x] `GET /api/leagues/:id` - Détails d'une ligue
- [x] `PATCH /api/leagues/:id` - Modifier une ligue
- [x] `DELETE /api/leagues/:id` - Supprimer une ligue (soft delete)
- [x] `POST /api/leagues/:id/regenerate-code` - Régénérer le code d'invitation

### Membres
- [x] `POST /api/leagues/:id/join` - Rejoindre via code d'invitation
- [x] `POST /api/leagues/:id/leave` - Quitter une ligue
- [x] `GET /api/leagues/:id/members` - Liste des membres (pagination, tri)
- [x] `PATCH /api/leagues/:id/members/:userId` - Modifier rôle d'un membre
- [x] `DELETE /api/leagues/:id/members/:userId` - Exclure un membre

### Classement & Stats
- [x] `GET /api/leagues/:id/leaderboard` - Classement de la ligue
- [x] `GET /api/leagues/:id/stats` - Statistiques de la ligue
- [x] `GET /api/leagues/:id/history` - Historique des paris de la ligue

### Fonctionnalités
- [x] Génération code d'invitation unique (8 caractères)
- [x] Rôles: owner, admin, member
- [x] Ligues privées/publiques
- [x] Limite de membres par plan (Free: 4, Champion: 10, MVP: 30)
- [x] Création automatique de la cagnotte à la création de ligue
- [x] Vérification du gel de ligue lors de l'adhésion
- [ ] Notifications d'invitation
- [ ] Transfert de propriété

**Modèle Prisma:** ✅ Existe (`League`, `LeagueMember`)

---

## 9. Paris (`/api/bets`) ✅ IMPLÉMENTÉ (Partie 1)

### Endpoints Paris Utilisateur
- [x] `GET /api/bets` - Lister ses paris (pagination, filtres)
- [x] `GET /api/bets/:id` - Détails d'un pari
- [x] `GET /api/bets/history` - Historique des paris avec stats
- [x] `GET /api/bets/weekly-limit` - Limite hebdomadaire (Free: 3/semaine)

### Challenges (Paris de groupe imposés)
- [x] `POST /api/leagues/:id/challenges` - Proposer un match (créer un challenge)
- [x] `GET /api/leagues/:id/challenges` - Lister les challenges (pagination, filtres)
- [x] `GET /api/leagues/:id/challenges/active` - Challenges actifs (ouverts)
- [x] `GET /api/leagues/:id/challenges/:challengeId` - Détails d'un challenge
- [x] `POST /api/leagues/:id/challenges/:challengeId/bets` - Placer un pari sur un challenge
- [x] `GET /api/leagues/:id/challenges/:challengeId/bets` - Paris d'un challenge
- [x] `GET /api/leagues/:id/available-matches` - Matchs disponibles pour créer un challenge

### Compétition de la Ligue
- [x] `GET /api/leagues/:id/competition` - Compétition actuelle de la ligue
- [x] `PATCH /api/leagues/:id/competition` - Changer de compétition (Free: 1x/semaine)

### Règles métier implémentées
- [x] **J-7**: Paris possibles 7 jours avant le match
- [x] **M-10**: Fin des paris 10 minutes avant le début
- [x] **Immutabilité**: Paris non modifiables/annulables après validation
- [x] **Limites selon plan**: Free (1 changement/semaine), Champion/MVP (illimité)
- [x] **Gel de ligue**: Impossible de changer de compétition si ligue gelée
- [x] Validation: membre de la ligue requis
- [x] Validation: match dans la compétition de la ligue
- [x] Validation: un seul pari par challenge par utilisateur
- [x] Validation: solde de points suffisant
- [x] Déduction automatique des points à la création du pari

### À faire (Partie 2 - Cotes & Résolution)
- [x] Intégration The Odds API pour récupérer les cotes
- [x] Service de matching matchs TheSportsDB <-> The Odds API
- [x] Modèle `MatchOdds` pour stocker les cotes moyennes
- [x] Endpoints API pour récupérer les cotes (`GET /api/matches/:id/odds`, `GET /api/matches/with-odds`)
- [x] Endpoint de sync manuelle (`POST /api/sync/odds`)
- [ ] Calcul automatique des gains potentiels (cotes)
- [ ] Résolution automatique des paris (quand match terminé)
- [ ] Mise à jour des points utilisateur après résolution
- [ ] CRON: fermeture automatique des challenges (M-10)
- [ ] CRON: résolution des paris (match terminé)
- [x] CRON: sync des cotes (2x/jour à 9h et 18h) - **The Odds API (500 req/mois)**

**Modèle Prisma:** ✅ Existe (`Bet`, `GroupBet`, `MatchOdds`)

---

## 10. Notifications ❌ À IMPLÉMENTER

### Endpoints
- [ ] `GET /api/notifications` - Liste des notifications
- [ ] `PATCH /api/notifications/:id/read` - Marquer comme lue
- [ ] `PATCH /api/notifications/read-all` - Tout marquer comme lu
- [ ] `DELETE /api/notifications/:id` - Supprimer une notification

### Fonctionnalités
- [ ] Push notifications (Firebase/OneSignal)
- [ ] Notifications in-app
- [ ] Email notifications
- [ ] Préférences de notification par utilisateur
- [ ] Types: nouveau membre, pari gagné/perdu, match commencé, etc.

**Modèle Prisma:** ❌ À créer

---

## 11. Statistiques & Analytics ❌ À IMPLÉMENTER

### Endpoints
- [ ] `GET /api/stats/global` - Statistiques globales
- [ ] `GET /api/stats/user/:id` - Statistiques utilisateur
- [ ] `GET /api/stats/league/:id` - Statistiques ligue

### Fonctionnalités
- [ ] Nombre total de paris
- [ ] Taux de réussite
- [ ] Points gagnés/perdus
- [ ] Série de victoires/défaites
- [ ] Meilleurs parieurs

---

## 12. Administration ❌ À IMPLÉMENTER

### Endpoints
- [ ] `GET /api/admin/users` - Gestion des utilisateurs
- [ ] `PATCH /api/admin/users/:id` - Modifier un utilisateur
- [ ] `DELETE /api/admin/users/:id` - Supprimer définitivement
- [ ] `GET /api/admin/leagues` - Gestion des ligues
- [ ] `GET /api/admin/bets` - Gestion des paris
- [ ] `POST /api/admin/sync/force` - Forcer une synchronisation

### Fonctionnalités
- [ ] Rôle admin dans User
- [ ] Dashboard admin
- [ ] Logs d'audit
- [ ] Bannissement utilisateurs

---

## 13. Abonnements & Cagnotte (`/api/plans`, `/api/leagues/:id/wallet`) ✅ IMPLÉMENTÉ

> Système d'abonnement par ligue avec cagnotte partagée (modèle Famileo)

### Plans (`/api/plans`)
- [x] `GET /api/plans` - Liste des plans disponibles (Free, Champion, MVP)
- [x] `GET /api/plans/:id` - Détails d'un plan

### Plans disponibles
| Plan | Prix/mois | Membres | Compétitions | Changements/semaine |
|------|-----------|---------|--------------|---------------------|
| Free | 0€ | 4 | 1 | 1 |
| Champion | 5.99€ | 10 | Illimité | Illimité |
| MVP | 11.99€ | 30 | Illimité | Illimité |

### Cagnotte Ligue (`/api/leagues/:id/wallet`)
- [x] `GET /api/leagues/:id/wallet` - Détails de la cagnotte (solde, mois couverts, historique)
- [x] `POST /api/leagues/:id/wallet/contribute` - Contribuer à la cagnotte
- [x] `GET /api/leagues/:id/wallet/history` - Historique complet des contributions

### Gestion abonnement ligue
- [x] `POST /api/leagues/:id/upgrade` - Passer à un plan supérieur
- [x] `POST /api/leagues/:id/downgrade` - Revenir à un plan inférieur

### Fonctionnalités
- [x] Plans: Free, Champion, MVP avec limites différentes
- [x] Limites par plan: maxMembers, maxCompetitions, maxChangesWeek
- [x] Cagnotte partagée par ligue (LeagueWallet)
- [x] Contributions des membres (Contribution)
- [x] Calcul automatique des mois couverts (solde / prix mensuel)
- [x] Date de prochain prélèvement (nextPaymentDate)
- [x] Historique des contributions avec user, montant, date
- [x] CRON: prélèvement mensuel automatique sur la cagnotte (1x/jour à 01:00)
- [x] Gel automatique si solde insuffisant et >4 membres
- [x] Downgrade automatique vers Free si solde insuffisant et ≤4 membres
- [ ] Intégration Stripe pour paiements (TODO - actuellement mock)
- [ ] Webhooks Stripe pour confirmation de paiement (TODO)
- [ ] Notifications solde insuffisant (TODO)

### Règles métier
- **Contributions**: Tous les membres peuvent contribuer à la cagnotte
- **Downgrade auto**: Si solde insuffisant et ≤4 membres → passage automatique à Free
- **Gel**: Si solde insuffisant et >4 membres → ligue gelée (pas de nouveaux membres, pas de changement de compétition)
- **Paiement**: Mock pour l'instant (TODO: Stripe)

**Modèle Prisma:** ✅ Existe (`Plan`, `LeagueWallet`, `Contribution`)

---

## Résumé de progression

| Module | Progression | Priorite |
|--------|-------------|----------|
| Infrastructure | 70% | - |
| Authentification | 85% | - |
| Utilisateurs | 80% | - |
| Competitions | 90% | - |
| **Equipes** | **100%** | Termine |
| Matchs | 80% | - |
| **Synchronisation TheSportsDB** | **95%** | CRONs actifs |
| **Sync The Odds API (Cotes)** | **100%** | Termine |
| **Cleanup** | **100%** | Termine |
| **Ligues** | **95%** | Termine |
| **Paris** | **80%** | En cours |
| **Abonnements & Cagnotte** | **90%** | Termine (mock payment) |
| Notifications | 0% | Moyenne |
| Statistiques | 0% | Basse |
| Administration | 0% | Basse |
| **Audit Securite** | **100%** | URGENT - 3 critiques, 5 hautes |

---

## Prochaines étapes recommandées

1. ~~**Implémenter les Ligues** - Core feature pour l'aspect social~~ ✅
2. ~~**Implémenter les Paris (Partie 1)** - Challenges et paris de groupe~~ ✅
3. ~~**Ajouter les CRON Jobs de sync** - TheSportsDB + The Odds API~~ ✅
4. ~~**Implémenter Abonnements & Cagnotte** - Monétisation (modèle Famileo)~~ ✅
5. **Implémenter les Paris (Partie 2)** - Résolution automatique des paris
6. **CRON: fermeture challenges + résolution paris** - Automatisation métier
7. **Intégration Stripe** - Paiements réels (remplacer mock)
8. **WebSocket pour live scores** - Expérience temps réel
9. **Notifications** - Engagement utilisateur

---

## Notes de développement

### Convention API
- Toutes les routes commencent par `/api`
- Format de réponse: `{ data, message?, error?, pagination? }`
- Codes HTTP: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)

### Stack technique
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js 5.x
- **ORM:** Prisma 7.x
- **Database:** PostgreSQL
- **Auth:** JWT (jsonwebtoken)
- **CRON:** node-cron v4.x
- **APIs externes:**
  - TheSportsDB V2 (matchs, équipes, compétitions)
  - The Odds API (cotes des paris)

### CRON Jobs actifs (Timezone: Europe/Paris)

| Tâche | Expression | Horaire | Service |
|-------|------------|---------|---------|
| **Paiements Cagnotte** | `0 1 * * *` | 01:00 | `walletService.processAllDuePayments()` |
| **Cleanup** | `0 2 * * *` | 02:00 | `cleanupService.runFullCleanup()` |
| Sync Compétitions | `0 3 * * *` | 03:00 | `competitionsService.syncAllCompetitions()` |
| Sync Équipes | `0 4 * * *` | 04:00 | `teamsService.syncAllTeams()` |
| Sync Matchs | `0 */6 * * *` | 00:00, 06:00, 12:00, 18:00 | `matchesService.syncAllMatches()` |
| Sync Cotes | `0 9,18 * * *` | 09:00, 18:00 | `oddsService.syncAllOdds()` |

**Fichier:** `src/services/cron/index.ts`
**Logs:** Table `sync_logs` (type: `cron-*`)

---

## 14. Audit de Securite

> **Date de l'audit:** 2026-01-26
> **Auditeur:** Claude Opus 4.5
> **Perimetre:** API Backend (apps/api)

### Resume Executif

| Categorie | Critique | Haute | Moyenne | Basse |
|-----------|----------|-------|---------|-------|
| Vulnerabilites | 3 | 5 | 6 | 4 |

---

### VULNERABILITES CRITIQUES

#### 1. Routes de Synchronisation Non Protegees
**Fichier:** `src/routes/sync.ts:17-341`
**Severite:** CRITIQUE

```typescript
// AUCUNE AUTHENTIFICATION sur ces routes !
router.post('/competitions', async (req: Request, res: Response) => { ... });
router.post('/all', async (req: Request, res: Response) => { ... });
```

**Impact:**
- Declenchement de synchronisations massives (DoS)
- Epuisement des quotas d'API externes (The Odds API: 500 req/mois)
- Surcharge de la base de donnees

**Recommandation:** Ajouter `requireAuth` et une verification de role admin.

**Status:** [ ] A corriger

---

#### 2. Configuration CORS Permissive
**Fichier:** `src/index.ts:38`
**Severite:** CRITIQUE

```typescript
app.use(cors()); // Permet TOUTES les origines !
```

**Impact:**
- Permet les attaques CSRF
- Exposition a des requetes cross-origin malveillantes
- Vol de session/tokens par des sites tiers

**Recommandation:**
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
```

**Status:** [ ] A corriger

---

#### 3. Absence de Rate Limiting
**Fichier:** `src/index.ts` (absent)
**Severite:** CRITIQUE

**Impact:**
- Attaques par force brute sur `/api/auth/login`
- Credential stuffing
- Enumeration de comptes via `/api/auth/forgot-password`
- DoS applicatif

**Recommandation:**
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives
  message: 'Too many login attempts'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

**Status:** [ ] A corriger

---

### VULNERABILITES HAUTES

#### 4. Politique de Mot de Passe Faible
**Fichier:** `src/routes/auth.ts:421-423`
**Severite:** HAUTE

```typescript
if (newPassword.length < 6) {
  return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
}
```

**Impact:** Mots de passe triviaux facilement crackables.

**Recommandation:** Minimum 8 caracteres, exiger majuscule + chiffre + caractere special.

**Status:** [ ] A corriger

---

#### 5. JWT Secret Non Valide
**Fichier:** `src/routes/auth.ts:35`, `src/middleware/auth.ts:41`
**Severite:** HAUTE

```typescript
jwt.verify(token, process.env.JWT_SECRET!) // Le "!" crashe si undefined
```

**Impact:**
- Crash de l'application si `JWT_SECRET` non defini
- Pas de validation de la robustesse du secret

**Recommandation:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}
```

**Status:** [ ] A corriger

---

#### 6. Absence d'En-tetes de Securite (Helmet)
**Fichier:** `src/index.ts` (absent)
**Severite:** HAUTE

**Impact:** Vulnerable a :
- XSS via injection de scripts
- Clickjacking
- MIME sniffing

**Recommandation:**
```typescript
import helmet from 'helmet';
app.use(helmet());
```

**Status:** [ ] A corriger

---

#### 7. Absence de Validation d'Input
**Fichier:** Toutes les routes
**Severite:** HAUTE

Aucune bibliotheque de validation (Zod, Joi, express-validator) n'est utilisee.

**Exemple problematique** (`src/routes/users.ts:96-101`):
```typescript
if (search) {
  whereClause.OR = [
    { username: { contains: search, mode: 'insensitive' } }, // Pas de sanitization
```

**Recommandation:** Utiliser Zod pour valider toutes les entrees.

**Status:** [ ] A corriger

---

#### 8. Fuite d'Information Sensible dans les Logs
**Fichier:** `src/routes/auth.ts:395-400`
**Severite:** HAUTE

```typescript
console.log('PASSWORD RESET REQUESTED');
console.log(`User: ${user.email}`);
console.log(`Reset URL: ${resetUrl}`);  // Token de reset en clair !
```

**Impact:** Si les logs sont compromis, tokens de reset accessibles.

**Recommandation:** Ne jamais logger de tokens ou URLs sensibles, meme en developpement.

**Status:** [ ] A corriger

---

### VULNERABILITES MOYENNES

#### 9. Journalisation d'Adresses IP (RGPD)
**Fichier:** `src/index.ts:45`
**Severite:** MOYENNE

```typescript
console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
```

**Impact:** Non-conformite RGPD potentielle si pas de consentement.

**Status:** [ ] A corriger

---

#### 10. Enumeration de Champs a l'Inscription
**Fichier:** `src/routes/auth.ts:108-112`
**Severite:** MOYENNE

```typescript
if (existingUser) {
  const field = existingUser.email === email ? 'Email' : "Username";
  return res.status(409).json({
    error: `${field} is already used by another account.`,
  });
}
```

**Impact:** Permet de determiner si un email/username existe deja.

**Recommandation:** Message generique : "Email or username already in use."

**Status:** [ ] A corriger

---

#### 11. Code d'Invitation Previsible
**Fichier:** `src/routes/league.ts:39-41`
**Severite:** MOYENNE

```typescript
const generateInviteCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 caracteres hex
};
```

**Impact:** Seulement 4 milliards de combinaisons possibles. Brute-forceable avec rate limiting absent.

**Recommandation:** Augmenter a `crypto.randomBytes(16)` (32 caracteres).

**Status:** [ ] A corriger

---

#### 12. Absence de Controle sur les Routes de Cleanup
**Fichier:** `src/routes/cleanup.ts`
**Severite:** MOYENNE

Les routes `/api/cleanup` sont probablement non protegees comme les routes `/api/sync`.

**Status:** [ ] A verifier et corriger

---

#### 13. Token Refresh Sans Limite de Rotation
**Fichier:** `src/routes/auth.ts:281-338`
**Severite:** MOYENNE

Pas de limite sur le nombre de refresh tokens generes. Un attaquant avec un refresh token valide peut generer des tokens indefiniment.

**Status:** [ ] A corriger

---

#### 14. Pas de Verification de Version JWT
**Fichier:** `src/middleware/auth.ts`
**Severite:** MOYENNE

Aucun mecanisme pour invalider tous les JWT existants (ex: apres changement de mot de passe). Le refresh token est revoque mais les access tokens existants restent valides 15 minutes.

**Status:** [ ] A evaluer

---

### VULNERABILITES BASSES

#### 15. `.env.example` avec Valeurs par Defaut Faibles
**Fichier:** `.env.example:8`

```bash
JWT_SECRET=your-secret-key-change-this
```

Risque de copie en production.

**Status:** [ ] A corriger

---

#### 16. Absence de Logs Structures
Les `console.log` ne sont pas adaptes a la production (pas de niveaux, pas de formatage JSON).

**Status:** [ ] A implementer (Winston/Pino)

---

#### 17. Pas de Timeout sur les Requetes Prisma
Les requetes DB n'ont pas de timeout configure.

**Status:** [ ] A evaluer

---

#### 18. Soft Delete Incomplet
Les utilisateurs desactives (`isActive: false`) conservent leurs donnees. Pas de mecanisme de purge RGPD.

**Status:** [ ] A implementer

---

### POINTS POSITIFS

| Aspect | Implementation |
|--------|----------------|
| Hachage Mot de Passe | bcryptjs avec 10 rounds |
| Refresh Token Rotation | Implemente |
| Token Hashing en DB | SHA-256 |
| Protection SQL Injection | Prisma parametre |
| Separation Access/Refresh Tokens | JWT 15min + Refresh 7j |
| Revocation Tokens apres Reset Password | Implemente |
| Protection contre Enumeration (forgot-password) | Message generique |
| Middleware `requireSelf` | Protege les ressources utilisateur |

---

### RECOMMANDATIONS PRIORITAIRES

1. **URGENT:** Ajouter authentification sur `/api/sync/*` et `/api/cleanup/*`
2. **URGENT:** Configurer CORS avec origines specifiques
3. **URGENT:** Implementer rate limiting sur auth endpoints
4. **HAUTE:** Installer et configurer Helmet
5. **HAUTE:** Implementer validation Zod/Joi sur toutes les routes
6. **HAUTE:** Renforcer la politique de mots de passe
7. **MOYENNE:** Ajouter validation JWT_SECRET au demarrage
8. **MOYENNE:** Supprimer les logs sensibles

---

### DEPENDANCES DE SECURITE RECOMMANDEES

```json
{
  "dependencies": {
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "zod": "^3.22.0"
  }
}
```

---

### CHECKLIST DE REMEDIATION

- [ ] Proteger `/api/sync/*` avec authentification admin
- [ ] Proteger `/api/cleanup/*` avec authentification admin
- [ ] Configurer CORS strictement
- [ ] Ajouter rate limiting (auth: 5 req/15min, global: 100 req/min)
- [ ] Installer et configurer Helmet
- [ ] Implementer validation Zod sur toutes les routes
- [ ] Renforcer politique mot de passe (8 chars, majuscule, chiffre, special)
- [ ] Valider JWT_SECRET au demarrage (min 32 chars)
- [ ] Supprimer logs sensibles (tokens, URLs de reset)
- [ ] Remplacer console.log par Winston/Pino
- [ ] Augmenter entropie code invitation (32 chars)
- [ ] Message generique a l'inscription
- [ ] Implementer purge RGPD des comptes supprimes

---

*Ce fichier est mis à jour au fur et à mesure du développement.*
