import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Essayer de charger .env (ignoré silencieusement si le fichier n'existe pas)
// En production (Railway), les variables sont déjà dans process.env
try {
  require('dotenv').config();
} catch {}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Variables disponibles:', Object.keys(process.env).sort());
  throw new Error(
    "DATABASE_URL n'est pas définie ! " +
    "En développement: vérifiez votre fichier .env. " +
    "En production: configurez la variable d'environnement DATABASE_URL dans Railway."
  );
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;