/**
 * Plan interface - Subscription plan for leagues
 */
export interface Plan {
  id: string; // "free", "champion", "mvp"
  name: string;
  maxMembers: number;
  maxCompetitions: number; // -1 = unlimited
  maxChangesWeek: number; // -1 = unlimited
  monthlyPrice: number;
  features: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plan summary for API responses
 */
export interface PlanSummary {
  id: string;
  name: string;
  maxMembers: number;
  maxCompetitions: number;
  maxChangesWeek: number;
  monthlyPrice: number;
  features: Record<string, boolean>;
}

/**
 * Plan limits check result
 */
export interface PlanLimitCheck {
  canAddMember: boolean;
  canChangeCompetition: boolean;
  currentMembers: number;
  maxMembers: number;
  changesThisWeek: number;
  maxChangesWeek: number;
  isUnlimited: boolean;
}
