import { getDayCount, todayKey } from "../domain/habitMetrics";
import {
  normalizeRule,
  normalizeTarget,
  toNonEmptyString,
} from "../domain/habitNormalize";
import type {
  AppAction,
  AppPrimaryTab,
  AppState,
  AppView,
  CompletionRule,
  Habit,
  HabitSettingsPatch,
  TrackingMode,
} from "./types";

function isPrimaryTab(view: AppView): view is AppPrimaryTab {
  return view === "home" || view === "stats" || view === "settings";
}

function snapshot(state: AppState): {
  view: AppView;
  detailId: string | null;
  activeTab: AppPrimaryTab;
} {
  return {
    view: state.view,
    detailId: state.detailId,
    activeTab: state.activeTab,
  };
}

function mapHabitById(
  habits: Habit[],
  habitId: string,
  updater: (habit: Habit) => Habit,
): Habit[] {
  return habits.map((habit) => (habit.id === habitId ? updater(habit) : habit));
}

function withUpdatedTodayCount(
  habit: Habit,
  computeNextCount: (currentCount: number) => number,
): Habit {
  const today = todayKey();
  const currentCount = getDayCount(habit, today);
  const nextCount = Math.max(0, computeNextCount(currentCount));

  return {
    ...habit,
    doneToday: nextCount > 0,
    history: { ...habit.history, [today]: nextCount },
    updatedAt: new Date().toISOString(),
  };
}

function resolveTrackingMode(
  habit: Habit,
  patch: HabitSettingsPatch,
): TrackingMode {
  return patch.trackingMode ?? habit.trackingMode;
}

function resolveDailyTarget(habit: Habit, patch: HabitSettingsPatch): number {
  return patch.dailyTarget !== undefined
    ? normalizeTarget(patch.dailyTarget, habit.dailyTarget)
    : habit.dailyTarget;
}

function resolveCompletionRule(
  habit: Habit,
  patch: HabitSettingsPatch,
): CompletionRule {
  return patch.completionRule !== undefined
    ? normalizeRule(patch.completionRule, habit.completionRule)
    : habit.completionRule;
}

function resolveMeasurement(habit: Habit, patch: HabitSettingsPatch): string {
  return patch.measurement !== undefined
    ? toNonEmptyString(patch.measurement, habit.measurement)
    : habit.measurement;
}

function applyHabitSettingsPatch(
  habit: Habit,
  patch: HabitSettingsPatch,
): Habit {
  const next: Habit = {
    ...habit,
    trackingMode: resolveTrackingMode(habit, patch),
    dailyTarget: resolveDailyTarget(habit, patch),
    completionRule: resolveCompletionRule(habit, patch),
    measurement: resolveMeasurement(habit, patch),
  };

  return {
    ...next,
    doneToday: getDayCount(next, todayKey()) > 0,
    updatedAt: new Date().toISOString(),
  };
}

function navigateReducer(
  state: AppState,
  action: Extract<AppAction, { type: "NAVIGATE" }>,
): AppState {
  return {
    ...state,
    history: action.replace
      ? state.history
      : [...state.history, snapshot(state)],
    view: action.view,
    detailId: action.detailId ?? null,
    activeTab: isPrimaryTab(action.view) ? action.view : state.activeTab,
  };
}

function hydrateSnapshotReducer(
  state: AppState,
  action: Extract<AppAction, { type: "HYDRATE_SNAPSHOT" }>,
): AppState {
  return {
    ...state,
    habits: action.snapshot.habits,
    settings: action.snapshot.settings,
    settingsUpdatedAt: action.snapshot.settingsUpdatedAt,
    lastSyncedAt: action.snapshot.lastSyncedAt,
    syncError: null,
  };
}

function resetStateReducer(
  _state: AppState,
  action: Extract<AppAction, { type: "RESET_STATE" }>,
): AppState {
  return action.state;
}

function backReducer(state: AppState): AppState {
  const previous = state.history[state.history.length - 1];
  if (!previous) {
    return state;
  }

  return {
    ...state,
    history: state.history.slice(0, -1),
    view: previous.view,
    detailId: previous.detailId,
    activeTab: previous.activeTab,
  };
}

function toggleHabitReducer(
  state: AppState,
  action: Extract<AppAction, { type: "TOGGLE_HABIT" }>,
): AppState {
  return {
    ...state,
    habits: mapHabitById(state.habits, action.id, (habit) =>
      withUpdatedTodayCount(habit, (currentCount) =>
        currentCount > 0 ? 0 : 1,
      ),
    ),
  };
}

