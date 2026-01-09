# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copier les fichiers de configuration
COPY apps/api/package.json apps/api/package-lock.json* ./

# Installer les dépendances
RUN npm ci

# Copier le package shared (nécessaire pour la compilation)
COPY packages/shared ../packages/shared

# Copier le code source de l'API
COPY apps/api .

# Build l'API
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copier package.json
COPY apps/api/package.json ./

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev

# Copier le package shared (nécessaire à l'exécution)
COPY --from=builder /packages/shared ../packages/shared

# Copier le code compilé et les fichiers nécessaires
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/swagger.yaml ./swagger.yaml
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Générer le client Prisma
RUN npx prisma generate

EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start"]
