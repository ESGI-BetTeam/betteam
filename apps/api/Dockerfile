# Build stage
FROM node:24-alpine AS builder

# Le contexte de build est la racine du monorepo
WORKDIR /monorepo

# Copier les fichiers de dépendances du monorepo
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Installer toutes les dépendances depuis la racine (pour le monorepo)
RUN npm ci

# Copier le package shared
COPY packages/shared ./packages/shared/

# Copier le code source de l'API
COPY apps/api ./apps/api/

# Build l'API
WORKDIR /monorepo/apps/api

# Générer le client Prisma AVANT le build TypeScript
RUN npx prisma generate

# Compiler TypeScript
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copier package.json
COPY apps/api/package*.json ./

# Copier les node_modules depuis le builder (installés à la racine du monorepo)
COPY --from=builder /monorepo/node_modules ./node_modules

# Copier le package shared si nécessaire
COPY packages/shared /packages/shared

# Copier le code compilé et les fichiers nécessaires depuis le builder
COPY --from=builder /monorepo/apps/api/dist ./dist
COPY --from=builder /monorepo/apps/api/prisma ./prisma
COPY --from=builder /monorepo/apps/api/swagger.yaml ./swagger.yaml
COPY --from=builder /monorepo/apps/api/prisma.config.ts ./prisma.config.ts

# Générer le client Prisma
RUN npx prisma generate

EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start"]
