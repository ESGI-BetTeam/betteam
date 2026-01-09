# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copier les fichiers de configuration du monorepo
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Installer toutes les dépendances (nécessaire pour les workspaces)
RUN npm ci

# Copier le code source de l'API
COPY apps/api ./apps/api

# Build l'API
WORKDIR /app/apps/api
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copier les fichiers de configuration
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Installer uniquement les dépendances de production
RUN npm ci --workspace=@betteam/api --omit=dev

# Copier le code compilé et les fichiers nécessaires
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/swagger.yaml ./apps/api/swagger.yaml
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts

# Générer le client Prisma
WORKDIR /app/apps/api
RUN npx prisma generate

EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start"]
