# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN npm ci

# Copy web app source
COPY apps/web ./apps/web

# Build the app
RUN npm run build --workspace=@betteam/web

# Stage 2: Production
FROM node:24-alpine

WORKDIR /app

# Copy package.json for dependencies and ESM support
COPY apps/web/package.json ./

# Install production dependencies only
RUN npm install --production

# Copy built files and server from builder
COPY --from=builder /app/apps/web/dist ./dist
COPY apps/web/server.js ./server.js

# Expose port (Railway will set this via $PORT)
EXPOSE 3000

# Start Node.js server
CMD ["node", "server.js"]
