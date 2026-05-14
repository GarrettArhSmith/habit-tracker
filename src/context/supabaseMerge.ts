import type { AppSettings, Habit } from "./types";
import { createSeedHabits } from "../mocks/seedHabits";

const SEED_HABIT_IDS = new Set(createSeedHabits().map((habit) => habit.id));

function isPristineSeedSnapshot(localHabits: Habit[]): boolean {
  if (localHabits.length !== SEED_HABIT_IDS.size) {
    return false;
  }

  return localHabits.every(
    (habit) =>
      SEED_HABIT_IDS.has(habit.id) &&
      (typeof habit.updatedAt !== "string" || !habit.updatedAt.trim()),
  );
}

export function mergeHabitsByUpdatedAt(
  localHabits: Habit[],
  remoteHabits: Habit[],
): Habit[] {
  // If local state is just untouched seed data, prefer remote to avoid
  // duplicate-by-name habits from legacy seed IDs in cloud.
  if (remoteHabits.length > 0 && isPristineSeedSnapshot(localHabits)) {
    return remoteHabits;
  }

  const localById = new Map(localHabits.map((habit) => [habit.id, habit]));

  for (const remoteHabit of remoteHabits) {
    const localHabit = localById.get(remoteHabit.id);

    if (!localHabit) {
      localById.set(remoteHabit.id, remoteHabit);
      continue;
    }

    const localUpdatedAt = Date.parse(localHabit.updatedAt ?? "");
    const remoteUpdatedAt = Date.parse(remoteHabit.updatedAt ?? "");

    if (
      Number.isFinite(remoteUpdatedAt) &&
      (!Number.isFinite(localUpdatedAt) || remoteUpdatedAt >= localUpdatedAt)
    ) {
      localById.set(remoteHabit.id, remoteHabit);
    }
  }

  return [...localById.values()];
}

export function mergeSettingsByUpdatedAt(params: {
  localSettings: AppSettings;
  localSettingsUpdatedAt: string | null;
  remoteSettings: AppSettings | null;
  remoteSettingsUpdatedAt: string | null;
}): { settings: AppSettings; settingsUpdatedAt: string | null } {
  if (!params.remoteSettings) {
    return {
      settings: params.localSettings,
      settingsUpdatedAt: params.localSettingsUpdatedAt,
    };
  }

  const localUpdatedAt = Date.parse(params.localSettingsUpdatedAt ?? "");
  const remoteUpdatedAt = Date.parse(params.remoteSettingsUpdatedAt ?? "");

  if (
    Number.isFinite(remoteUpdatedAt) &&
    (!Number.isFinite(localUpdatedAt) || remoteUpdatedAt >= localUpdatedAt)
  ) {
    return {
      settings: params.remoteSettings,
      settingsUpdatedAt: params.remoteSettingsUpdatedAt,
    };
  }

  return {
    settings: params.localSettings,
    settingsUpdatedAt: params.localSettingsUpdatedAt,
  };
}
