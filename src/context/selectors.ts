import type { Habit } from "./types";
import { getDayProgress, todayKey } from "../domain/habitMetrics";

export type DailyProgressSummary = {
  totalHabits: number;
  totalProgress: number;
  percent: number;
};

export {
  selectConsistencyPercent,
  selectGlobalHeatmapAmountLabel,
  selectGlobalHeatmapIntensity,
  selectSortedHabitsByCurrentStreak,
  selectTotalCompletionsAllHabits,
} from "./statsSelectors";

function getTotalProgressForDay(habits: Habit[], day: string): number {
  return habits.reduce((sum, habit) => sum + getDayProgress(habit, day), 0);
}

export function selectHabitById(
  habits: Habit[],
  habitId: string | null | undefined,
): Habit | undefined {
  if (!habitId) {
    return undefined;
  }

  return habits.find((habit) => habit.id === habitId);
}

export function selectDailyProgressSummary(
  habits: Habit[],
  day = todayKey(),
): DailyProgressSummary {
  const totalHabits = habits.length;
  const totalProgress = getTotalProgressForDay(habits, day);

  return {
    totalHabits,
    totalProgress,
    percent: Math.round((totalProgress / Math.max(1, totalHabits)) * 100),
  };
}

export function formatDailyProgressValue(totalProgress: number): string {
  return Number.isInteger(totalProgress)
    ? String(totalProgress).padStart(2, "0")
    : totalProgress.toFixed(1);
}
