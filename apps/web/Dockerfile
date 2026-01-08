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

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/apps/web/dist ./dist

# Expose port (Railway will set this via $PORT)
EXPOSE 3000

# Start serve (serve listens on 0.0.0.0 by default)
CMD ["sh", "-c", "serve dist -l ${PORT:-3000}"]
