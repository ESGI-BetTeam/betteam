# 🚀 Guide de Workflow BetTeam

## Vue d'ensemble de la stratégie de branches

```
main (production - déploiement automatique)
  ↑
  | PR après validation
  |
dev (développement/staging - déploiement automatique dev)
  ↑
  | PR depuis features
  |
feature/*, fix/*, refactor/* (branches de travail)
```

## 📌 Règles des branches

### `main` - Production
- ✅ Code stable et testé uniquement
- ❌ Pas de commit direct (protégée)
- ✅ Merge uniquement via Pull Request depuis `dev`
- 🚀 Déploiement automatique sur Railway Production

### `dev` - Développement/Staging
- ✅ Code en cours d'intégration
- ❌ Pas de commit direct (protégée)
- ✅ Merge via Pull Request depuis les branches de feature
- 🚀 Déploiement automatique sur Railway Dev

### Branches de feature
- ✅ Créées depuis `dev`
- ✅ Nom format : `feature/nom-fonctionnalite`, `fix/nom-bug`, `refactor/nom`
- ✅ Push et commits libres
- ✅ PR vers `dev` quand terminé

## 🔄 Workflow quotidien

### 1. Démarrer une nouvelle fonctionnalité

```bash
# S'assurer d'être à jour avec dev
git checkout dev
git pull origin dev

# Créer une nouvelle branche depuis dev
git checkout -b feature/nom-de-ma-fonctionnalite

# Développer...
git add .
git commit -m "feat: description des changements"

# Pousser la branche
git push -u origin feature/nom-de-ma-fonctionnalite
```

### 2. Créer une Pull Request vers `dev`

1. Aller sur GitHub : https://github.com/Neoznzoe/betteam/pulls
2. Cliquer sur "New Pull Request"
3. Base: `dev` ← Compare: `feature/nom-de-ma-fonctionnalite`
4. Remplir le template (titre, description, screenshots si besoin)
5. Demander une review si besoin
6. Merger quand approuvé

### 3. Tester sur l'environnement dev

Une fois mergé sur `dev`, Railway déploie automatiquement sur :
- **API Dev** : `https://betteam-api-dev.railway.app`
- Tester la fonctionnalité

### 4. Déployer en production

Quand plusieurs features sont validées sur `dev` :

```bash
# Créer une PR dev → main
git checkout main
git pull origin main
```

1. Sur GitHub, créer une PR `dev` → `main`
2. **Review complète du code**
3. **Tests de non-régression**
4. Merger → Déploiement automatique en production

## 🏗️ Environnements Railway

| Environnement | Branche | URL API | Base de données |
|---------------|---------|---------|-----------------|
| **Production** | `main` | `https://betteam-api.railway.app` | PostgreSQL Prod |
| **Dev** | `dev` | `https://betteam-api-dev.railway.app` | PostgreSQL Dev |

## 🗄️ Gestion de la base de données

### Créer une migration (sur dev)

```bash
# Sur la branche dev ou feature
npx prisma migrate dev --name nom_de_la_migration

# Commiter la migration
git add prisma/migrations
git commit -m "feat(db): ajout migration nom_de_la_migration"
git push
```

### Appliquer en production

Les migrations sont appliquées automatiquement au déploiement via :
```bash
npx prisma migrate deploy
```

⚠️ **Important** : Tester les migrations sur dev AVANT de merger sur main !

## 📦 Services et branches

| Service | Prod (main) | Dev (dev) |
|---------|-------------|-----------|
| **Web (landing)** | ✅ Déployé | ❌ Pas nécessaire |
| **API** | ✅ Déployé | ✅ Déployé |
| **Mobile** | Code sur `main` | Code sur `dev` |

## 🔑 Variables d'environnement

### Production (`main`)
```env
NODE_ENV=production
DATABASE_URL=<Postgres Production Railway>
FRONTEND_URL=https://betteam.com
JWT_SECRET=<secret-fort-production>
```

### Dev (`dev`)
```env
NODE_ENV=development
DATABASE_URL=<Postgres Dev Railway>
FRONTEND_URL=https://betteam-dev.railway.app
JWT_SECRET=<secret-dev>
```

## ⚠️ Règles importantes

1. ❌ **Jamais de `git push --force` sur `main` ou `dev`**
2. ✅ Toujours créer une branche depuis `dev` à jour
3. ✅ Commits clairs et descriptifs
4. ✅ Tester localement avant de push
5. ✅ Faire des PR petites et focalisées
6. ⚠️ Les migrations de BDD sont irréversibles en prod, soyez prudents !

## 🆘 Commandes utiles

### Mettre à jour sa branche avec dev
```bash
git checkout ma-branche
git fetch origin
git merge origin/dev
# Résoudre les conflits si nécessaire
git push
```

### Annuler des changements locaux
```bash
git checkout -- fichier.ts  # Un fichier spécifique
git reset --hard origin/dev  # Tous les fichiers (ATTENTION)
```

### Voir l'état actuel
```bash
git status                    # Fichiers modifiés
git log --oneline -10        # 10 derniers commits
git branch -a                # Toutes les branches
```

## 📝 Convention de commits

Format : `type(scope): description`

**Types** :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `refactor`: Refactoring sans changement de fonctionnalité
- `docs`: Documentation
- `style`: Formatage, points-virgules manquants, etc.
- `test`: Ajout de tests
- `chore`: Maintenance (dépendances, config, etc.)

**Exemples** :
```
feat(auth): ajout de l'authentification Google
fix(api): correction erreur 500 sur /api/matches
refactor(web): amélioration du composant Header
docs: mise à jour du README avec les instructions de déploiement
```

## 🎯 Checklist avant de merger sur main

- [ ] Code reviewé par au moins 1 personne
- [ ] Tests passent (quand ils seront en place)
- [ ] Testé manuellement sur l'environnement dev
- [ ] Pas de console.log ou de code de debug
- [ ] Migrations testées sur la BDD dev
- [ ] Documentation mise à jour si besoin
- [ ] Variables d'environnement documentées si nouvelles

---

**Questions ?** Contactez l'équipe sur le channel #dev
