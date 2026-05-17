import { useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject } from "react";
import {
  fetchRemoteSnapshot,
  mergeHabitsByUpdatedAt,
  mergeSettingsByUpdatedAt,
  pushLocalSnapshot,
} from "./supabaseSync";
import type { AppAction, AppState } from "./types";

type GuestMigrationSnapshot = {
  habits: AppState["habits"];
  settings: AppState["settings"];
  settingsUpdatedAt: AppState["settingsUpdatedAt"];
};

export function resolveHydrationLocalSources(params: {
  localState: AppState;
  guestSnapshot: GuestMigrationSnapshot | null;
}): {
  localHabitsForMerge: AppState["habits"];
  localSettingsForMerge: AppState["settings"];
  localSettingsUpdatedAtForMerge: AppState["settingsUpdatedAt"];
  hasGuestSnapshot: boolean;
} {
  if (!params.guestSnapshot) {
    return {
      localHabitsForMerge: params.localState.habits,
      localSettingsForMerge: params.localState.settings,
      localSettingsUpdatedAtForMerge: params.localState.settingsUpdatedAt,
      hasGuestSnapshot: false,
    };
  }

  return {
    localHabitsForMerge: [
      ...params.guestSnapshot.habits,
      ...params.localState.habits,
    ],
    localSettingsForMerge: params.guestSnapshot.settings,
    localSettingsUpdatedAtForMerge: params.guestSnapshot.settingsUpdatedAt,
    hasGuestSnapshot: true,
  };
}

export function shouldPushHydratedSnapshot(params: {
  remoteHabitCount: number;
  hasGuestSnapshot: boolean;
}): boolean {
  return params.remoteHabitCount === 0 || params.hasGuestSnapshot;
}

type HydrationParams = {
  userId: string | null;
  isAuthConfigured: boolean;
  rawDispatch: Dispatch<AppAction>;
  stateRef: MutableRefObject<AppState>;
  guestMigrationRef: MutableRefObject<GuestMigrationSnapshot | null>;
  isHydratingRef: MutableRefObject<boolean>;
  onGuestMigrationCommitted: () => void;
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
  guestMigrationRef,
  isHydratingRef,
  onGuestMigrationCommitted,
  flushSyncQueue,
}: HydrationParams): void {
  const lastHydratedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (userId) {
      return;
    }

    lastHydratedUserRef.current = null;
  }, [userId]);

  useEffect(() => {
    if (
      !userId ||
      !isAuthConfigured ||
      lastHydratedUserRef.current === userId
    ) {
      return;
    }

    let cancelled = false;
    isHydratingRef.current = true;

    rawDispatch({ type: "SET_SYNC_STATUS", status: "syncing" });

    void (async () => {
      try {
        const remote = await fetchRemoteSnapshot(userId);
        if (cancelled) {
          return;
        }

        const localState = stateRef.current;
        const guestSnapshot = guestMigrationRef.current;
        const {
          localHabitsForMerge,
          localSettingsForMerge,
          localSettingsUpdatedAtForMerge,
          hasGuestSnapshot,
        } = resolveHydrationLocalSources({
          localState,
          guestSnapshot,
        });
        console.debug(
          `[Sync Hydration] Remote habits: ${remote.habits.length}, Local habits: ${localHabitsForMerge.length}`,
        );

        const mergedHabits = mergeHabitsByUpdatedAt(
          localHabitsForMerge,
          remote.habits,
        );
        const mergedSettings = mergeSettingsByUpdatedAt({
          localSettings: localSettingsForMerge,
          localSettingsUpdatedAt: localSettingsUpdatedAtForMerge,
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

        const shouldPushMergedSnapshot = shouldPushHydratedSnapshot({
          remoteHabitCount: remote.habits.length,
          hasGuestSnapshot,
        });

        if (shouldPushMergedSnapshot) {
          console.debug(
            `[Sync Hydration] Uploading ${mergedHabits.length} merged habits to Supabase`,
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

          if (hasGuestSnapshot) {
            onGuestMigrationCommitted();
          }
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
      } finally {
        isHydratingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    flushSyncQueue,
    guestMigrationRef,
    isAuthConfigured,
    isHydratingRef,
    onGuestMigrationCommitted,
    rawDispatch,
    stateRef,
    userId,
  ]);
}
