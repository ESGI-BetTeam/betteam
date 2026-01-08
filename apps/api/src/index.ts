import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

// Import routes
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import betsRouter from './routes/bets';
import leagueRouter from './routes/league';
import matchesRouter from './routes/matches';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load Swagger documentation
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

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
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
});

export default app;
