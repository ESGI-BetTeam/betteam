# 🛠️ Guide de Configuration - Environnements Dev et Production

Ce guide vous accompagne pour mettre en place les environnements de développement et production.

---

## ✅ Étape 1 : Configuration GitHub (Protections de branches)

### 1.1 Protéger la branche `main`

1. Aller sur : https://github.com/Neoznzoe/betteam/settings/branches
2. Cliquer sur **"Add branch protection rule"**
3. Configuration :
   - **Branch name pattern** : `main`
   - ✅ Cocher **"Require a pull request before merging"**
     - ✅ **"Require approvals"** : 1 (au minimum)
     - ✅ **"Dismiss stale pull request approvals when new commits are pushed"**
   - ✅ Cocher **"Require status checks to pass before merging"** (optionnel pour l'instant)
   - ✅ Cocher **"Require conversation resolution before merging"**
   - ✅ Cocher **"Do not allow bypassing the above settings"**
   - ❌ Décocher **"Allow force pushes"**
   - ❌ Décocher **"Allow deletions"**
4. Cliquer sur **"Create"** (ou "Save changes")

### 1.2 Protéger la branche `dev`

1. Répéter les mêmes étapes pour la branche `dev`
2. Configuration identique à `main`

### 1.3 Configuration par défaut pour les Pull Requests

1. Aller sur : https://github.com/Neoznzoe/betteam/settings
2. Section **"Pull Requests"** :
   - ✅ Cocher **"Automatically delete head branches"**
   - ✅ Cocher **"Allow squash merging"**

---

## ✅ Étape 2 : Configuration Railway - Environnement Dev

### 2.1 Créer la base de données PostgreSQL Dev

1. Aller sur votre projet Railway : https://railway.app/project/betteam
2. Cliquer sur **"+ New"**
3. Sélectionner **"Database"** → **"PostgreSQL"**
4. Renommer le service :
   - Cliquer sur le service PostgreSQL créé
   - En haut, cliquer sur les 3 points → **"Settings"**
   - **Service Name** : `Postgres-Dev`
   - Cliquer sur **"Update"**

5. Noter la `DATABASE_URL` :
   - Onglet **"Variables"**
   - Copier la valeur de `DATABASE_URL` (vous en aurez besoin plus tard)

### 2.2 Dupliquer le service API pour Dev

**Option A : Via l'interface Railway**

1. Dans votre projet Railway
2. Cliquer sur **"+ New"**
3. Sélectionner **"GitHub Repo"**
4. Choisir le repo `Neoznzoe/betteam`
5. Configuration du service :
   - **Service Name** : `BetTeam-API-Dev`
   - **Root Directory** : (laisser vide)
   - **Branch** : `dev` ⚠️ IMPORTANT

**Option B : Dupliquer le service existant (plus rapide)**

1. Sur votre service API existant, cliquer sur les 3 points
2. ⚠️ Railway n'a pas de fonction "duplicate", donc utiliser l'Option A

### 2.3 Configurer le service API Dev

1. Ouvrir le service `BetTeam-API-Dev`
2. Aller dans **"Settings"**
3. **Source → Branch** : Vérifier que c'est bien `dev`
4. **Build** :
   - Builder : `DOCKERFILE`
   - Dockerfile Path : `apps/api/Dockerfile`
5. **Deploy** :
   - Custom Start Command : (laisser vide)
   - Healthcheck Path : `/api/health`
   - Healthcheck Timeout : `100`
   - Restart Policy : `ON_FAILURE`
   - Max Retries : `10`

### 2.4 Configurer les variables d'environnement API Dev

1. Onglet **"Variables"** du service `BetTeam-API-Dev`
2. Cliquer sur **"+ New Variable"**
3. Ajouter ces variables :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `development` |
| `DATABASE_URL` | `<Coller la DATABASE_URL de Postgres-Dev>` |
| `PORT` | `3000` |
| `JWT_SECRET` | `dev-secret-change-me-later` |
| `FRONTEND_URL` | `http://localhost:5173` (ou l'URL de votre web dev si déployé) |

4. **Connecter la base de données** (méthode alternative) :
   - Cliquer sur **"+ New Variable"**
   - Sélectionner **"Reference"**
   - Service : `Postgres-Dev`
   - Variable : `DATABASE_URL`
   - This will create : `DATABASE_URL`

### 2.5 Renommer le service API Production (optionnel, pour clarté)

1. Ouvrir votre service API actuel (celui sur `main`)
2. **Settings** → **Service Name** : `BetTeam-API-Production`

### 2.6 Vérifier la configuration du service API Production

1. Service `BetTeam-API-Production`
2. **Settings** → **Source** : Branch doit être `main`
3. **Variables** :
   - `NODE_ENV` : `production`
   - `DATABASE_URL` : (lien vers votre Postgres Production)

---

## ✅ Étape 3 : Vérifier les déploiements

### 3.1 Déclencher le déploiement dev

```bash
# Depuis votre terminal
git checkout dev
git commit --allow-empty -m "chore: trigger dev deployment"
git push origin dev
```

1. Aller sur Railway
2. Ouvrir `BetTeam-API-Dev`
3. Vérifier que le build démarre
4. Attendre que le statut passe à **"Active"** (vert)

### 3.2 Tester l'environnement dev

1. Dans Railway, copier l'URL publique du service dev :
   - `BetTeam-API-Dev` → **"Settings"** → **"Domains"**
   - Si pas de domaine, cliquer sur **"Generate Domain"**
2. Tester dans le navigateur :
   ```
   https://votre-api-dev.railway.app/api/health
   ```
   Vous devriez voir : `{ "status": "ok" }`

### 3.3 Vérifier la production

1. Tester l'API production :
   ```
   https://votre-api-prod.railway.app/api/health
   ```

---

## ✅ Étape 4 : Appliquer les migrations Prisma

### 4.1 Sur la base de données Dev

1. Depuis votre terminal local :
```bash
# S'assurer d'être sur dev
git checkout dev

# Récupérer la DATABASE_URL de l'environnement dev depuis Railway
# (copier depuis Railway → Postgres-Dev → Variables → DATABASE_URL)

# Créer un fichier .env.dev (ne pas commiter !)
echo "DATABASE_URL=postgresql://..." > .env.dev

# Appliquer les migrations sur la BDD dev
cd apps/api
DATABASE_URL="<URL-DEV>" npx prisma migrate deploy

# Ou utiliser le fichier .env.dev
dotenv -e .env.dev -- npx prisma migrate deploy
```

### 4.2 Sur la base de données Production

⚠️ **ATTENTION** : Faire un backup avant !

```bash
# Même processus avec la DATABASE_URL de production
DATABASE_URL="<URL-PROD>" npx prisma migrate deploy
```

---

## ✅ Étape 5 : Documenter les URLs

Créer un fichier `.env.example` à la racine pour documenter :

```env
# Development
DATABASE_URL="postgresql://user:password@host:5432/betteam-dev"
NODE_ENV="development"
PORT="3000"
JWT_SECRET="your-secret-here"
FRONTEND_URL="http://localhost:5173"

# Production (not for .env file, configured in Railway)
# DATABASE_URL="<from Railway Postgres>"
# NODE_ENV="production"
# JWT_SECRET="<strong-secret>"
# FRONTEND_URL="https://betteam.com"
```

---

## ✅ Étape 6 : Créer un template de Pull Request

Créer le fichier `.github/pull_request_template.md` :

(Voir le fichier créé automatiquement)

---

## 📋 Checklist finale

- [ ] Branche `dev` créée et poussée
- [ ] Branche `main` protégée sur GitHub
- [ ] Branche `dev` protégée sur GitHub
- [ ] Base de données Postgres-Dev créée sur Railway
- [ ] Service API-Dev créé sur Railway (branche `dev`)
- [ ] Variables d'environnement configurées (API-Dev)
- [ ] Déploiement dev fonctionne
- [ ] Migrations appliquées sur BDD dev
- [ ] Migrations appliquées sur BDD prod
- [ ] URLs documentées
- [ ] Template PR créé
- [ ] Équipe informée du nouveau workflow

---

## 🎯 URLs de référence rapide

| Environnement | API | Base de données | Railway Dashboard |
|---------------|-----|-----------------|-------------------|
| **Production** | https://betteam-api-prod.railway.app | Postgres-Production | [Lien Railway] |
| **Dev** | https://betteam-api-dev.railway.app | Postgres-Dev | [Lien Railway] |

---

## 🆘 En cas de problème

### Le déploiement dev échoue

1. Vérifier les logs dans Railway → `BetTeam-API-Dev` → **"Deployments"**
2. Vérifier que la branche est bien `dev`
3. Vérifier que `DATABASE_URL` est bien configuré

### Les migrations ne s'appliquent pas

1. Vérifier que `prisma/migrations/` est bien commité dans Git
2. Vérifier que la `DATABASE_URL` est correcte
3. Tester en local d'abord

### Conflit lors du merge dev → main

```bash
git checkout main
git pull origin main
git merge dev
# Résoudre les conflits
git add .
git commit -m "chore: merge dev into main"
git push origin main
```

---

**Configuration terminée ! 🎉**

Vous pouvez maintenant commencer à utiliser le workflow de développement.
