import { getDayCount, todayKey } from "./habitMetrics";
import { toCount } from "./countUtils";

export type NormalizeCompletionRule = "any" | "goal" | "weighted";
export type NormalizeTrackingMode = "binary" | "multiple";

export type NormalizeHabitHistory = Record<string, number>;

export type NormalizeHabit = {
  id: string;
  name: string;
  color: string;
  trackingMode: NormalizeTrackingMode;
  dailyTarget: number;
  completionRule: NormalizeCompletionRule;
  measurement: string;
  history: NormalizeHabitHistory;
  doneToday: boolean;
  updatedAt?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCompletionRule(value: unknown): value is NormalizeCompletionRule {
  return value === "any" || value === "goal" || value === "weighted";
}

export function toNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function normalizeTarget(target: unknown, fallback = 1): number {
  const parsed = Number(target);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : fallback;
}

export function normalizeRule(
  rule: unknown,
  fallback: NormalizeCompletionRule = "goal",
): NormalizeCompletionRule {
  return isCompletionRule(rule) ? rule : fallback;
}

function normalizeHabitId(value: unknown): string {
  if (typeof value !== "string") {
    return crypto.randomUUID();
  }

  const trimmed = value.trim();
  return UUID_PATTERN.test(trimmed) ? trimmed : crypto.randomUUID();
}

function normalizeHistory(history: unknown): NormalizeHabitHistory {
  if (!isRecord(history)) {
    return {};
  }

  const normalized: NormalizeHabitHistory = {};
  for (const [day, value] of Object.entries(history)) {
    normalized[day] = toCount(value);
  }

  return normalized;
}

function createDefaultHabit(fallbackColor: string): NormalizeHabit {
  return {
    id: crypto.randomUUID(),
    name: "Untitled Habit",

    color: fallbackColor,
    trackingMode: "binary",
    dailyTarget: 1,
    completionRule: "goal",
    measurement: "times",
    history: {},
    doneToday: false,
  };
}

function normalizeHabitRecord(
  source: Record<string, unknown>,
  fallbackColor: string,
): NormalizeHabit {
  const trackingMode: NormalizeTrackingMode =
    source.trackingMode === "multiple" ? "multiple" : "binary";
  const history = normalizeHistory(source.history);
  const normalizedUpdatedAt =
    typeof source.updatedAt === "string" && source.updatedAt.trim()
      ? source.updatedAt
      : null;
  const habit: NormalizeHabit = {
    id: normalizeHabitId(source.id),
    name: toNonEmptyString(source.name, "Untitled Habit"),

    color: toNonEmptyString(source.color, fallbackColor),
    trackingMode,
    dailyTarget: normalizeTarget(source.dailyTarget, 1),
    completionRule: normalizeRule(source.completionRule, "goal"),
    measurement: toNonEmptyString(source.measurement, "times"),
    history,
    doneToday: false,
    ...(normalizedUpdatedAt ? { updatedAt: normalizedUpdatedAt } : {}),
  };

  return {
    ...habit,
    doneToday: getDayCount(habit, todayKey()) > 0,
  };
}

export function normalizeHabit(
  source: unknown,
  fallbackColor = "#10b981",
): NormalizeHabit {
  if (!isRecord(source)) {
    return createDefaultHabit(fallbackColor);
  }

  return normalizeHabitRecord(source, fallbackColor);
}
