import { useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject } from "react";
import {
  fetchRemoteSnapshot,
  mergeHabitsByUpdatedAt,
  mergeSettingsByUpdatedAt,
  pushLocalSnapshot,
} from "./supabaseSync";
import type { AppAction, AppState } from "./types";

type HydrationParams = {
  userId: string | null;
  isAuthConfigured: boolean;
  rawDispatch: Dispatch<AppAction>;
  stateRef: MutableRefObject<AppState>;
  flushSyncQueue: () => Promise<void>;
};

function setSyncError(rawDispatch: Dispatch<AppAction>, message: string): void {
  rawDispatch({ type: "SET_SYNC_STATUS", status: "error" });
  rawDispatch({ type: "SET_SYNC_ERROR", message });
}

export function useHydrateFromRemote({
  userId,
  isAuthConfigured,
  rawDispatch,
  stateRef,
  flushSyncQueue,
}: HydrationParams): void {
  const lastHydratedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !userId ||
      !isAuthConfigured ||
      lastHydratedUserRef.current === userId
    ) {
      return;
    }

    let cancelled = false;

    rawDispatch({ type: "SET_SYNC_STATUS", status: "syncing" });

    void (async () => {
      try {
        const remote = await fetchRemoteSnapshot(userId);
        if (cancelled) {
          return;
        }

        const localState = stateRef.current;
        console.debug(
          `[Sync Hydration] Remote habits: ${remote.habits.length}, Local habits: ${localState.habits.length}`,
        );

        const mergedHabits = mergeHabitsByUpdatedAt(
          localState.habits,
          remote.habits,
        );
        const mergedSettings = mergeSettingsByUpdatedAt({
          localSettings: localState.settings,
          localSettingsUpdatedAt: localState.settingsUpdatedAt,
          remoteSettings: remote.settings,
          remoteSettingsUpdatedAt: remote.settingsUpdatedAt,
        });

        console.debug(`[Sync Hydration] Merged habits: ${mergedHabits.length}`);

        rawDispatch({
          type: "HYDRATE_SNAPSHOT",
          snapshot: {
            habits: mergedHabits,
            settings: mergedSettings.settings,
            settingsUpdatedAt: mergedSettings.settingsUpdatedAt,
            lastSyncedAt: new Date().toISOString(),
          },
        });

        if (remote.habits.length === 0) {
          console.debug(
            `[Sync Hydration] Remote is empty, uploading ${mergedHabits.length} local habits to Supabase`,
          );
          await pushLocalSnapshot({
            userId,
            state: {
              ...localState,
              habits: mergedHabits,
              settings: mergedSettings.settings,
              settingsUpdatedAt: mergedSettings.settingsUpdatedAt,
            },
          });
          console.debug("[Sync Hydration] Upload complete");
        } else {
          console.debug(
            "[Sync Hydration] Remote has data, skipping local upload",
          );
        }

        lastHydratedUserRef.current = userId;
        rawDispatch({ type: "SET_SYNC_STATUS", status: "idle" });
        rawDispatch({ type: "SET_SYNC_ERROR", message: null });
        void flushSyncQueue();
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Failed to sync from Supabase.";
        console.error(`[Sync Hydration Error] ${message}`, error);
        setSyncError(rawDispatch, message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [flushSyncQueue, isAuthConfigured, rawDispatch, stateRef, userId]);
}
