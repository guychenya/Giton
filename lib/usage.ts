import { PlanTier } from './plan';

const USAGE_KEY = 'giton-usage';
const PLAN_KEY = 'giton-plan';

export interface UsageData {
  generations: number;
  lastReset: number;
  projects: number;
}

export function getUserPlan(): PlanTier {
  const saved = localStorage.getItem(PLAN_KEY);
  return (saved as PlanTier) || 'free';
}

export function setUserPlan(plan: PlanTier): void {
  localStorage.setItem(PLAN_KEY, plan);
}

export function getUsageData(): UsageData {
  const saved = localStorage.getItem(USAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse usage data:', e);
    }
  }
  return {
    generations: 0,
    lastReset: Date.now(),
    projects: 0,
  };
}

export function saveUsageData(data: UsageData): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(data));
}

export function incrementGenerations(): number {
  const usage = getUsageData();
  usage.generations += 1;
  saveUsageData(usage);
  return usage.generations;
}

export function resetUsage(): void {
  saveUsageData({
    generations: 0,
    lastReset: Date.now(),
    projects: 0,
  });
}

export function getRemainingGenerations(plan: PlanTier): number {
  if (plan === 'pro') return -1; // unlimited
  const usage = getUsageData();
  return Math.max(0, 10 - usage.generations);
}
