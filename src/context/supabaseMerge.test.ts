import { describe, expect, it } from "vitest";
import { createSeedHabits } from "../mocks/seedHabits";
import { mergeHabitsByUpdatedAt } from "./supabaseMerge";
import type { Habit } from "./types";

describe("mergeHabitsByUpdatedAt", () => {
  it("prefers remote habits when local is pristine seed snapshot", () => {
    const localSeeds = createSeedHabits() as Habit[];
    const remoteHabits: Habit[] = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Morning Meditation",
        frequency: "Daily",
        color: "#10b981",
        trackingMode: "binary",
        dailyTarget: 1,
        completionRule: "goal",
        measurement: "times",
        history: {},
        doneToday: false,
        updatedAt: "2026-05-14T17:30:05.168Z",
      },
    ];

    const merged = mergeHabitsByUpdatedAt(localSeeds, remoteHabits);

    expect(merged).toEqual(remoteHabits);
  });

  it("keeps local-only habits when local is not pristine seed snapshot", () => {
    const localHabit: Habit = {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Custom Habit",
      frequency: "Daily",
      color: "#10b981",
      trackingMode: "binary",
      dailyTarget: 1,
      completionRule: "goal",
      measurement: "times",
      history: {},
      doneToday: false,
      updatedAt: "2026-05-14T12:00:00.000Z",
    };
    const remoteHabit: Habit = {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Remote Habit",
      frequency: "Daily",
      color: "#2170e4",
      trackingMode: "binary",
      dailyTarget: 1,
      completionRule: "goal",
      measurement: "times",
      history: {},
      doneToday: false,
      updatedAt: "2026-05-14T13:00:00.000Z",
    };

    const merged = mergeHabitsByUpdatedAt([localHabit], [remoteHabit]);

    expect(merged).toHaveLength(2);
    expect(merged.find((habit) => habit.id === localHabit.id)).toBeDefined();
    expect(merged.find((habit) => habit.id === remoteHabit.id)).toBeDefined();
  });
});
