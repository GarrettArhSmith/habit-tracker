import { toCount } from "./countUtils";

export type MetricCompletionRule = "any" | "goal" | "weighted";
export type MetricTrackingMode = "binary" | "multiple";

export type MetricHabitHistory = Record<string, unknown>;

export type MetricHabit = {
  trackingMode: MetricTrackingMode;
  dailyTarget: number;
  completionRule: MetricCompletionRule;
  history: MetricHabitHistory;
};

const METRIC_RULES: ReadonlyArray<MetricCompletionRule> = [
  "any",
  "goal",
  "weighted",
];

function isCompletionRule(value: unknown): value is MetricCompletionRule {
  return value === "any" || value === "goal" || value === "weighted";
}

function normalizeRule(
  rule: unknown,
  fallback: MetricCompletionRule = "goal",
): MetricCompletionRule {
  return isCompletionRule(rule) && METRIC_RULES.includes(rule)
    ? rule
    : fallback;
}

function normalizeTarget(target: unknown, fallback = 1): number {
  const parsed = Number(target);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : fallback;
}

function getBinaryProgress(count: number): 0 | 1 {
  return count > 0 ? 1 : 0;
}

function getGoalProgress(
  count: number,
  target: number,
  rule: MetricCompletionRule,
): number {
  if (rule === "weighted") {
    return Math.min(count / target, 1);
  }

  if (rule === "goal") {
    return count >= target ? 1 : 0;
  }

  return getBinaryProgress(count);
}

function getMultipleHeatmapIntensity(count: number, target: number): 1 | 2 | 3 {
  const ratio = Math.min(count / target, 1);

  if (ratio >= 0.8) {
    return 3;
  }

  if (ratio >= 0.45) {
    return 2;
  }

  return 1;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function lastNDays(n: number): string[] {
  const days: string[] = [];
  const base = new Date();

  for (let i = n - 1; i >= 0; i -= 1) {
    const day = new Date(base);
    day.setDate(base.getDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }

  return days;
}

export function formatDate(date = new Date()): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getDayCount(
  habit: MetricHabit | null | undefined,
  day = todayKey(),
): number {
  return toCount(habit?.history[day]);
}

export function getDayProgress(
  habit: MetricHabit | null | undefined,
  day = todayKey(),
): number {
  if (!habit) {
    return 0;
  }

  const count = getDayCount(habit, day);
  if (habit.trackingMode !== "multiple") {
    return getBinaryProgress(count);
  }

  const target = normalizeTarget(habit.dailyTarget, 1);
  const rule = normalizeRule(habit.completionRule, "goal");
  return getGoalProgress(count, target, rule);
}

export function getHeatmapIntensity(
  habit: MetricHabit | null | undefined,
  day = todayKey(),
): 0 | 1 | 2 | 3 {
  if (!habit) {
    return 0;
  }

  const count = getDayCount(habit, day);
  if (count <= 0) {
    return 0;
  }

  if (habit.trackingMode !== "multiple") {
    return 3;
  }

  const target = normalizeTarget(habit.dailyTarget, 1);
  return getMultipleHeatmapIntensity(count, target);
}

export function getCurrentStreak(habit: MetricHabit): number {
  const days = lastNDays(365).reverse();
  let streak = 0;

  for (const day of days) {
    if (getDayProgress(habit, day) >= 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

export function getBestStreak(habit: MetricHabit): number {
  const days = lastNDays(365);
  let best = 0;
  let current = 0;

  for (const day of days) {
    if (getDayProgress(habit, day) >= 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

export function getTotalCompletions(habit: MetricHabit): number {
  return Object.values(habit.history).reduce(
    (sum: number, value: unknown) => sum + toCount(value),
    0,
  );
}
