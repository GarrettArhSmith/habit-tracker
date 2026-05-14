import { useCallback } from "react";
import type { Dispatch } from "react";
import { isSyncableAction } from "./syncActions";
import { enqueueSyncMutation } from "./syncQueue";
import type { AppAction } from "./types";

type SyncedDispatchParams = {
  rawDispatch: Dispatch<AppAction>;
  userId: string | null;
  flushSyncQueue: () => Promise<void>;
};

export function useSyncedDispatch({
  rawDispatch,
  userId,
  flushSyncQueue,
}: SyncedDispatchParams): Dispatch<AppAction> {
  return useCallback(
    (action: AppAction) => {
      const actionForDispatch: AppAction =
        action.type === "CREATE_HABIT" && !action.id
          ? { ...action, id: crypto.randomUUID() }
          : action;

      rawDispatch(actionForDispatch);

      if (!userId || !isSyncableAction(actionForDispatch)) {
        return;
      }

      console.debug(
        `[syncDispatch] Queuing ${actionForDispatch.type} for user ${userId}`,
      );
      enqueueSyncMutation({ action: actionForDispatch, userId });
      void flushSyncQueue().then(() => {
        console.debug(
          `[syncDispatch] Flushed queue after ${actionForDispatch.type}`,
        );
      });
    },
    [flushSyncQueue, rawDispatch, userId],
  );
}
