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
│   └── api/                # Backend API (Node.js)
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
- **Node.js** (à venir)
- **Express/Fastify** (à venir)
- **PostgreSQL/MongoDB** (à venir)

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

4. **Accéder à l'application**
Ouvrez votre navigateur à l'adresse : [http://localhost:5173](http://localhost:5173)

---

## 📜 Commandes disponibles

### Commandes root (depuis la racine du projet)

```bash
# Lancer l'application web en mode dev
npm run dev

# Lancer uniquement l'application web
npm run dev:web

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

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env.local` dans `apps/web/` :

```env
# API Configuration (à venir)
VITE_API_URL=http://localhost:3000/api

# Analytics (optionnel)
VITE_GA_TRACKING_ID=your-tracking-id

# Feature flags
VITE_ENABLE_SIGNUP=true
```

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

1. Créer une branche depuis `main` :
```bash
git checkout -b feat/nouvelle-fonctionnalite
```

2. Faire des commits atomiques :
```bash
git add .
git commit -m "feat: ajoute la fonctionnalité X"
```

3. Pousser et créer une Pull Request :
```bash
git push origin feat/nouvelle-fonctionnalite
```

### Types de commits

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage, style CSS
- `refactor:` - Refactoring de code
- `test:` - Ajout de tests
- `chore:` - Tâches maintenance

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
- [ ] Développement de l'API backend
- [ ] Authentification et gestion utilisateurs
- [ ] Base de données et modèles

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

- **Victor Besson** - Lead Developer
- **Jallyl Tourougui** - Developer
- **Leo Filsnoel** - Developer

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
