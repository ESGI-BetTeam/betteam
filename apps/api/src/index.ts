import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import fs from 'fs';

// Import Prisma client (charge déjà dotenv si nécessaire)
import { prisma } from './lib/prisma';

// Import routes
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import betsRouter from './routes/bets';
import leagueRouter from './routes/league';
import matchesRouter from './routes/matches';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/bets', betsRouter);
app.use('/api/leagues', leagueRouter);
app.use('/api/matches', matchesRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'BetTeam API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
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
