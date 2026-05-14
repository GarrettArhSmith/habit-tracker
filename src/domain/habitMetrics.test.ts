import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBestStreak,
  getCurrentStreak,
  getDayCount,
  getDayProgress,
  getHeatmapIntensity,
  getTotalCompletions,
  lastNDays,
  todayKey,
  type MetricHabit,
} from "./habitMetrics";

const FROZEN_NOW = "2026-05-14T12:00:00.000Z";

function createHabit(overrides?: Partial<MetricHabit>): MetricHabit {
  return {
    trackingMode: "binary",
    dailyTarget: 1,
    completionRule: "goal",
    history: {},
    ...overrides,
  };
}

describe("habitMetrics", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FROZEN_NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns ISO day keys relative to today", () => {
    expect(todayKey()).toBe("2026-05-14");
    expect(lastNDays(3)).toEqual(["2026-05-12", "2026-05-13", "2026-05-14"]);
  });

  it("normalizes day counts from heterogeneous history values", () => {
    const habit = createHabit({
      history: {
        "2026-05-14": 3.9,
        "2026-05-13": true,
        "2026-05-12": -4,
      },
    });

    expect(getDayCount(habit, "2026-05-14")).toBe(3);
    expect(getDayCount(habit, "2026-05-13")).toBe(1);
    expect(getDayCount(habit, "2026-05-12")).toBe(0);
  });

  it("computes progress for binary and multiple tracking modes", () => {
    const binary = createHabit({ history: { "2026-05-14": true } });
    expect(getDayProgress(binary, "2026-05-14")).toBe(1);

    const multipleGoal = createHabit({
      trackingMode: "multiple",
      dailyTarget: 3,
      completionRule: "goal",
      history: { "2026-05-14": 2 },
    });
    expect(getDayProgress(multipleGoal, "2026-05-14")).toBe(0);

    const multipleWeighted = createHabit({
      trackingMode: "multiple",
      dailyTarget: 4,
      completionRule: "weighted",
      history: { "2026-05-14": 2 },
    });
    expect(getDayProgress(multipleWeighted, "2026-05-14")).toBe(0.5);
  });

  it("maps heatmap intensity from progress bands", () => {
    const binary = createHabit({ history: { "2026-05-14": 1 } });
    expect(getHeatmapIntensity(binary, "2026-05-14")).toBe(3);

    const multiple = createHabit({
      trackingMode: "multiple",
      dailyTarget: 10,
      history: {
        "2026-05-14": 2,
        "2026-05-13": 5,
        "2026-05-12": 9,
      },
    });
    expect(getHeatmapIntensity(multiple, "2026-05-14")).toBe(1);
    expect(getHeatmapIntensity(multiple, "2026-05-13")).toBe(2);
    expect(getHeatmapIntensity(multiple, "2026-05-12")).toBe(3);
  });

  it("computes current streak, best streak, and total completions", () => {
    const days = lastNDays(10);
    const d0 = days[9]!;
    const d1 = days[8]!;
    const d2 = days[7]!;
    const d3 = days[6]!;
    const d4 = days[5]!;
    const d5 = days[4]!;
    const d6 = days[3]!;
    const d7 = days[2]!;

    const habit = createHabit({
      trackingMode: "multiple",
      dailyTarget: 2,
      completionRule: "goal",
      history: {
        [d7]: 2,
        [d6]: 2,
        [d5]: 2,
        [d4]: 2,
        [d3]: 0,
        [d2]: 2,
        [d1]: 2,
        [d0]: 2,
        ignored: "not-a-count",
      },
    });

    expect(getCurrentStreak(habit)).toBe(3);
    expect(getBestStreak(habit)).toBe(4);
    expect(getTotalCompletions(habit)).toBe(14);
  });
});
