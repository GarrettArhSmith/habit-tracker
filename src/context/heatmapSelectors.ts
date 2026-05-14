import type { Habit } from "./types";
import { getDayProgress } from "../domain/habitMetrics";

function getTotalProgressForDay(habits: Habit[], day: string): number {
  return habits.reduce((sum, habit) => sum + getDayProgress(habit, day), 0);
}

export function selectGlobalHeatmapIntensity(
  habits: Habit[],
  day: string,
): 0 | 1 | 2 | 3 | 4 {
  const totalProgress = getTotalProgressForDay(habits, day);
  const ratio = totalProgress / Math.max(1, habits.length);

  if (ratio >= 0.85) {
    return 4;
  }

  if (ratio >= 0.55) {
    return 3;
  }

  if (ratio >= 0.25) {
    return 2;
  }

  if (ratio > 0) {
    return 1;
  }

  return 0;
}

export function selectGlobalHeatmapAmountLabel(
  habits: Habit[],
  day: string,
): string {
  const totalProgress = getTotalProgressForDay(habits, day);
  const amount = Number.isInteger(totalProgress)
    ? totalProgress
    : Number(totalProgress.toFixed(1));

  return `${amount} / ${Math.max(1, habits.length)} habits`;
}
