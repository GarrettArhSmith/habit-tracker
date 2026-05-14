import { useCallback, useRef } from "react";
import type { Dispatch, MutableRefObject } from "react";
import { applySyncMutation } from "./supabaseSync";
import { loadSyncQueue, updateSyncQueue } from "./syncQueue";
import type { AppAction, AppState } from "./types";

type QueueFlushParams = {
  userId: string | null;
  isAuthConfigured: boolean;
  rawDispatch: Dispatch<AppAction>;
  stateRef: MutableRefObject<AppState>;
};

function setSyncIdle(rawDispatch: Dispatch<AppAction>): void {
  rawDispatch({ type: "SET_SYNC_STATUS", status: "idle" });
  rawDispatch({
    type: "SET_LAST_SYNCED_AT",
    timestamp: new Date().toISOString(),
  });
  rawDispatch({ type: "SET_SYNC_ERROR", message: null });
}

function setSyncError(rawDispatch: Dispatch<AppAction>, message: string): void {
  rawDispatch({ type: "SET_SYNC_STATUS", status: "error" });
  rawDispatch({ type: "SET_SYNC_ERROR", message });
}

export function useFlushSyncQueue({
  userId,
  isAuthConfigured,
  rawDispatch,
  stateRef,
}: QueueFlushParams): () => Promise<void> {
  const isFlushingRef = useRef(false);

  return useCallback(async () => {
    if (!userId || !isAuthConfigured || isFlushingRef.current) {
      return;
    }

    isFlushingRef.current = true;
    rawDispatch({ type: "SET_SYNC_STATUS", status: "syncing" });

    try {
      const pending = loadSyncQueue(userId);
      const retained: typeof pending = [];

      console.debug(
        `[syncFlush] Found ${pending.length} pending mutations for user ${userId}`,
      );

      for (const mutation of pending) {
        try {
          console.debug(
            `[syncFlush] Processing ${mutation.action.type} (attempt ${mutation.attemptCount + 1})`,
          );
          await applySyncMutation({
            userId,
            action: mutation.action,
            state: stateRef.current,
          });
          console.debug(
            `[syncFlush] Successfully synced ${mutation.action.type}`,
          );
        } catch (error) {
          console.error(
            `[syncFlush] Failed to sync ${mutation.action.type}:`,
            error,
          );
          retained.push({
            ...mutation,
            attemptCount: mutation.attemptCount + 1,
          });
        }
      }

      updateSyncQueue(retained, userId);
      setSyncIdle(rawDispatch);
      console.debug(
        `[syncFlush] Queue flush complete. ${retained.length} mutations retained.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to flush sync queue.";
      console.error(`[syncFlush] Flush error: ${message}`, error);
      setSyncError(rawDispatch, message);
    } finally {
      isFlushingRef.current = false;
    }
  }, [isAuthConfigured, rawDispatch, stateRef, userId]);
}
