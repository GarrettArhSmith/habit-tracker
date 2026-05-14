import { useEffect } from "react";
import { getStorageKeyForUser } from "./config";
import { persistSnapshot } from "./stateInit";
import type { AppState, Theme } from "./types";

export function usePersistedSnapshot(params: {
  state: AppState;
  userId: string | null;
  enabled: boolean;
}): void {
  useEffect(() => {
    if (!params.enabled) {
      return;
    }

    persistSnapshot(getStorageKeyForUser(params.userId), {
      habits: params.state.habits,
      settings: params.state.settings,
      settingsUpdatedAt: params.state.settingsUpdatedAt,
      lastSyncedAt: params.state.lastSyncedAt,
    });
  }, [
    params.enabled,
    params.state.habits,
    params.state.lastSyncedAt,
    params.state.settings,
    params.state.settingsUpdatedAt,
    params.userId,
  ]);
}

export function useThemeAttribute(theme: Theme): void {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
}

export function useOnlineQueueFlush(flushSyncQueue: () => Promise<void>): void {
  useEffect(() => {
    function handleOnline(): void {
      void flushSyncQueue();
    }

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [flushSyncQueue]);
}
