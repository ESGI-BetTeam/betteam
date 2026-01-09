# Build stage
FROM node:24-alpine AS builder

# Le contexte de build est la racine du monorepo
WORKDIR /monorepo

# Copier les fichiers de dépendances
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared ./packages/shared/

# Installer toutes les dépendances
WORKDIR /monorepo/apps/api
RUN npm ci

# Copier le code source de l'API
COPY apps/api ./

# Build l'API
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copier package.json et installer uniquement les dépendances de production
COPY apps/api/package*.json ./
RUN npm ci --omit=dev

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
