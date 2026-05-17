import { describe, expect, it } from "vitest";
import {
  resolveHydrationLocalSources,
  shouldPushHydratedSnapshot,
} from "./syncHydration";
import type { AppState, Habit } from "./types";

function createHabit(id: string): Habit {
  return {
    id,
    name: `Habit ${id}`,
    color: "#10b981",
    trackingMode: "binary",
    dailyTarget: 1,
    completionRule: "goal",
    measurement: "times",
    history: {},
    doneToday: false,
    updatedAt: "2026-05-17T12:00:00.000Z",
  };
}

function createState(overrides: Partial<AppState> = {}): AppState {
  return {
    habits: [createHabit("local-1")],
    settings: { theme: "system", push: true, email: false },
    settingsUpdatedAt: "2026-05-17T12:00:00.000Z",
    view: "home",
    activeTab: "home",
    detailId: null,
    history: [],
    syncStatus: "idle",
    syncError: null,
    lastSyncedAt: null,
    ...overrides,
  };
}

describe("resolveHydrationLocalSources", () => {
  it("uses authenticated local state when no guest snapshot is pending", () => {
    const localState = createState();

    const resolved = resolveHydrationLocalSources({
      localState,
      guestSnapshot: null,
    });

    expect(resolved.localHabitsForMerge).toEqual(localState.habits);
    expect(resolved.localSettingsForMerge).toEqual(localState.settings);
    expect(resolved.localSettingsUpdatedAtForMerge).toBe(
      localState.settingsUpdatedAt,
    );
    expect(resolved.hasGuestSnapshot).toBe(false);
  });

  it("prioritizes guest snapshot settings and merges guest+local habits", () => {
    const localState = createState({ habits: [createHabit("local-1")] });

    const resolved = resolveHydrationLocalSources({
      localState,
      guestSnapshot: {
        habits: [createHabit("guest-1")],
        settings: { theme: "dark", push: false, email: true },
        settingsUpdatedAt: "2026-05-17T12:30:00.000Z",
      },
    });

    expect(resolved.localHabitsForMerge.map((habit) => habit.id)).toEqual([
      "guest-1",
      "local-1",
    ]);
    expect(resolved.localSettingsForMerge).toEqual({
      theme: "dark",
      push: false,
      email: true,
    });
    expect(resolved.localSettingsUpdatedAtForMerge).toBe(
      "2026-05-17T12:30:00.000Z",
    );
    expect(resolved.hasGuestSnapshot).toBe(true);
  });
});

describe("shouldPushHydratedSnapshot", () => {
  it("pushes when remote is empty", () => {
    expect(
      shouldPushHydratedSnapshot({
        remoteHabitCount: 0,
        hasGuestSnapshot: false,
      }),
    ).toBe(true);
  });

  it("pushes when guest migration exists even if remote has habits", () => {
    expect(
      shouldPushHydratedSnapshot({
        remoteHabitCount: 2,
        hasGuestSnapshot: true,
      }),
    ).toBe(true);
  });

  it("skips push when remote has data and no guest migration exists", () => {
    expect(
      shouldPushHydratedSnapshot({
        remoteHabitCount: 2,
        hasGuestSnapshot: false,
      }),
    ).toBe(false);
  });
});
