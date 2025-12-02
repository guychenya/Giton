export type PlanTier = 'free' | 'pro';

export interface PlanLimits {
  maxGenerations: number;
  maxProjects: number;
  prioritySupport: boolean;
  advancedFeatures: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxGenerations: 10,
    maxProjects: 10,
    prioritySupport: false,
    advancedFeatures: false,
  },
  pro: {
    maxGenerations: -1, // unlimited
    maxProjects: -1, // unlimited
    prioritySupport: true,
    advancedFeatures: true,
  },
};

export const PLAN_PRICES = {
  pro: {
    monthly: 19.99,
    yearly: 199.99,
  },
};

export function getPlanLimits(plan: PlanTier): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canGenerate(plan: PlanTier, currentUsage: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxGenerations === -1) return true;
  return currentUsage < limits.maxGenerations;
}
