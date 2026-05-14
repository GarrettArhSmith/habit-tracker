import type { Dispatch } from "react";

export type Theme = "light" | "dark" | "system";
export type TrackingMode = "binary" | "multiple";
export type CompletionRule = "any" | "goal" | "weighted";
export type AppPrimaryTab = "home" | "stats" | "settings";
export type AppView = AppPrimaryTab | "detail" | "newHabit";

export type ColorPreset = {
  name: string;
  value: string;
};

export type HabitHistory = Record<string, number>;

export type Habit = {
  id: string;
  name: string;
  color: string;
  trackingMode: TrackingMode;
  dailyTarget: number;
  completionRule: CompletionRule;
  measurement: string;
  history: HabitHistory;
  doneToday: boolean;
  updatedAt?: string;
};

export type AppSettings = {
  theme: Theme;
  push: boolean;
  email: boolean;
};

export type SyncStatus = "idle" | "syncing" | "error";

export type NavigationSnapshot = {
  view: AppView;
  detailId: string | null;
  activeTab: AppPrimaryTab;
};

export type AppState = {
  habits: Habit[];
  settings: AppSettings;
  settingsUpdatedAt: string | null;
  view: AppView;
  activeTab: AppPrimaryTab;
  detailId: string | null;
  history: NavigationSnapshot[];
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: string | null;
};

export type HabitSettingsPatch = {
  trackingMode?: TrackingMode;
  dailyTarget?: number;
  completionRule?: CompletionRule;
  measurement?: string;
};

export type AppAction =
  | { type: "RESET_STATE"; state: AppState }
  | {
      type: "HYDRATE_SNAPSHOT";
      snapshot: {
        habits: Habit[];
        settings: AppSettings;
        settingsUpdatedAt: string | null;
        lastSyncedAt: string | null;
      };
    }
  | {
      type: "NAVIGATE";
      view: AppView;
      detailId?: string | null;
      replace?: boolean;
    }
  | { type: "BACK" }
  | { type: "TOGGLE_HABIT"; id: string }
  | { type: "ADJUST_HABIT_COUNT"; id: string; delta: number }
  | {
      type: "CREATE_HABIT";
      id?: string;
      name: string;
      color: string;
      trackingMode: TrackingMode;
      measurement: string;
      dailyTarget: number;
      completionRule: CompletionRule;
    }
  | { type: "DELETE_HABIT"; id: string }
  | { type: "UPDATE_HABIT_COLOR"; id: string; color: string }
  | { type: "UPDATE_HABIT_SETTINGS"; id: string; patch: HabitSettingsPatch }
  | { type: "SET_THEME"; theme: Theme }
  | { type: "SET_NOTIF"; key: "push" | "email"; value: boolean }
  | { type: "SET_SYNC_STATUS"; status: SyncStatus }
  | { type: "SET_SYNC_ERROR"; message: string | null }
  | { type: "SET_LAST_SYNCED_AT"; timestamp: string | null };

export type SyncableAction = Exclude<
  AppAction,
  | { type: "RESET_STATE" }
  | { type: "HYDRATE_SNAPSHOT" }
  | { type: "NAVIGATE" }
  | { type: "BACK" }
  | { type: "SET_SYNC_STATUS" }
  | { type: "SET_SYNC_ERROR" }
  | { type: "SET_LAST_SYNCED_AT" }
>;

export type AppContextValue = {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  dispatchAsync: (action: AppAction) => Promise<void>;
};