function adjustHabitCountReducer(
  state: AppState,
  action: Extract<AppAction, { type: "ADJUST_HABIT_COUNT" }>,
): AppState {
  return {
    ...state,
    habits: mapHabitById(state.habits, action.id, (habit) =>
      withUpdatedTodayCount(
        habit,
        (currentCount) => currentCount + action.delta,
      ),
    ),
  };
}

function createHabitReducer(
  state: AppState,
  action: Extract<AppAction, { type: "CREATE_HABIT" }>,
): AppState {
  const newHabit: Habit = {
    id: action.id ?? crypto.randomUUID(),
    name: action.name,
    color: action.color,
    trackingMode: action.trackingMode,
    dailyTarget: normalizeTarget(action.dailyTarget, 1),
    completionRule: normalizeRule(action.completionRule, "goal"),
    measurement: toNonEmptyString(action.measurement, "times"),
    history: {},
    doneToday: false,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...state,
    habits: [newHabit, ...state.habits],
    view: "home",
    detailId: null,
    activeTab: "home",
    history: [],
  };
}

function deleteHabitReducer(
  state: AppState,
  action: Extract<AppAction, { type: "DELETE_HABIT" }>,
): AppState {
  const nextHabits = state.habits.filter((habit) => habit.id !== action.id);
  const isDeletingActiveDetail = state.detailId === action.id;

  return {
    ...state,
    habits: nextHabits,
    view: isDeletingActiveDetail ? "home" : state.view,
    detailId: isDeletingActiveDetail ? null : state.detailId,
    activeTab: isDeletingActiveDetail ? "home" : state.activeTab,
    history: isDeletingActiveDetail ? [] : state.history,
  };
}

function updateHabitColorReducer(
  state: AppState,
  action: Extract<AppAction, { type: "UPDATE_HABIT_COLOR" }>,
): AppState {
  return {
    ...state,
    habits: mapHabitById(state.habits, action.id, (habit) => ({
      ...habit,
      color: action.color,
      updatedAt: new Date().toISOString(),
    })),
  };
}

function updateHabitSettingsReducer(
  state: AppState,
  action: Extract<AppAction, { type: "UPDATE_HABIT_SETTINGS" }>,
): AppState {
  return {
    ...state,
    habits: mapHabitById(state.habits, action.id, (habit) =>
      applyHabitSettingsPatch(habit, action.patch),
    ),
  };
}

function setThemeReducer(
  state: AppState,
  action: Extract<AppAction, { type: "SET_THEME" }>,
): AppState {
  return {
    ...state,
    settings: { ...state.settings, theme: action.theme },
    settingsUpdatedAt: new Date().toISOString(),
  };
}

function setNotificationReducer(
  state: AppState,
  action: Extract<AppAction, { type: "SET_NOTIF" }>,
): AppState {
  return {
    ...state,
    settings: { ...state.settings, [action.key]: action.value },
    settingsUpdatedAt: new Date().toISOString(),
  };
}

function setSyncStatusReducer(
  state: AppState,
  action: Extract<AppAction, { type: "SET_SYNC_STATUS" }>,
): AppState {
  return {
    ...state,
    syncStatus: action.status,
  };
}

function setSyncErrorReducer(
  state: AppState,
  action: Extract<AppAction, { type: "SET_SYNC_ERROR" }>,
): AppState {
  return {
    ...state,
    syncError: action.message,
  };
}

function setLastSyncedAtReducer(
  state: AppState,
  action: Extract<AppAction, { type: "SET_LAST_SYNCED_AT" }>,
): AppState {
  return {
    ...state,
    lastSyncedAt: action.timestamp,
  };
}

const REDUCER_HANDLERS: {
  [K in AppAction["type"]]: (
    state: AppState,
    action: Extract<AppAction, { type: K }>,
  ) => AppState;
} = {
  RESET_STATE: resetStateReducer,
  HYDRATE_SNAPSHOT: hydrateSnapshotReducer,
  NAVIGATE: navigateReducer,
  BACK: (state) => backReducer(state),
  TOGGLE_HABIT: toggleHabitReducer,
  ADJUST_HABIT_COUNT: adjustHabitCountReducer,
  CREATE_HABIT: createHabitReducer,
  DELETE_HABIT: deleteHabitReducer,
  UPDATE_HABIT_COLOR: updateHabitColorReducer,
  UPDATE_HABIT_SETTINGS: updateHabitSettingsReducer,
  SET_THEME: setThemeReducer,
  SET_NOTIF: setNotificationReducer,
  SET_SYNC_STATUS: setSyncStatusReducer,
  SET_SYNC_ERROR: setSyncErrorReducer,
  SET_LAST_SYNCED_AT: setLastSyncedAtReducer,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  const handler = REDUCER_HANDLERS[action.type] as (
    state: AppState,
    action: AppAction,
  ) => AppState;

  return handler(state, action);
}
