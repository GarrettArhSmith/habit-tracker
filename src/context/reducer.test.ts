import { describe, expect, it, vi } from "vitest";
import type { AppState, Habit } from "./types";
import { appReducer } from "./reducer";

function createHabit(overrides: Partial<Habit> = {}): Habit {
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

function createState(overrides: Partial<AppState> = {}): AppState {
  return {
    habits: [createHabit()],
    settings: { theme: "system", push: true, email: false },
    settingsUpdatedAt: null,
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

describe("appReducer", () => {
  it("navigates and restores history on back", () => {
    const initial = createState();

    const detailed = appReducer(initial, {
      type: "NAVIGATE",
      view: "detail",
      detailId: "habit-1",
    });

    expect(detailed.view).toBe("detail");
    expect(detailed.detailId).toBe("habit-1");
    expect(detailed.activeTab).toBe("home");
    expect(detailed.history).toHaveLength(1);

    const back = appReducer(detailed, { type: "BACK" });
    expect(back.view).toBe("home");
    expect(back.detailId).toBeNull();
    expect(back.activeTab).toBe("home");
    expect(back.history).toHaveLength(0);
  });

  it("toggles and adjusts today's habit count", () => {
    const habit = createHabit({
      history: { "2026-05-14": 0 },
      doneToday: false,
    });
    const state = createState({ habits: [habit] });

    const toggled = appReducer(state, { type: "TOGGLE_HABIT", id: habit.id });
    expect(toggled.habits[0]?.history["2026-05-14"]).toBe(1);
    expect(toggled.habits[0]?.doneToday).toBe(true);

    const adjustedDown = appReducer(toggled, {
      type: "ADJUST_HABIT_COUNT",
      id: habit.id,
      delta: -5,
    });
    expect(adjustedDown.habits[0]?.history["2026-05-14"]).toBe(0);
    expect(adjustedDown.habits[0]?.doneToday).toBe(false);
  });

  it("creates habits with normalized fields and resets navigation state", () => {
    const randomUuid = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("11111111-1111-4111-8111-111111111111");
    const state = createState({
      view: "detail",
      detailId: "habit-1",
      activeTab: "home",
      history: [{ view: "home", detailId: null, activeTab: "home" }],
    });

    const next = appReducer(state, {
      type: "CREATE_HABIT",
      name: "  Focus  ",
      frequency: "Weekly",
      color: "#2170e4",
      trackingMode: "multiple",
      measurement: "  reps  ",
      dailyTarget: 3.8,
      completionRule: "weighted",
    });

    expect(next.habits[0]).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      name: "  Focus  ",
      frequency: "Weekly",
      color: "#2170e4",
      trackingMode: "multiple",
      dailyTarget: 3,
      completionRule: "weighted",
      measurement: "reps",
      doneToday: false,
    });
    expect(next.view).toBe("home");
    expect(next.detailId).toBeNull();
    expect(next.activeTab).toBe("home");
    expect(next.history).toEqual([]);

    randomUuid.mockRestore();
  });

  it("deletes habits and exits detail view when removing active habit", () => {
    const state = createState({
      view: "detail",
      detailId: "habit-1",
      history: [{ view: "home", detailId: null, activeTab: "home" }],
    });

    const next = appReducer(state, { type: "DELETE_HABIT", id: "habit-1" });

    expect(next.habits).toHaveLength(0);
    expect(next.view).toBe("home");
    expect(next.detailId).toBeNull();
    expect(next.activeTab).toBe("home");
    expect(next.history).toEqual([]);
  });

  it("updates habit color, settings, and habit settings patches", () => {
    const habit = createHabit({
      trackingMode: "binary",
      dailyTarget: 1,
      completionRule: "goal",
      measurement: "times",
    });
    const state = createState({ habits: [habit] });

    const recolored = appReducer(state, {
      type: "UPDATE_HABIT_COLOR",
      id: habit.id,
      color: "#f59e0b",
    });
    expect(recolored.habits[0]?.color).toBe("#f59e0b");

    const patched = appReducer(recolored, {
      type: "UPDATE_HABIT_SETTINGS",
      id: habit.id,
      patch: {
        trackingMode: "multiple",
        dailyTarget: 4.6,
        completionRule: "weighted",
        measurement: "  sets  ",
      },
    });
    expect(patched.habits[0]).toMatchObject({
      trackingMode: "multiple",
      dailyTarget: 4,
      completionRule: "weighted",
      measurement: "sets",
    });

    const themed = appReducer(patched, { type: "SET_THEME", theme: "dark" });
    expect(themed.settings.theme).toBe("dark");

    const notifs = appReducer(themed, {
      type: "SET_NOTIF",
      key: "email",
      value: true,
    });
    expect(notifs.settings.email).toBe(true);
  });

  it("updates sync metadata and hydrates merged snapshots", () => {
    const state = createState();

    const syncing = appReducer(state, {
      type: "SET_SYNC_STATUS",
      status: "syncing",
    });
    expect(syncing.syncStatus).toBe("syncing");

    const withError = appReducer(syncing, {
      type: "SET_SYNC_ERROR",
      message: "Network down",
    });
    expect(withError.syncError).toBe("Network down");

    const hydrated = appReducer(withError, {
      type: "HYDRATE_SNAPSHOT",
      snapshot: {
        habits: [createHabit({ id: "habit-2", name: "Hydrated" })],
        settings: { theme: "dark", push: false, email: true },
        settingsUpdatedAt: "2026-05-14T10:00:00.000Z",
        lastSyncedAt: "2026-05-14T10:01:00.000Z",
      },
    });

    expect(hydrated.habits[0]?.id).toBe("habit-2");
    expect(hydrated.settings.theme).toBe("dark");
    expect(hydrated.settingsUpdatedAt).toBe("2026-05-14T10:00:00.000Z");
    expect(hydrated.lastSyncedAt).toBe("2026-05-14T10:01:00.000Z");
    expect(hydrated.syncError).toBeNull();
  });
});
