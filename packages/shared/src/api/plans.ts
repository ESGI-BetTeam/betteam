import { PlanSummary } from '../interfaces/Plan';

/**
 * GET /api/plans - List all available plans
 */
export interface GetPlansResponse {
  plans: PlanSummary[];
}

/**
 * GET /api/plans/:id - Get plan details
 */
export interface GetPlanResponse {
  plan: PlanSummary;
}
