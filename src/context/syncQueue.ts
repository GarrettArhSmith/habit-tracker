import { getSyncQueueStorageKeyForUser } from "./config";
import type { SyncableAction } from "./types";

export type QueuedSyncMutation = {
  id: string;
  userId: string;
  action: SyncableAction;
  queuedAt: string;
  attemptCount: number;
};

export function loadSyncQueue(userId: string): QueuedSyncMutation[] {
  try {
    const raw = localStorage.getItem(getSyncQueueStorageKeyForUser(userId));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as QueuedSyncMutation[]) : [];
  } catch {
    return [];
  }
}

export function saveSyncQueue(
  queue: QueuedSyncMutation[],
  userId: string,
): void {
  try {
    localStorage.setItem(
      getSyncQueueStorageKeyForUser(userId),
      JSON.stringify(queue),
    );
  } catch {
    // Ignore queue persistence failures.
  }
}

export function enqueueSyncMutation(params: {
  action: SyncableAction;
  userId: string;
}): QueuedSyncMutation {
  const queue = loadSyncQueue(params.userId);
  const queued: QueuedSyncMutation = {
    id: crypto.randomUUID(),
    action: params.action,
    userId: params.userId,
    queuedAt: new Date().toISOString(),
    attemptCount: 0,
  };

  saveSyncQueue([...queue, queued], params.userId);

  return queued;
}

export function updateSyncQueue(
  queue: QueuedSyncMutation[],
  userId: string,
): void {
  saveSyncQueue(queue, userId);
}
