import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../mocks/seedHabits", () => ({
  createSeedHabits: vi.fn(() => [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Seed Habit",
      frequency: "Daily",
      color: "#10b981",
      trackingMode: "binary",
      dailyTarget: 1,
      completionRule: "goal",
      measurement: "times",
      history: {},
      doneToday: false,
    },
  ]),
}));

import {
  isRecord,
  loadSavedState,
  normalizeSettings,
  normalizeTheme,
  resolveInitialHabits,
} from "./stateInit";

describe("stateInit", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("detects records and normalizes theme/settings fields", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord({})).toBe(true);

    expect(normalizeTheme("dark")).toBe("dark");
    expect(normalizeTheme("purple")).toBe("system");

    const normalized = normalizeSettings(
      { theme: "light", push: false, email: "yes" },
      { theme: "system", push: true, email: false },
    );

    expect(normalized).toEqual({
      theme: "light",
      push: false,
      email: false,
    });
  });

  it("loads saved state from localStorage safely", () => {
    localStorage.setItem("habitly", JSON.stringify({ hello: "world" }));
    expect(loadSavedState("habitly")).toEqual({ hello: "world" });

    localStorage.setItem("broken", "{");
    expect(loadSavedState("broken")).toBeNull();
  });

  it("prefers preview mocks when enabled and saved habits when available", async () => {
    const { createSeedHabits } = await import("../mocks/seedHabits");
    const seedHabitsMock = vi.mocked(createSeedHabits);

    const previewHabits = resolveInitialHabits({
      savedRecord: {
        habits: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            name: "Saved Habit",
            frequency: "Weekly",
            color: "#2170e4",
            trackingMode: "multiple",
            dailyTarget: 2,
            completionRule: "weighted",
            measurement: "sets",
            history: { "2026-05-14": 1 },
          },
        ],
      },
      forcePreviewMocks: true,
      fallbackColor: "#10b981",
    });

    expect(seedHabitsMock).toHaveBeenCalledTimes(1);
    expect(previewHabits[0]?.id).toBe("11111111-1111-4111-8111-111111111111");

    const savedHabits = resolveInitialHabits({
      savedRecord: {
        habits: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            name: "Saved Habit",
            frequency: "Weekly",
            color: "#2170e4",
            trackingMode: "multiple",
            dailyTarget: 2,
            completionRule: "weighted",
            measurement: "sets",
            history: { "2026-05-14": 1 },
          },
        ],
      },
      forcePreviewMocks: false,
      fallbackColor: "#10b981",
    });

    expect(savedHabits[0]).toMatchObject({
      id: "22222222-2222-4222-8222-222222222222",
      name: "Saved Habit",
      trackingMode: "multiple",
      dailyTarget: 2,
      completionRule: "weighted",
      measurement: "sets",
      doneToday: true,
    });
  });

  it("returns an empty list when saved habits are absent and preview mocks are disabled", () => {
    const habits = resolveInitialHabits({
      savedRecord: { habits: [] },
      forcePreviewMocks: false,
      fallbackColor: "#10b981",
    });

    expect(habits).toEqual([]);
  });

  it("uses preview habits when saved habits are absent and preview mocks are enabled", () => {
    const habits = resolveInitialHabits({
      savedRecord: { habits: [] },
      forcePreviewMocks: true,
      fallbackColor: "#10b981",
    });

    expect(habits[0]?.id).toBe("11111111-1111-4111-8111-111111111111");
  });
});
