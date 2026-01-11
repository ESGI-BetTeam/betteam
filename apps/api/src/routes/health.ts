import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  console.log('🏥 Healthcheck endpoint called');
  let dbStatus = 'connected';

  try {
    // Test database connection
    await prisma.$connect();
    console.log('🏥 Database check: connected');
  } catch (error) {
    dbStatus = 'disconnected';
    console.log('🏥 Database check: disconnected', error);
  }

  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
  };

  console.log('🏥 Sending healthcheck response:', response);
  res.json(response);
});

export default router;
