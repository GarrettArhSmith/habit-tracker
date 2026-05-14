import type { AppAction, SyncableAction } from "./types";

const SYNCABLE_ACTION_TYPES = new Set<SyncableAction["type"]>([
  "TOGGLE_HABIT",
  "ADJUST_HABIT_COUNT",
  "CREATE_HABIT",
  "DELETE_HABIT",
  "UPDATE_HABIT_COLOR",
  "UPDATE_HABIT_SETTINGS",
  "SET_THEME",
  "SET_NOTIF",
]);

export function isSyncableAction(action: AppAction): action is SyncableAction {
  return SYNCABLE_ACTION_TYPES.has(action.type as SyncableAction["type"]);
}

export function isSyncableActionValue(value: unknown): value is SyncableAction {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as { type?: unknown }).type !== "string"
  ) {
    return false;
  }

  return SYNCABLE_ACTION_TYPES.has(
    (value as { type: SyncableAction["type"] }).type,
  );
}
