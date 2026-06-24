# 🔔 Notifications BetTeam — Catalogue complet

> **But du document :** recenser et catégoriser **toutes** les notifications à prévoir pour l'application, avant toute mise en place technique.
> **Périmètre :** dérivé de la logique métier réellement présente dans le code (`wallet.service.ts`, `bets.service.ts`, `league.ts`, `auth.ts`, `cron/index.ts`) + features planifiées (`checklistApi.md`, `README.md`).
> **Statut actuel :** aucune notification n'est implémentée (0%). Seule l'infra `node-cron` existe et est réutilisable.

---

## Légende

**Canaux**
- 📧 **Email** — transactionnel (reset password, alertes importantes)
- 📱 **Push** — mobile/web (Expo / FCM / OneSignal)
- 💬 **In-app** — centre de notifications + badge non-lu
- ⚡ **Temps réel** — WebSocket/SSE (live scores, classement)

**Déclenchement**
- 🟢 **Événementiel** — émis dans le flux HTTP (action utilisateur immédiate)
- ⏰ **Programmé** — émis par un CRON / tâche planifiée

**Destinataires**
- `USER` : l'utilisateur concerné
- `OWNER` : propriétaire de la ligue
- `ADMIN_LIGUE` : owner + admins de la ligue
- `MEMBRES` : tous les membres de la ligue
- `ADMIN_SYS` : administrateurs de la plateforme

**Priorité**
- 🔴 P1 (critique / débloque une feature cassée)
- 🟠 P2 (engagement fort / valeur métier)
- 🟡 P3 (confort / nice-to-have)

**Dépendances bloquantes** = feature non encore codée dont dépend la notification.

---

## 1. Compte & Authentification

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| A1 | Lien de réinitialisation du mot de passe | `POST /auth/forgot-password` | 📧 | 🟢 | USER | 🔴 | Service email (auj. `console.log`) |
| A2 | Vérification d'adresse email | inscription / `verify-email` | 📧 | 🟢 | USER | 🔴 | Endpoint `verify-email` (non codé) |
| A3 | Confirmation de changement de mot de passe | reset/changement effectué (révocation tokens) | 📧 | 🟢 | USER | 🟠 | Service email |
| A4 | Bienvenue après inscription | `POST /auth/register` | 📧 / 💬 | 🟢 | USER | 🟡 | Service email |
| A5 | Connexion depuis un nouvel appareil | login appareil inconnu | 📧 / 📱 | 🟢 | USER | 🟡 | Tracking appareils (non codé) |

---

## 2. Ligues & Membres

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| L1 | Invitation à rejoindre une ligue | partage du code d'invitation | 📧 / 📱 | 🟢 | invité | 🟠 | Flux d'invitation explicite |
| L2 | Nouveau membre a rejoint la ligue | `POST /leagues/:id/join` | 💬 / 📱 | 🟢 | ADMIN_LIGUE (+ MEMBRES) | 🟠 | — |
| L3 | Un membre a quitté la ligue | `POST /leagues/:id/leave` | 💬 | 🟢 | ADMIN_LIGUE | 🟡 | — |
| L4 | Vous avez été exclu de la ligue | `DELETE /leagues/:id/members/:userId` | 💬 / 📱 | 🟢 | USER exclu | 🟠 | — |
| L5 | Votre rôle a changé (admin/membre) | `PATCH /leagues/:id/members/:userId` | 💬 | 🟢 | USER concerné | 🟡 | — |
| L6 | Adhésion impossible : ligue gelée | tentative join sur ligue `isFrozen` | 💬 | 🟢 | invité (+ OWNER) | 🟡 | — |
| L7 | Code d'invitation régénéré | `POST /leagues/:id/regenerate-code` | 💬 | 🟢 | ADMIN_LIGUE | 🟡 | — |
| L8 | Ligue supprimée / désactivée | `DELETE /leagues/:id` (soft delete) | 💬 / 📱 | 🟢 | MEMBRES | 🟡 | — |

---

## 3. Paris & Challenges de groupe

> Moteur de paris piloté par les fenêtres **J-7** (ouverture) et **M-10** (fermeture, 10 min avant le match) — `bets.service.ts`.

### 3.1 Cycle de vie d'un challenge

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| B1 | Nouveau challenge créé dans la ligue | `POST /leagues/:id/challenges` | 📱 / 💬 | 🟢 | MEMBRES | 🟠 | — |
| B2 | Rappel : challenge ouvert, pas encore parié | fenêtre J-7 ouverte, pari absent | 📱 | ⏰ | MEMBRES sans pari | 🟠 | CRON de rappel |
| B3 | **Rappel fermeture imminente (M-10)** | `closesAt` = match −10 min | 📱 | ⏰ | MEMBRES sans pari | 🟠 | CRON de rappel |
| B4 | Challenge fermé (clôture M-10) | passage `open` → `closed` | 💬 | ⏰ | MEMBRES | 🟡 | **CRON fermeture auto (non codé)** |
| B5 | Challenge résolu (résultats disponibles) | passage `closed` → `settled` | 📱 / 💬 | ⏰ | parieurs | 🟠 | **Résolution auto (non codée)** |

