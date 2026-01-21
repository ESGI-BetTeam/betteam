# Checklist API BetTeam

> **Dernière mise à jour:** 2026-01-20
> **Version:** 1.1.0

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

### Sécurité
- [x] JWT Authentication
- [x] Hachage des mots de passe (bcrypt)
- [x] Validation des entrées utilisateur
- [ ] Rate limiting global
- [ ] Protection CSRF
- [ ] Helmet.js (headers de sécurité)

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

## 5. Équipes (`/api/teams`)

### Endpoints
- [x] Équipes via `/api/competitions/:id/teams`
- [ ] `GET /api/teams` - Liste de toutes les équipes
- [ ] `GET /api/teams/:id` - Détails d'une équipe
- [ ] `GET /api/teams/:id/matches` - Matchs d'une équipe
- [ ] `GET /api/teams/:id/players` - Joueurs d'une équipe

### Fonctionnalités
- [x] Sync depuis TheSportsDB
- [ ] Recherche d'équipes
- [ ] Statistiques équipe
- [ ] Favoris utilisateur (équipes suivies)

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
- [ ] CRON job: sync compétitions (1x/jour à 3h)
- [ ] CRON job: sync équipes (1x/jour à 4h)
- [ ] CRON job: sync matchs (toutes les 6h)
- [ ] Sync des joueurs
- [ ] Sync des classements (standings)
- [ ] Webhook pour notifications de mise à jour

---

## 8. Ligues (`/api/leagues`) ❌ À IMPLÉMENTER

### Endpoints
- [ ] `POST /api/leagues` - Créer une ligue
- [ ] `GET /api/leagues` - Lister ses ligues
- [ ] `GET /api/leagues/:id` - Détails d'une ligue
- [ ] `PATCH /api/leagues/:id` - Modifier une ligue
- [ ] `DELETE /api/leagues/:id` - Supprimer une ligue

### Membres
- [ ] `POST /api/leagues/:id/join` - Rejoindre via code d'invitation
- [ ] `POST /api/leagues/:id/leave` - Quitter une ligue
- [ ] `GET /api/leagues/:id/members` - Liste des membres
- [ ] `PATCH /api/leagues/:id/members/:userId` - Modifier rôle d'un membre
- [ ] `DELETE /api/leagues/:id/members/:userId` - Exclure un membre

### Classement & Stats
- [ ] `GET /api/leagues/:id/leaderboard` - Classement de la ligue
- [ ] `GET /api/leagues/:id/stats` - Statistiques de la ligue
- [ ] `GET /api/leagues/:id/history` - Historique des paris de la ligue

### Fonctionnalités
- [ ] Génération code d'invitation unique
- [ ] Rôles: owner, admin, member
- [ ] Ligues privées/publiques
- [ ] Limite de membres par ligue
- [ ] Notifications d'invitation

**Modèle Prisma:** ✅ Existe (`League`, `LeagueMember`)

---

## 9. Paris (`/api/bets`) ❌ À IMPLÉMENTER

### Endpoints
- [ ] `POST /api/bets` - Créer un pari
- [ ] `GET /api/bets` - Lister ses paris
- [ ] `GET /api/bets/:id` - Détails d'un pari
- [ ] `DELETE /api/bets/:id` - Annuler un pari (si pending)
- [ ] `GET /api/bets/history` - Historique des paris

### Par ligue
- [ ] `GET /api/leagues/:id/bets` - Paris d'une ligue
- [ ] `POST /api/leagues/:id/bets` - Parier dans une ligue

### Par match
- [ ] `GET /api/matches/:id/bets` - Paris sur un match
- [ ] `GET /api/matches/:id/odds` - Cotes du match (si disponible)

### Fonctionnalités
- [ ] Types de paris: winner, score, both_score, etc.
- [ ] Validation: match non commencé
- [ ] Validation: solde suffisant
- [ ] Calcul automatique des gains potentiels
- [ ] Résolution automatique des paris (quand match terminé)
- [ ] Mise à jour des points utilisateur
- [ ] Historique des transactions de points
- [ ] Statistiques de paris (taux de réussite, etc.)

**Modèle Prisma:** ✅ Existe (`Bet`)

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

## Résumé de progression

| Module | Progression | Priorité |
|--------|-------------|----------|
| Infrastructure | 70% | - |
| Authentification | 85% | - |
| Utilisateurs | 80% | - |
| Compétitions | 90% | - |
| Équipes | 30% | Basse |
| Matchs | 80% | - |
| Synchronisation | 70% | Moyenne |
| **Ligues** | **0%** | **HAUTE** |
| **Paris** | **0%** | **HAUTE** |
| Notifications | 0% | Moyenne |
| Statistiques | 0% | Basse |
| Administration | 0% | Basse |

---

## Prochaines étapes recommandées

1. **Implémenter les Ligues** - Core feature pour l'aspect social
2. **Implémenter les Paris** - Fonctionnalité principale de l'app
3. **Ajouter les CRON Jobs** - Automatisation de la sync
4. **WebSocket pour live scores** - Expérience temps réel
5. **Notifications** - Engagement utilisateur

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
- **API externe:** TheSportsDB V2

---

*Ce fichier est mis à jour au fur et à mesure du développement.*
