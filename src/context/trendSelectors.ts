import type { Habit } from "./types";
import {
  getCurrentStreak,
  getDayProgress,
  getTotalCompletions,
  lastNDays,
} from "../domain/habitMetrics";

export function selectSortedHabitsByCurrentStreak(habits: Habit[]): Habit[] {
  return [...habits].sort(
    (left, right) => getCurrentStreak(right) - getCurrentStreak(left),
  );
}

export function selectTotalCompletionsAllHabits(habits: Habit[]): number {
  return habits.reduce((sum, habit) => sum + getTotalCompletions(habit), 0);
}

export function selectConsistencyPercent(habits: Habit[], days = 30): number {
  const dayKeys = lastNDays(days);
  const activeDays = dayKeys.filter((day) =>
    habits.some((habit) => getDayProgress(habit, day) > 0),
  ).length;

  return Math.round((activeDays / Math.max(1, days)) * 100);
}
