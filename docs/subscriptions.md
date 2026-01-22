# BetTeam - Offre d'Abonnement

## Modèle Économique

| Aspect | Détail |
|--------|--------|
| **Type** | Abonnement par **LIGUE** (pas par utilisateur) |
| **Pot commun** | Contributions transparentes des membres |
| **Facturation** | Mensuelle ou Annuelle (-20%, 2 mois offerts) |
| **Cible** | B2C - Groupes d'amis |

---

## Les 3 Plans

### 🥉 Rookie (Gratuit)

| Feature | Détail |
|---------|--------|
| **Prix** | 0€ |
| **Membres max** | 4 |
| **Compétitions** | 1 compétition dans 1 sport |
| **Changement compétition** | 1x par semaine |
| **Types de paris** | Vainqueur uniquement |
| **Historique** | 30 jours |
| **Stats** | Basiques |
| **Badges/Trophées** | ✅ |
| **Config points départ** | ✅ |

**Limite utilisateur** : Max 2-3 ligues Rookie par compte

---

### 🥈 Champion (5,99€/mois)

| Feature | Détail |
|---------|--------|
| **Prix mensuel** | 5,99€ |
| **Prix annuel** | ~59€/an (-20%) |
| **Membres max** | 10 |
| **Compétitions** | Toutes les compétitions, tous les sports |
| **Changement compétition** | Illimité |
| **Types de paris** | Tous (vainqueur, score exact, les deux équipes marquent) |
| **Historique** | 6 mois |
| **Stats** | Basiques |
| **Badges/Trophées** | ✅ |
| **Config points départ** | ✅ |

---

### 🏆 MVP (11,99€/mois)

| Feature | Détail |
|---------|--------|
| **Prix mensuel** | 11,99€ |
| **Prix annuel** | ~120€/an (-20%) |
| **Membres max** | 30 |
| **Compétitions** | Toutes + custom events (matchs hors API) |
| **Changement compétition** | Illimité |
| **Types de paris** | Tous + paris personnalisés |
| **Historique** | Illimité |
| **Stats** | Avancées |
| **Badges/Trophées** | ✅ |
| **Config points départ** | ✅ |

---

## Pot Commun (League Wallet)

### Fonctionnement

- **Transparence totale** : Tous les membres voient qui a payé, combien et quand
- **Compteur** : Affichage du nombre de mois couverts par le solde actuel
- **Date de prélèvement** : Visible pour tous les membres
- **Gestionnaire** : Admin de la ligue (peut gérer le wallet)

### Contributions

- **Contribution minimum** : Égale au prix de l'abonnement choisi
  - Champion : minimum 5,99€ par contribution
  - MVP : minimum 11,99€ par contribution
- **Contribution libre** : Chaque membre contribue ce qu'il veut (au-dessus du minimum)
- **Objectif** : La somme totale doit couvrir l'abonnement mensuel

### Affichage Wallet

```
┌─────────────────────────────────────────┐
│  💰 Cagnotte de la ligue               │
├─────────────────────────────────────────┤
│  Solde actuel : 24,95€                 │
│  Mois couverts : 5 mois                │
│  Prochain prélèvement : 15 février     │
│  Plan actuel : Champion                │
├─────────────────────────────────────────┤
│  📜 Historique des contributions       │
│  • Alice - 4,99€ - 12 jan 2025        │
│  • Bob - 9,98€ - 10 jan 2025          │
│  • Charlie - 4,99€ - 8 jan 2025       │
│  • Alice - 4,99€ - 5 jan 2025         │
└─────────────────────────────────────────┘
```

---

## Gestion des Impayés

| Situation | Action |
|-----------|--------|
| Pot vide + **plus de 4 membres** | **Gel de la ligue** : Plus de nouveaux paris possibles jusqu'à régularisation |
| Pot vide + **4 membres ou moins** | **Downgrade automatique en Rookie** : La ligue passe en gratuit |

### Flow de gestion

```
Pot commun épuisé
       │
       ▼
Nombre de membres ?
       │
   ┌───┴───┐
   │       │
  ≤4      >4
   │       │
   ▼       ▼
Downgrade  Gel
Rookie    Ligue
```

---

## Limites par Utilisateur

| Type de ligue | Limite |
|---------------|--------|
| Ligues Rookie (gratuites) | Max 2-3 par utilisateur |
| Ligues payantes (Champion/MVP) | Illimité |

**Note** : Un utilisateur peut être dans plusieurs ligues avec différents plans. Les features disponibles dépendent du plan de chaque ligue individuellement.

---

## Tableau Comparatif Complet

| Feature | Rookie | Champion | MVP |
|---------|--------|----------|-----|
| **Prix mensuel** | Gratuit | 4,99€ | 9,99€ |
| **Prix annuel** | - | ~48€ | ~96€ |
| **Membres max/ligue** | 4 | 10 | 30 |
| **Compétitions** | 1 (changement 1x/sem) | Toutes | Toutes + custom |
| **Paris : Vainqueur** | ✅ | ✅ | ✅ |
| **Paris : Score exact** | ❌ | ✅ | ✅ |
| **Paris : BTTS** | ❌ | ✅ | ✅ |
| **Paris : Custom** | ❌ | ❌ | ✅ |
| **Custom events** | ❌ | ❌ | ✅ |
| **Historique** | 30 jours | 6 mois | Illimité |
| **Stats avancées** | ❌ | ❌ | ✅ |
| **Badges/Trophées** | ✅ | ✅ | ✅ |
| **Config points** | ✅ | ✅ | ✅ |

---

## Pricing Annuel

| Plan | Mensuel | Annuel | Économie |
|------|---------|--------|----------|
| Rookie | 0€ | 0€ | - |
| Champion | 4,99€/mois | 47,90€/an | 12€ (2 mois) |
| MVP | 9,99€/mois | 95,90€/an | 24€ (2 mois) |

---

## Notes Techniques

### Modèle de données suggéré

```prisma
model Plan {
  id          String   @id @default(cuid())
  name        String   // "rookie", "champion", "mvp"
  displayName String   // "Rookie", "Champion", "MVP"
  priceMonthly Float   // 0, 4.99, 9.99
  priceYearly  Float   // 0, 47.90, 95.90
  maxMembers   Int     // 4, 10, 30
  features     Json    // Liste des features
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  leagues     League[]
}

model LeagueWallet {
  id            String   @id @default(cuid())
  leagueId      String   @unique
  league        League   @relation(fields: [leagueId], references: [id])
  balance       Float    @default(0)
  nextBilling   DateTime
  contributions Contribution[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Contribution {
  id        String   @id @default(cuid())
  walletId  String
  wallet    LeagueWallet @relation(fields: [walletId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  amount    Float
  createdAt DateTime @default(now())
}
```

### Intégration Stripe

- Utiliser Stripe pour les paiements
- Webhooks pour la gestion automatique des prélèvements
- Stripe Connect potentiel pour les contributions multiples
