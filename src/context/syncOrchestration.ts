export { useFlushSyncQueue } from "./syncFlush";
export { useHydrateFromRemote } from "./syncHydration";
export { useSyncedDispatch } from "./syncDispatch";

export function normalizeStoredTimestamp(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}
