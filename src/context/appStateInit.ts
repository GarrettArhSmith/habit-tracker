import {
  DEFAULT_SETTINGS,
  FORCE_PREVIEW_MOCKS,
  getStorageKeyForUser,
} from "./config";
import {
  isRecord,
  loadSavedState,
  normalizeSettings,
  resolveInitialHabits,
} from "./stateInit";
import { normalizeStoredTimestamp } from "./syncOrchestration";
import type { AppState } from "./types";

export function getInitialStateForUser(userId: string | null): AppState {
  const saved = loadSavedState(getStorageKeyForUser(userId));
  const savedRecord = isRecord(saved) ? saved : null;

  return {
    habits: resolveInitialHabits({
      savedRecord,
      forcePreviewMocks: FORCE_PREVIEW_MOCKS,
    }),
    settings: normalizeSettings(savedRecord?.settings, DEFAULT_SETTINGS),
    settingsUpdatedAt: normalizeStoredTimestamp(savedRecord?.settingsUpdatedAt),
    view: "home",
    activeTab: "home",
    detailId: null,
    history: [],
    syncStatus: "idle",
    syncError: null,
    lastSyncedAt: normalizeStoredTimestamp(savedRecord?.lastSyncedAt),
  };
}

export function getInitialState(): AppState {
  return getInitialStateForUser(null);
}
