# 🚀 Guide de Démarrage Rapide

## Pour les développeurs

### Première fois sur le projet

```bash
# Cloner le repo
git clone https://github.com/Neoznzoe/betteam.git
cd betteam

# Installer les dépendances
npm install

# Créer le fichier .env pour l'API
cd apps/api
cp ../../.env.example .env
# Éditer .env avec vos valeurs locales

# Générer le client Prisma
npx prisma generate

# Lancer la migration (avec une BDD locale ou dev)
npx prisma migrate dev

# Retour à la racine
cd ../..

# Lancer le projet (selon ce que vous développez)
npm run dev:web   # Landing page
cd apps/api && npm run dev  # API
cd apps/mobile && npm start  # Mobile
```

### Workflow quotidien

```bash
# 1. Récupérer les dernières modifications de dev
git checkout dev
git pull origin dev

# 2. Créer une branche pour votre feature
git checkout -b feature/ma-nouvelle-fonctionnalite

# 3. Développer et commiter régulièrement
git add .
git commit -m "feat: description claire"

# 4. Pousser votre branche
git push -u origin feature/ma-nouvelle-fonctionnalite

# 5. Sur GitHub, créer une Pull Request vers dev

# 6. Après merge, supprimer la branche locale
git checkout dev
git pull origin dev
git branch -d feature/ma-nouvelle-fonctionnalite
```

## URLs importantes

| Service | Production | Dev |
|---------|-----------|-----|
| **Landing Page** | https://betteam.com | localhost:5173 |
| **API** | https://betteam-api.railway.app | https://betteam-api-dev.railway.app |
| **API Docs** | /api-docs | /api-docs |
| **Mobile** | Expo app | Expo dev |

## Commandes utiles

```bash
# API
cd apps/api
npm run dev          # Lancer en dev avec hot reload
npm run build        # Compiler TypeScript
npm run start        # Lancer en production (après build)

# Prisma
npx prisma studio    # Interface visuelle de la BDD
npx prisma generate  # Générer le client Prisma
npx prisma migrate dev --name ma_migration  # Créer une migration

# Web
cd apps/web
npm run dev          # Lancer en dev
npm run build        # Build pour production

# Mobile
cd apps/mobile
npm start            # Lancer Expo
```

## Structure du projet

```
betteam/
├── apps/
│   ├── api/         # Backend NestJS/Express
│   ├── web/         # Landing page Next.js
│   └── mobile/      # App React Native
├── packages/
│   └── shared/      # Code partagé (types, utils)
├── .github/         # Templates et workflows GitHub
├── WORKFLOW.md      # Guide complet du workflow
├── SETUP.md         # Guide de configuration
└── .env.example     # Variables d'environnement template
```

## Besoin d'aide ?

- 📖 Guide complet : voir [WORKFLOW.md](./WORKFLOW.md)
- 🛠️ Configuration : voir [SETUP.md](./SETUP.md)
- 🐛 Bug ou question : créer une issue sur GitHub
- 💬 Discussion : channel #dev de l'équipe

## Règles d'or

1. ❌ Jamais de commit direct sur `main` ou `dev`
2. ✅ Toujours créer une branche depuis `dev`
3. ✅ Pull Requests petites et focalisées
4. ✅ Tester avant de créer une PR
5. ✅ Messages de commit clairs (feat/fix/refactor/docs)
