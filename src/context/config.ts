import type { AppSettings } from "./types";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  push: true,
  email: false,
};

// Defaults to preview mocks unless explicitly disabled via VITE_FORCE_PREVIEW_MOCKS=false.
export const FORCE_PREVIEW_MOCKS =
  import.meta.env.VITE_FORCE_PREVIEW_MOCKS !== "false";

export const STORAGE_KEY = "habitly-v2";
export const SYNC_QUEUE_STORAGE_KEY = "habitly-sync-queue-v1";
export const ANON_STORAGE_KEY = `${STORAGE_KEY}:anon`;

export function getStorageKeyForUser(userId: string | null): string {
  if (!userId) {
    return ANON_STORAGE_KEY;
  }

  return `${STORAGE_KEY}:${userId}`;
}

export function getSyncQueueStorageKeyForUser(userId: string): string {
  return `${SYNC_QUEUE_STORAGE_KEY}:${userId}`;
}

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
export const SUPABASE_PUBLISHABLE_KEY = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ""
).trim();

export const IS_SUPABASE_CONFIGURED =
  SUPABASE_URL.length > 0 && SUPABASE_PUBLISHABLE_KEY.length > 0;
