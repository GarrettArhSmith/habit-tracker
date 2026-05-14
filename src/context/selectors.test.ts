import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Habit } from "./types";
import {
  formatDailyProgressValue,
  selectConsistencyPercent,
  selectDailyProgressSummary,
  selectGlobalHeatmapAmountLabel,
  selectGlobalHeatmapIntensity,
  selectHabitById,
  selectSortedHabitsByCurrentStreak,
  selectTotalCompletionsAllHabits,
} from "./selectors";

const FROZEN_NOW = "2026-05-14T12:00:00.000Z";

function createHabit(overrides: Partial<Habit>): Habit {
  return {
    id: "habit-1",
    name: "Habit",
    frequency: "Daily",
    color: "#10b981",
    trackingMode: "binary",
    dailyTarget: 1,
    completionRule: "goal",
    measurement: "times",
    history: {},
    doneToday: false,
    ...overrides,
  };
}

describe("selectors", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FROZEN_NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("selects habit by id", () => {
    const habits = [createHabit({ id: "a" }), createHabit({ id: "b" })];
    expect(selectHabitById(habits, "b")?.id).toBe("b");
    expect(selectHabitById(habits, "missing")).toBeUndefined();
  });

  it("computes daily progress summary and formatting", () => {
    const day = "2026-05-14";
    const habits = [
      createHabit({ id: "a", trackingMode: "binary", history: { [day]: 1 } }),
      createHabit({
        id: "b",
        trackingMode: "multiple",
        completionRule: "weighted",
        dailyTarget: 4,
        history: { [day]: 2 },
      }),
    ];

    const summary = selectDailyProgressSummary(habits, day);
    expect(summary.totalHabits).toBe(2);
    expect(summary.totalProgress).toBe(1.5);
    expect(summary.percent).toBe(75);
    expect(formatDailyProgressValue(summary.totalProgress)).toBe("1.5");
    expect(formatDailyProgressValue(2)).toBe("02");
  });

  it("computes global heatmap intensity and amount label", () => {
    const day = "2026-05-14";
    const habits = [
      createHabit({ id: "a", trackingMode: "binary", history: { [day]: 1 } }),
      createHabit({ id: "b", trackingMode: "binary", history: { [day]: 0 } }),
      createHabit({ id: "c", trackingMode: "binary", history: { [day]: 0 } }),
      createHabit({ id: "d", trackingMode: "binary", history: { [day]: 0 } }),
    ];

    expect(selectGlobalHeatmapIntensity(habits, day)).toBe(2);
    expect(selectGlobalHeatmapAmountLabel(habits, day)).toBe("1 / 4 habits");
  });

  it("sorts habits by current streak and sums total completions", () => {
    const habits = [
      createHabit({
        id: "short",
        history: {
          "2026-05-14": 1,
          "2026-05-13": 0,
          "2026-05-12": 1,
        },
      }),
      createHabit({
        id: "long",
        history: {
          "2026-05-14": 1,
          "2026-05-13": 1,
          "2026-05-12": 1,
        },
      }),
    ];

    const sorted = selectSortedHabitsByCurrentStreak(habits);
    expect(sorted.map((habit) => habit.id)).toEqual(["long", "short"]);
    expect(selectTotalCompletionsAllHabits(habits)).toBe(5);
  });

  it("computes consistency percent over a fixed number of days", () => {
    const habits = [
      createHabit({
        id: "consistent",
        history: {
          "2026-05-14": 1,
          "2026-05-13": 1,
          "2026-05-12": 1,
        },
      }),
    ];

    expect(selectConsistencyPercent(habits, 5)).toBe(60);
  });
});