### 3.2 Paris individuels

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| B6 | Pari confirmé / points débités | `POST .../challenges/:id/bets` | 💬 | 🟢 | USER | 🟡 | — |
| B7 | **Match commencé** | `Match.status` → `live` | 📱 | ⏰ | parieurs | 🟠 | — |
| B8 | **Pari gagné** 🎉 | résolution, `Bet.status` → `won` | 📱 / 💬 | ⏰ | USER | 🔴 | **Résolution auto (non codée)** |
| B9 | **Pari perdu** | résolution, `Bet.status` → `lost` | 📱 / 💬 | ⏰ | USER | 🟠 | **Résolution auto (non codée)** |
| B10 | Pari annulé / remboursé (void) | `Bet.status` → `void` (match annulé/reporté) | 📱 / 💬 | ⏰ | USER | 🟠 | Gestion void (non codée) |

### 3.3 Limites & blocages de pari

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| B11 | Limite hebdo de paris atteinte (Free : 3/sem) | `getWeeklyBetStatus` → `remaining <= 0` | 💬 | 🟢 | USER | 🟡 | — |
| B12 | Réinitialisation limite hebdo (lundi) | début de semaine | 💬 | ⏰ | USER | 🟡 | — |
| B13 | Solde de points insuffisant pour parier | validation solde au moment du pari | 💬 | 🟢 | USER | 🟡 | — |
| B14 | Pari impossible : ligue gelée | `bets.service.ts` check `isFrozen` | 💬 | 🟢 | USER | 🟠 | — |
| B15 | Pari impossible : hors fenêtre (avant J-7 / après M-10) | `isMatchBettable` | 💬 | 🟢 | USER | 🟡 | — |

### 3.4 Classement

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| B16 | Changement de classement de la ligue | recalcul leaderboard post-résolution | ⚡ / 💬 | ⏰ | MEMBRES | 🟡 | Résolution auto |
| B17 | Vous avez pris la 1ʳᵉ place / perdu votre place | recalcul leaderboard | 📱 / 💬 | ⏰ | USER | 🟡 | Résolution auto |

---

## 4. Cagnotte, Abonnement & Fonds insuffisants

> Modèle « à la Famileo » : **cagnotte partagée par ligue**, prélevée mensuellement (Free 0€ / Champion 5,99€ / MVP 11,99€). Prélèvement par **CRON quotidien à 01:00** (`processAllDuePayments`).
> ⚠️ Aujourd'hui ces événements ne produisent qu'un `console.log` — **personne n'est prévenu**.

### 4.1 Prélèvement mensuel (CRON 01:00)

| # | Notification | Déclencheur (condition exacte) | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| W1 | Prélèvement mensuel effectué | `balance >= monthlyPrice` → débit + nouvelle `nextPaymentDate` | 📧 / 💬 | ⏰ | ADMIN_LIGUE (+ contributeurs) | 🟠 | — |
| W2 | **Fonds insuffisants → ligue rétrogradée en Free** | `balance < prix` ET `membres <= 4` → downgrade auto | 📧 / 📱 / 💬 | ⏰ | MEMBRES | 🔴 | — |
| W3 | **Fonds insuffisants → ligue gelée** 🧊 | `balance < prix` ET `membres > 4` → `isFrozen=true` | 📧 / 📱 / 💬 | ⏰ | MEMBRES | 🔴 | — |

### 4.2 Alertes préventives (CRON — éviter le gel)

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| W4 | Plus qu'1 mois de cagnotte couvert | `monthsCovered` (`floor(balance/prix)`) == 1 | 📧 / 📱 | ⏰ | ADMIN_LIGUE | 🟠 | CRON d'alerte |
| W5 | Prélèvement dans 3 jours, solde insuffisant | `nextPaymentDate −3j` ET `balance < prix` | 📧 / 📱 | ⏰ | MEMBRES | 🔴 | CRON d'alerte |
| W6 | Cagnotte épuisée (solde = 0) | `balance == 0` sur plan payant | 📱 / 💬 | ⏰ | ADMIN_LIGUE | 🟠 | CRON d'alerte |

### 4.3 Mouvements de cagnotte (événementiel)

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| W7 | Nouvelle contribution reçue | `contribute()` | 💬 | 🟢 | ADMIN_LIGUE | 🟡 | — |
| W8 | Merci pour votre contribution | `contribute()` | 💬 | 🟢 | USER contributeur | 🟡 | — |
| W9 | **Ligue débloquée** (gel levé) | `contribute()` met `isFrozen=false` | 📱 / 💬 | 🟢 | MEMBRES | 🟠 | — |
| W10 | Appel à contribution (relance) | solde bas + plusieurs membres | 📱 | ⏰ | MEMBRES | 🟡 | CRON |

### 4.4 Changement de plan

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| W11 | Plan mis à niveau (upgrade) | `upgradePlan()` | 💬 | 🟢 | MEMBRES | 🟡 | — |
| W12 | Plan rétrogradé (downgrade manuel) | `downgradePlan()` | 💬 | 🟢 | MEMBRES | 🟡 | — |
| W13 | Upgrade refusé : solde/membres insuffisants | échec `upgradePlan` (balance ou maxMembers) | 💬 | 🟢 | OWNER | 🟡 | — |

