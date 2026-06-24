# 🎬 BetTeam — Scénario de démonstration (projet annuel)

> **But :** faire vivre au jury **la boucle complète** de l'app, en conditions réelles, sur **leurs propres téléphones** + ceux des 4 membres du groupe.
> **Effet recherché :** "ils sont allés jusqu'à publier l'app sur l'App Store et tout fonctionne en live".
> **Format :** flow social multi-téléphones, piloté en coulisse par un **mode admin**.

---

## 1. Le scénario sur scène (script)

| Étape | Acteur | Action | Effet visé |
|---|---|---|---|
| 1 | Juré | Crée un compte → **reçoit l'email de validation** → clique le lien | "C'est un vrai produit, pas une maquette" |
| 2 | Juré | Rejoint **notre groupe** via **lien d'invitation ou code** | Onboarding social fluide |
| 3 | Présentateur (admin) | Crée un **"faux match"** (équipes + heure proche) | Contrôle total du timing |
| 4 | Tous (jurés + 4 membres) | **Parient** sur le match (vainqueur + score exact + mise) | Engagement collectif, écrans qui se remplissent |
| 5 | Téléphones | **Notification : "Un joueur a lancé un pari"** | Les téléphones bipent → effet "ça vit" |
| 6 | Présentateur (admin) | **Saisit le résultat** du match + déclenche le **règlement** | La magie : on ne dépend pas d'un vrai match |
| 7 | Téléphones | **Notification : "Match terminé — pari gagné/perdu 🎉"** | Pic émotionnel, ça bipe partout |
| 8 | Tous | Voient **le classement bouger** (flèches ▲ vert / ▼ rouge) + leurs gains | Boucle bouclée, compétition visible |

**Durée cible : 4-5 minutes.** Tout le monde sur le même match, en même temps.

---

## 2. Ce qui existe déjà ✅ (pas à refaire)

- **Auth** : inscription / connexion (email + mot de passe).
- **Ligues** : création, **code d'invitation + partage** (`ShareLeagueSheet`), rejoindre par code.
- **Classement** : podium + tableau, **ups/downs ▲▼** (previousRank au règlement).
- **Pronostics** : challenge sur un match, **pari vainqueur + score exact + mise**, **édition jusqu'au coup d'envoi**, statut "en cours".
- **Règlement** : `settlementService.settleFinishedMatches()` (gains, score exact ×5, void/remboursement).
- **Solde par groupe** + recharge de points (gratuite).
- **Données réelles** : matchs & cotes via The Odds API.

➡️ **Le cœur fonctionnel est là.** Le scénario demande surtout de l'**outillage de démo** + les **notifications**.

---

## 3. Ce qu'il faut construire 🔧 (prérequis par étape)

### 🔴 P1 — Bloquants du scénario

| Réf | Prérequis | Pour l'étape | État actuel | Effort |
|---|---|---|---|---|
| D1 | **Mode admin : créer un "faux match"** (équipes, heure proche) | 3 | ❌ les matchs viennent de l'API | Faible |
| D2 | **Mode admin : saisir le résultat + force-settle** | 6 | ⚙️ `settleFinishedMatches()` existe, pas de déclencheur | Faible |
| D3 | **Vrai envoi d'email** (Resend / SendGrid / SES) | 1 | ❌ `emailService` = mock `console.log` | Moyen |
| D4 | **Endpoint `verify-email` + écran de validation** | 1 | ❌ non codé | Moyen |
| D5 | **Push notifications (Expo)** : token device + envoi | 5, 7 | ❌ rien (branche `dev_notifs` = backend in-app only) | **Élevé** |

### 🟠 P2 — Rendent la démo "finie"

| Réf | Prérequis | État | Effort |
|---|---|---|---|
| D6 | **Centre de notifs in-app + badge** (backend `dev_notifs` écrit déjà les lignes) | ❌ UI mobile à faire | Moyen |
| D7 | **Merger `dev_notifs` → `dev`** (infra notifs + hooks) | branche à jour, non mergée | Faible |
| D8 | **Animation de victoire** (confetti/haptique au gain, `react-native-skia` dispo) | ❌ | Faible-moyen |
| D9 | **Supprimer mon compte** (obligatoire App Store, backend OK) | UI mobile manquante | Faible |
| D10 | **Build EAS + TestFlight** (montrer l'app installable) | ❌ pas de `eas.json` | Moyen |

---

## 4. Ordre de construction conseillé

1. **D1 + D2** — mode démo (faux match + force-settle). *Sans ça, pas de démo.*
2. **D7** — merger `dev_notifs` (débloque l'infra notifs).
3. **D5 + D6** — push Expo + centre de notifs (l'effet "ça bipe sur tous les tels").
4. **D3 + D4** — email réel + validation de compte.
5. **D8** — animation de gain (le pic émotionnel).
6. **D10 + D9** — TestFlight + suppression de compte (pour "c'est sur le store").

---

## 5. Risques & plans B (à cause d'une démo LIVE)

| Risque | Conséquence | Plan B |
|---|---|---|
| **Quota The Odds API épuisé** (500 req/mois) en plein jury | Plus de matchs/cotes | Le **faux match (D1)** ne dépend pas de l'API → démo autonome. Prévoir un **seed** de secours. |
| **Email non reçu** (spam, wifi, délai) | Étape 1 bloquée devant le jury | **Auto-vérification en mode démo** (flag `DEMO_MODE` qui valide le compte sans email), ou pré-créer les comptes jurés. |
| **Push non reçu** (simulateur iOS ne reçoit pas le push, mauvais token) | Étapes 5/7 ratées | Tester sur **device physique** la veille ; fallback = **notif in-app (D6)** qui s'affiche au refresh. |
| **Wifi du site instable** | Tout le flow réseau | Partage de connexion 4G dédié + tester sur place avant. |
| **Lien d'invitation cliquable (deep link)** non configuré | Étape 2 | Le **code d'invitation** marche déjà → fallback fiable. |

---

## 6. Répartition des rôles (jour J)

- **Présentateur / admin** : pilote le mode démo (crée le match, saisit le résultat), raconte l'histoire.
- **Membre 1** : assiste les jurés pour créer un compte / rejoindre le groupe.
- **Membre 2** : montre son écran (pari, gain, classement) en gros plan / vidéoproj.
- **Membre 3** : gère le réseau (4G), garde un device de secours avec un compte déjà prêt.

---

## 7. Décisions produit assumées (à dire au jury — ça fait mûr)

- **App full gratuit** au lancement (pas de Stripe sur iOS sans IAP → choix MVP, monétisation en roadmap).
- **Pas de live score** minute par minute (coût quota API) — uniquement le statut "en cours".
- **Catalogue de notifs** réduit à l'essentiel pour la démo (pari lancé, match terminé) — le reste est documenté dans `NOTIFICATIONS.md`.

---

## 8. Définition de "prêt pour la démo" (checklist)

- [ ] Mode admin : créer un faux match (D1)
- [ ] Mode admin : saisir résultat + force-settle (D2)
- [ ] `dev_notifs` mergé (D7)
- [ ] Push reçu sur device physique : "pari lancé" + "match terminé" (D5)
- [ ] Centre de notifs in-app visible (D6)
- [ ] Email de validation reçu OU `DEMO_MODE` d'auto-validation (D3/D4)
- [ ] Animation de gain (D8)
- [ ] App installée via TestFlight sur 2-3 téléphones (D10)
- [ ] Répétition complète du flow la veille, sur le réseau du site
