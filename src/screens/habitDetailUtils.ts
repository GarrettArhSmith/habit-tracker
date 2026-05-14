import type { Habit, HabitSettingsPatch } from "../context/types";
import {
  getBestStreak,
  getCurrentStreak,
  getTotalCompletions,
} from "../domain/habitMetrics";

export type HabitDraft = {
  color: string;
  trackingMode: Habit["trackingMode"];
  measurement: string;
  dailyTarget: number;
  completionRule: Habit["completionRule"];
};

export const DEFAULT_DRAFT: HabitDraft = {
  color: "#10b981",
  trackingMode: "binary",
  measurement: "times",
  dailyTarget: 1,
  completionRule: "goal",
};

export type HabitStats = {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
};

export function getHabitStats(habit: Habit): HabitStats {
  return {
    currentStreak: getCurrentStreak(habit),
    bestStreak: getBestStreak(habit),
    totalCompletions: getTotalCompletions(habit),
  };
}

export function hasDraftChanges(habit: Habit, draft: HabitDraft): boolean {
  return (
    draft.color !== habit.color ||
    draft.trackingMode !== habit.trackingMode ||
    draft.measurement !== habit.measurement ||
    draft.dailyTarget !== habit.dailyTarget ||
    draft.completionRule !== habit.completionRule
  );
}

export function getActivityCaption(habit: Habit): string {
  const firstDay = Object.keys(habit.history)[0] ?? Date.now();
  const monthYear = new Date(firstDay).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return `Consistent tracking since ${monthYear}`;
}

export function updateDraftWithPatch(
  previous: HabitDraft,
  patch: HabitSettingsPatch,
): HabitDraft {
  return {
    ...previous,
    ...(patch.trackingMode !== undefined
      ? { trackingMode: patch.trackingMode }
      : {}),
    ...(patch.dailyTarget !== undefined
      ? { dailyTarget: patch.dailyTarget }
      : {}),
    ...(patch.completionRule !== undefined
      ? { completionRule: patch.completionRule }
      : {}),
    ...(patch.measurement !== undefined
      ? { measurement: patch.measurement }
      : {}),
  };
}

export function createDraftFromHabit(habit: Habit): HabitDraft {
  return {
    color: habit.color,
    trackingMode: habit.trackingMode,
    measurement: habit.measurement,
    dailyTarget: habit.dailyTarget,
    completionRule: habit.completionRule,
  };
}