### 4.5 Paiement réel (post-Stripe — actuellement mock)

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| W14 | Reçu de paiement / facture | webhook Stripe `payment_succeeded` | 📧 | 🟢 | USER contributeur | 🟠 | **Stripe (non intégré)** |
| W15 | Échec de paiement (carte refusée) | webhook Stripe `payment_failed` | 📧 / 📱 | 🟢 | USER contributeur | 🟠 | **Stripe (non intégré)** |

---

## 5. Données sportives & Matchs

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| S1 | Match reporté | `Match.status` → `postponed` (sync) | 📱 / 💬 | ⏰ | parieurs concernés | 🟠 | — |
| S2 | Match annulé | `Match.status` → `cancelled` (sync) | 📱 / 💬 | ⏰ | parieurs concernés | 🟠 | — |
| S3 | Score en direct (but, mi-temps…) | événement match live | ⚡ / 📱 | ⏰ | spectateurs | 🟡 | **WebSocket (non codé)** |
| S4 | Résultat final du match | `Match.status` → `finished` | 📱 / 💬 | ⏰ | parieurs | 🟠 | — |
| S5 | Rappel : match d'une équipe favorite | match à venir d'une `UserFavoriteTeam` | 📱 | ⏰ | USER | 🟡 | CRON |

---

## 6. Administration plateforme (système)

| # | Notification | Déclencheur | Canal | Décl. | Dest. | Prio | Dépendance |
|---|---|---|---|---|---|---|---|
| X1 | Échec d'un job CRON | `logCronExecution(..., 'error')` | 📧 | ⏰ | ADMIN_SYS | 🟠 | Alerting |
| X2 | Quota API externe proche/épuisé | The Odds API (500 req/mois) | 📧 | ⏰ | ADMIN_SYS | 🟠 | Suivi quota |
| X3 | Pic d'erreurs serveur / santé dégradée | monitoring `/api/health` | 📧 | ⏰ | ADMIN_SYS | 🟡 | Monitoring (non codé) |
| X4 | Nouveau signalement / modération | action modération | 💬 / 📧 | 🟢 | ADMIN_SYS | 🟡 | Modération (non codée) |

---

## 7. Préférences utilisateur (transversal)

Chaque utilisateur doit pouvoir configurer ses notifications (à prévoir dans le modèle de données) :

- Activation/désactivation **par canal** (📧 / 📱 / 💬).
- Activation/désactivation **par catégorie** (paris, cagnotte, ligue, sport…).
- Mode « ne pas déranger » (plage horaire).
- Fréquence des rappels (immédiat / digest quotidien).
- Désinscription email (lien obligatoire — conformité RGPD).

---

## 8. Synthèse par priorité

### 🔴 P1 — Critiques (à faire en premier)
- **A1** Reset password (feature aujourd'hui cassée — uniquement loggée en console)
- **A2** Vérification email
- **W2 / W3** Fonds insuffisants → downgrade auto / gel de ligue (logique métier déjà codée, seule l'émission manque)
- **W5** Alerte « prélèvement dans 3 jours, solde insuffisant »
- **B8** Pari gagné

### 🟠 P2 — Engagement fort
- Cycle de vie challenge & paris (B1, B3, B5, B7, B9)
- Cagnotte (W1, W4, W6, W9)
- Ligues (L1, L2, L4)
- Sport (S1, S2, S4)

### 🟡 P3 — Confort
- Limites, classement, favoris, mouvements de cagnotte mineurs, modération.

---

## 9. Dépendances bloquantes (ordre logique)

Certaines notifications n'ont rien à écouter tant que la feature sous-jacente n'existe pas :

| Dépendance non codée | Notifications bloquées |
|---|---|
| Service d'envoi d'email | A1, A2, A3, A4, W1, W14, W15, X1, X2 |
| Résolution automatique des paris | B5, B8, B9, B16, B17 |
| CRON fermeture des challenges (M-10) | B4 |
| Intégration Stripe (paiement = mock) | W14, W15 |
| WebSocket / temps réel | S3 (et versions live de B16) |
| Tracking appareils | A5 |

---

## 10. Récapitulatif des sources métier (traçabilité)

| Domaine | Fichier source |
|---|---|
| Cagnotte / prélèvement / gel / downgrade | `apps/api/src/services/wallet.service.ts` |
| Paris / J-7 / M-10 / limite hebdo / gel | `apps/api/src/services/bets.service.ts` |
| Ligues / membres / invitation | `apps/api/src/routes/league.ts` |
| Auth / reset password | `apps/api/src/routes/auth.ts` |
| Tâches planifiées | `apps/api/src/services/cron/index.ts` |
| Plans & limites | `apps/api/prisma/schema.prisma` (`Plan`, `League`, `LeagueWallet`) |
| Roadmap notifications | `apps/api/checklistApi.md` §10 & §13 |
