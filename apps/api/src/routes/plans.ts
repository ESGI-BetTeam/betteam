import { Router, Request, Response } from 'express';
import { plansService } from '../services/plans.service';
import { GetPlansResponse, GetPlanResponse } from '@betteam/shared/api/plans';

const router = Router();

/**
 * GET /api/plans - List all available plans
 * Public endpoint - no authentication required
 */
router.get('/', async (req: Request, res: Response<GetPlansResponse | { error: string }>) => {
  try {
    const plans = await plansService.getAllPlans();

    return res.status(200).json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/plans/:id - Get plan details
 * Public endpoint - no authentication required
 */
router.get('/:id', async (req: Request, res: Response<GetPlanResponse | { error: string }>) => {
  try {
    const { id } = req.params;
    const plan = await plansService.getPlanById(id);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found.' });
    }

    return res.status(200).json({ plan });
  } catch (error) {
    console.error('Get plan error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
