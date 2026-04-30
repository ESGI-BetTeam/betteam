<div align="center">
  <h1>🏆 BetTeam</h1>
  <p><strong>Pronostics Sportifs Collaboratifs pour Entreprises</strong></p>
  <p>Boostez la cohésion d'équipe avec une application de team building innovante</p>

  ![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)
  ![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
  ![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)
  ![TypeScript](https://img.shields.io/badge/typescript-5.2.2-3178c6.svg)
</div>

---

## 📚 Documentation

- 🚀 **[Guide de Démarrage Rapide](./QUICK_START.md)** - Pour commencer rapidement
- 🔄 **[Workflow de Développement](./WORKFLOW.md)** - Guide complet du workflow git
- 🛠️ **[Guide de Configuration](./SETUP.md)** - Mise en place des environnements dev/prod
- 📋 **[Variables d'Environnement](./.env.example)** - Template des variables

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Structure du projet](#-structure-du-projet)
- [Technologies utilisées](#-technologies-utilisées)
- [Installation](#-installation)
- [Commandes disponibles](#-commandes-disponibles)
- [Configuration](#-configuration)
- [Développement](#-développement)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🎯 À propos

**BetTeam** est une plateforme SaaS de pronostics sportifs conçue spécifiquement pour les entreprises. Elle permet aux équipes de créer des ligues privées, de parier sur des événements sportifs avec des points virtuels, et de renforcer la cohésion d'équipe de manière ludique et engageante.

### 🎁 Pourquoi BetTeam ?

- **100% Team Building** : Aucun argent réel impliqué, uniquement des points virtuels
- **Engagement garanti** : Gamification et classements en temps réel
- **Facile à utiliser** : Configuration en 2 minutes, aucune carte bancaire requise
- **Multi-plateformes** : Applications web et mobile (iOS & Android)
- **Sécurisé** : Données d'entreprise protégées et conformes RGPD

---

## ✨ Fonctionnalités

### 🏅 Fonctionnalités principales

- **Ligues privées d'entreprise** : Créez des espaces dédiés pour vos équipes
- **Pronostics sur événements sportifs** : Football, basketball, tennis, et plus encore
- **Classements en temps réel** : Tableaux de bord compétitifs et statistiques détaillées
- **Système de points virtuels** : Économie interne sans argent réel
- **Notifications push** : Rappels de matchs et résultats en direct
- **Interface responsive** : Design moderne compatible mobile, tablette et desktop
- **Gestion d'équipe** : Invitations, rôles et permissions configurables

### 🔮 À venir

- Tournois personnalisés avec bracket système
- Badges et achievements
- Intégrations Slack et Microsoft Teams
- Analytics avancés pour les gestionnaires
- Mode quiz sur les statistiques sportives

---

## 📁 Structure du projet

Ce projet est un **monorepo** organisé avec npm workspaces :

```
betteam/
├── apps/
│   ├── web/                # Application web (React + Vite)
│   │   ├── src/
│   │   │   ├── components/ # Composants réutilisables
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   ├── mobile/             # Application mobile (React Native/Expo)
│   │   └── package.json
│   │
│   └── api/                # Backend API (Node.js + Express)
│       ├── src/
│       │   ├── index.ts
│       │   └── routes/
│       ├── swagger.yaml    # Documentation OpenAPI
│       ├── .env
│       └── package.json
│
├── packages/               # Packages partagés (à venir)
│   └── shared/            # Types, utils, constants partagés
│
├── .gitignore
├── package.json           # Root workspace configuration
└── README.md
```

### 🎨 Architecture de l'application web

```
apps/web/src/components/
├── Header.tsx              # Navigation et menu principal
├── Hero.tsx                # Section hero avec CTA
├── Features.tsx            # Présentation des fonctionnalités
├── HowItWorks.tsx          # Étapes d'utilisation
├── Testimonials.tsx        # Témoignages clients
├── Pricing.tsx             # Plans tarifaires
├── FAQ.tsx                 # Questions fréquentes
├── FinalCTA.tsx            # Appel à l'action final
├── Footer.tsx              # Pied de page
├── DownloadModal.tsx       # Modal téléchargement avec QR codes
├── PhoneMockup.tsx         # Mockups 3D iPhone/Android
├── AppStoreButtons.tsx     # Boutons App Store/Google Play
├── Button.tsx              # Composant bouton réutilisable
├── Card.tsx                # Composant carte réutilisable
└── Accordion.tsx           # Composant accordéon pour FAQ
```

---

## 🛠 Technologies utilisées

### Frontend Web
- **React 18.2** - Bibliothèque UI
- **TypeScript 5.2** - Typage statique
- **Vite 5.0** - Build tool ultra-rapide
- **Tailwind CSS 3.3** - Framework CSS utility-first
- **Lucide React** - Icônes modernes
- **React QR Code** - Génération de QR codes

### Mobile
- **React Native** (à venir)
- **Expo** (à venir)

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express 5** - Framework web
- **TypeScript 5.9** - Typage statique
- **Swagger UI** - Documentation API interactive
- **PostgreSQL** (à venir)
- **JWT** - Authentification (à venir)

### DevOps & Tools
- **npm workspaces** - Gestion du monorepo
- **ESLint** - Linting
- **Git** - Version control

---

## 🚀 Installation

### Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/betteam.git
cd betteam
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer l'application web en développement**
```bash
npm run dev
```

4. **Lancer l'API backend en développement**
```bash
# Depuis la racine du projet
cd apps/api
npm run dev
```

5. **Accéder aux applications**
- **Application web** : [http://localhost:5173](http://localhost:5173)
- **API Backend** : [http://localhost:3000](http://localhost:3000)
- **Documentation API (Swagger UI)** : [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Health Check** : [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 📜 Commandes disponibles

### Commandes root (depuis la racine du projet)

```bash
# Lancer l'application web en mode dev
npm run dev

# Lancer uniquement l'application web
npm run dev:web

# Lancer uniquement l'API backend
cd apps/api && npm run dev

# Build de tous les workspaces
npm run build

# Build uniquement l'application web
npm run build:web
```

### Commandes spécifiques à l'app web

```bash
# Depuis apps/web/
cd apps/web

# Développement avec hot reload
npm run dev

# Build de production
npm run build

# Preview du build de production
npm run preview
```

### Commandes spécifiques à l'API backend

```bash
# Depuis apps/api/
cd apps/api

# Développement avec hot reload (nodemon)
npm run dev

# Build de production
npm run build

# Démarrer en production
npm run start

# Vérification des types TypeScript
npm run type-check
```

### Commandes Base de Données (Prisma)

```bash
# Depuis apps/api/
cd apps/api

# Générer le client Prisma (après modification du schema)
npm run db:generate

# Créer une nouvelle migration (développement)
npm run db:migrate
# Exemple: npx prisma migrate dev --name add_new_table

# Appliquer les migrations en production (Railway)
npm run db:migrate:deploy

# Pousser le schéma directement sans migration (prototypage rapide)
npm run db:push

# Ouvrir Prisma Studio (interface graphique pour la BDD)
npm run db:studio

# Seeder la base de données avec des données de test
npm run db:seed
```

#### Workflow typique de migration

**1. Modifier le schéma Prisma**
```bash
# Éditer apps/api/prisma/schema.prisma
# Ajouter/modifier des models
```

**2. Créer et appliquer la migration**
```bash
cd apps/api
npm run db:migrate
# Entrer un nom descriptif: "add_user_avatar" par exemple
```

**3. Le client Prisma est automatiquement régénéré**
```bash
# Vous pouvez maintenant utiliser les nouveaux models dans votre code
```

**4. Commiter les fichiers de migration**
```bash
git add prisma/migrations/
git commit -m "feat: add user avatar field"
```

---

## ⚙️ Configuration

### Variables d'environnement

#### Application Web (`apps/web/.env.local`)

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Analytics (optionnel)
VITE_GA_TRACKING_ID=your-tracking-id

# Feature flags
VITE_ENABLE_SIGNUP=true
```

#### API Backend (`apps/api/.env`)

Un fichier `.env.example` est fourni comme template. Copiez-le et configurez :

```env
# Server
PORT=3000
NODE_ENV=development

# Database (Railway PostgreSQL)
# Obtenir depuis Railway Dashboard > PostgreSQL Service > Connect
DATABASE_URL=postgresql://postgres:PASSWORD@xxx.proxy.rlwy.net:PORT/railway

# JWT Authentication (à configurer)
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Configuration Railway PostgreSQL :**

1. Créer un projet sur [railway.app](https://railway.app)
2. Ajouter un service **PostgreSQL**
3. Cliquer sur le service PostgreSQL > **Connect**
4. Copier la **Public URL** (celle avec `.proxy.rlwy.net`)
5. Coller dans `apps/api/.env` comme `DATABASE_URL`

### Configuration Tailwind

Le thème est personnalisable dans `apps/web/tailwind.config.js` :

```js
theme: {
  extend: {
    colors: {
      background: '#1e1e2e',  // Couleur de fond principale
      accent: '#10b981',       // Couleur d'accent (vert)
    },
  },
}
```

---

## 💻 Développement

### API Backend & Swagger UI

L'API est documentée avec **OpenAPI 3.0** et accessible via **Swagger UI**.

#### Accès à la documentation

Une fois l'API lancée (`npm run dev` dans `apps/api/`), accédez à :
- **Swagger UI** : [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- Explorez tous les endpoints, schémas de données, et testez directement depuis l'interface

#### Endpoints disponibles

| Groupe | Endpoint | Méthode | Description |
|--------|----------|---------|-------------|
| Health | `/api/health` | GET | Vérifier l'état de l'API |
| Auth | `/api/auth/register` | POST | Créer un compte |
| Auth | `/api/auth/login` | POST | Se connecter |
| Auth | `/api/auth/me` | GET | Profil utilisateur |
| Leagues | `/api/leagues` | GET | Lister les ligues |
| Leagues | `/api/leagues` | POST | Créer une ligue |
| Leagues | `/api/leagues/:id` | GET | Détails d'une ligue |
| Matches | `/api/matches` | GET | Lister les matchs |
| Bets | `/api/bets` | GET | Lister mes paris |
| Bets | `/api/bets` | POST | Placer un pari |

#### Structure de l'API

```
apps/api/
├── src/
│   ├── index.ts              # Point d'entrée, config Express + Swagger
│   ├── routes/
│   │   ├── health.ts         # Health check endpoint
│   │   ├── auth.ts           # Authentification
│   │   ├── league.ts         # Gestion des ligues
│   │   ├── matches.ts        # Gestion des matchs
│   │   └── bets.ts           # Gestion des paris
│   ├── middleware/           # (à venir) Auth, validation, etc.
│   ├── models/               # (à venir) Modèles de données
│   └── services/             # (à venir) Logique métier
├── swagger.yaml              # Documentation OpenAPI complète
├── .env                      # Variables d'environnement
├── nodemon.json              # Config hot reload
├── tsconfig.json             # Config TypeScript
└── package.json
```

### Base de Données (PostgreSQL + Prisma)

L'application utilise **PostgreSQL** hébergé sur **Railway** avec **Prisma** comme ORM.

#### Tables principales

**Sports Data (sync TheSportsDB)**
- `competitions` - Compétitions sportives (Ligue 1, Champions League, etc.)
- `teams` - Équipes sportives avec logos et infos
- `matches` - Matchs à venir, en cours, et terminés
- `sync_logs` - Logs de synchronisation avec TheSportsDB

**User & Auth**
- `users` - Utilisateurs de l'application

**Betting System**
- `leagues` - Ligues privées d'entreprise
- `league_members` - Membres des ligues avec leur solde de points
- `bets` - Paris placés par les utilisateurs

#### Schéma Prisma

Le schéma complet est dans `apps/api/prisma/schema.prisma`. Pour visualiser la base de données :

```bash
cd apps/api
npm run db:studio
```

Cela ouvre **Prisma Studio** sur [http://localhost:5555](http://localhost:5555) - une interface graphique pour explorer et éditer les données.

#### Migrations

Les migrations sont versionnées dans `apps/api/prisma/migrations/`. Chaque migration crée un fichier SQL qui décrit les changements du schéma.

Pour créer une nouvelle migration après modification du schéma :
```bash
cd apps/api
npm run db:migrate
```

### Structure des composants

Chaque composant suit cette structure :

```tsx
// apps/web/src/components/ExampleComponent.tsx
interface ExampleProps {
  title: string
  onAction?: () => void
}

export default function ExampleComponent({ title, onAction }: ExampleProps) {
  return (
    <div className="container">
      <h2>{title}</h2>
      {onAction && (
        <button onClick={onAction}>Action</button>
      )}
    </div>
  )
}
```

### Conventions de code

- **Composants** : PascalCase (`Header.tsx`)
- **Fichiers utils** : camelCase (`formatDate.ts`)
- **Constantes** : UPPER_SNAKE_CASE (`API_URL`)
- **Classes CSS** : Tailwind utility classes

### Git Workflow

Le projet utilise un workflow **Git Flow** avec deux branches principales :
- `main` - Production (déploiement automatique)
- `dev` - Développement/Staging (déploiement automatique dev)

**Workflow complet** : Voir [WORKFLOW.md](./WORKFLOW.md)

**Résumé rapide** :

1. Créer une branche depuis `dev` :
```bash
git checkout dev
git pull origin dev
git checkout -b feature/nouvelle-fonctionnalite
```

2. Développer et commiter :
```bash
git add .
git commit -m "feat: ajoute la fonctionnalité X"
git push -u origin feature/nouvelle-fonctionnalite
```

3. Créer une Pull Request vers `dev` sur GitHub

4. Après tests sur dev, merger `dev` → `main` pour déployer en production

### Types de commits

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage, style CSS
- `refactor:` - Refactoring de code
- `test:` - Ajout de tests
- `chore:` - Tâches maintenance

### Environnements

| Env | Branche | Déploiement |
|-----|---------|-------------|
| **Production** | `main` | Automatique sur Railway |
| **Dev** | `dev` | Automatique sur Railway |
| **Local** | feature/* | `npm run dev` |

---

## 🚢 Déploiement

### Application Web

#### Vercel (recommandé)
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
cd apps/web
vercel --prod
```

#### Netlify
```bash
# Build
npm run build:web

# Le dossier dist/ est prêt pour le déploiement
```

### Variables d'environnement en production

N'oubliez pas de configurer les variables d'environnement sur votre plateforme de déploiement.

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. **Créer une branche** (`git checkout -b feat/amazing-feature`)
3. **Commit** vos changements (`git commit -m 'feat: add amazing feature'`)
4. **Push** vers la branche (`git push origin feat/amazing-feature`)
5. **Ouvrir une Pull Request**

### Guidelines de contribution

- Écrire des messages de commit clairs et descriptifs
- Ajouter des tests si applicable
- Mettre à jour la documentation si nécessaire
- Respecter les conventions de code existantes
- S'assurer que le build passe (`npm run build`)

---

## 🗺 Roadmap

### Q1 2026
- [x] Setup de l'API backend avec Express et Swagger UI
- [x] Connexion base de données PostgreSQL
- [x] Authentification JWT et gestion utilisateurs
- [x] Implémentation des endpoints de ligues et paris

### Q2 2026
- [ ] Application mobile iOS et Android
- [ ] Intégration des API sportives en temps réel
- [ ] Système de notifications push

### Q3 2026
- [ ] Tableaux de bord analytics
- [ ] Intégrations Slack et Teams
- [ ] Mode tournoi avec brackets

### Q4 2026
- [ ] Intelligence artificielle pour recommandations
- [ ] Mode multijoueur en temps réel
- [ ] API publique pour partenaires

---

## 📄 License

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Équipe

Développé avec passion par l'équipe BetTeam.

- **BESSON Victor** - Lead Developer
- **FILSNOEL Leo** - Developer
- **RENAULD Yohann** - Developer
- **TOUROUGUI Jallyl** - Developer

---

## 📞 Contact & Support

- **Email** : support@betteam.app
- **Website** : [betteam.app](https://betteam.app)
- **Twitter** : [@BetTeamApp](https://twitter.com/BetTeamApp)
- **LinkedIn** : [BetTeam](https://linkedin.com/company/betteam)

---

<div align="center">
  <p>Made with ❤️ for teams who love sports</p>
  <p>© 2026 BetTeam. All rights reserved.</p>
</div>
