import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import fs from 'fs';

console.log('🔧 [1/8] Starting BetTeam API...');

// Import Prisma client (charge déjà dotenv si nécessaire)
import { prisma } from './lib/prisma';
console.log('🔧 [2/8] Prisma client imported');

// Import routes
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import betsRouter from './routes/bets';
import leagueRouter from './routes/league';
import matchesRouter from './routes/matches';
import competitionsRouter from './routes/competitions';
import syncRouter from './routes/sync';
import usersRouter from './routes/users';
console.log('🔧 [3/8] Routes imported');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
console.log(`🔧 [4/8] Express app created, PORT=${PORT}`);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📥 [${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);

  // Log when response is sent
  res.on('finish', () => {
    console.log(`📤 [${timestamp}] ${req.method} ${req.path} - Status: ${res.statusCode}`);
  });

  next();
});

console.log('🔧 [5/8] Middlewares configured');

// Load Swagger documentation
// Essayer plusieurs chemins possibles pour trouver swagger.yaml
let swaggerPath = '';
const possiblePaths = [
  path.join(__dirname, '../swagger.yaml'),           // Développement
  path.join(__dirname, '../../../../swagger.yaml'),  // Production (dist/apps/api/src -> racine)
  path.join(__dirname, '../../../swagger.yaml'),     // Alternative
  '/app/swagger.yaml',                               // Absolu Railway
];

for (const tryPath of possiblePaths) {
  if (fs.existsSync(tryPath)) {
    swaggerPath = tryPath;
    break;
  }
}

if (!swaggerPath) {
  console.error('❌ swagger.yaml introuvable. Chemins testés:', possiblePaths);
  throw new Error('swagger.yaml not found');
}

console.log('📄 Swagger loaded from:', swaggerPath);
const swaggerDocument = YAML.load(swaggerPath);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'BetTeam API Documentation',
}));
console.log('🔧 [6/8] Swagger UI configured');

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/bets', betsRouter);
app.use('/api/leagues', leagueRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/competitions', competitionsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/users', usersRouter);
console.log('🔧 [7/8] Routes registered');

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'BetTeam API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// Start server
console.log('🔧 [8/8] Starting server...');
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
  console.log(`📚 API Documentation available at http://0.0.0.0:${PORT}/api-docs`);

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
});

// Handle server errors
server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
});

export default app;
