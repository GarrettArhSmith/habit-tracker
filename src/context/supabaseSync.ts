import type { AppSettings, AppState, Habit, SyncableAction } from "./types";
import { normalizeRule, normalizeTarget } from "../domain/habitNormalize";
import { supabase } from "./supabaseClient";
export {
  mergeHabitsByUpdatedAt,
  mergeSettingsByUpdatedAt,
} from "./supabaseMerge";

type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  frequency: string;
  color: string;
  tracking_mode: "binary" | "multiple";
  daily_target: number;
  completion_rule: "any" | "goal" | "weighted";
  measurement: string;
  history: Record<string, number>;
  done_today: boolean;
  updated_at: string;
};

type SettingsRow = {
  user_id: string;
  theme: "light" | "dark" | "system";
  push: boolean;
  email: boolean;
  updated_at: string;
};

export type RemoteSnapshot = {
  habits: Habit[];
  settings: AppSettings | null;
  settingsUpdatedAt: string | null;
};

function isHabitMutation(
  action: SyncableAction,
): action is Extract<
  SyncableAction,
  | { type: "TOGGLE_HABIT" }
  | { type: "ADJUST_HABIT_COUNT" }
  | { type: "UPDATE_HABIT_COLOR" }
  | { type: "UPDATE_HABIT_SETTINGS" }
> {
  return (
    action.type === "TOGGLE_HABIT" ||
    action.type === "ADJUST_HABIT_COUNT" ||
    action.type === "UPDATE_HABIT_COLOR" ||
    action.type === "UPDATE_HABIT_SETTINGS"
  );
}

async function deleteHabitById(params: {
  userId: string;
  habitId: string;
}): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("user_id", params.userId)
    .eq("id", params.habitId);

  if (error) {
    throw new Error(error.message);
  }
}

function isSettingsMutation(
  action: SyncableAction,
): action is Extract<
  SyncableAction,
  { type: "SET_THEME" } | { type: "SET_NOTIF" }
> {
  return action.type === "SET_THEME" || action.type === "SET_NOTIF";
}

function toHabitRow(userId: string, habit: Habit): HabitRow {
  return {
    id: habit.id,
    user_id: userId,
    name: habit.name,
    frequency: habit.frequency,
    color: habit.color,
    tracking_mode: habit.trackingMode,
    daily_target: habit.dailyTarget,
    completion_rule: habit.completionRule,
    measurement: habit.measurement,
    history: habit.history,
    done_today: habit.doneToday,
    updated_at: habit.updatedAt ?? new Date().toISOString(),
  };
}

function fromHabitRow(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    frequency: row.frequency,
    color: row.color,
    trackingMode: row.tracking_mode,
    dailyTarget: row.daily_target,
    completionRule: row.completion_rule,
    measurement: row.measurement,
    history: row.history ?? {},
    doneToday: row.done_today,
    updatedAt: row.updated_at,
  };
}

export async function fetchRemoteSnapshot(
  userId: string,
): Promise<RemoteSnapshot> {
  if (!supabase) {
    console.warn("[fetchRemoteSnapshot] Supabase client not available");
    return {
      habits: [],
      settings: null,
      settingsUpdatedAt: null,
    };
  }

  console.debug(`[fetchRemoteSnapshot] Fetching for user: ${userId}`);
  const [habitsResult, settingsResult] = await Promise.all([
    supabase.from("habits").select("*").eq("user_id", userId),
    supabase.from("settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (habitsResult.error) {
    console.error(
      "[fetchRemoteSnapshot] Habits fetch error:",
      habitsResult.error,
    );
    throw new Error(habitsResult.error.message);
  }

  if (settingsResult.error) {
    console.error(
      "[fetchRemoteSnapshot] Settings fetch error:",
      settingsResult.error,
    );
    throw new Error(settingsResult.error.message);
  }

  const habitsRows = (habitsResult.data ?? []) as HabitRow[];
  const settingsRow = (settingsResult.data ?? null) as SettingsRow | null;

  console.debug(`[fetchRemoteSnapshot] Fetched ${habitsRows.length} habits`);

  return {
    habits: habitsRows.map((row) => fromHabitRow(row)),
    settings: settingsRow
      ? {
          theme: settingsRow.theme,
          push: settingsRow.push,
          email: settingsRow.email,
        }
      : null,
    settingsUpdatedAt: settingsRow?.updated_at ?? null,
  };
}

function findHabitOrThrow(state: AppState, habitId: string): Habit {
  const habit = state.habits.find((candidate) => candidate.id === habitId);

  if (!habit) {
    throw new Error(`Habit ${habitId} was not found in local state.`);
  }

  return habit;
}

async function syncHabitById(params: {
  userId: string;
  habitId: string;
  state: AppState;
}): Promise<void> {
  if (!supabase) {
    return;
  }

  const habit = findHabitOrThrow(params.state, params.habitId);
  const row = toHabitRow(params.userId, habit);
  const { error } = await supabase.from("habits").upsert(row);

  if (error) {
    throw new Error(error.message);
  }
}

async function syncSettings(params: {
  userId: string;
  settings: AppSettings;
  settingsUpdatedAt: string | null;
}): Promise<void> {
  if (!supabase) {
    return;
  }

  const updatedAt = params.settingsUpdatedAt ?? new Date().toISOString();
  const { error } = await supabase.from("settings").upsert({
    user_id: params.userId,
    theme: params.settings.theme,
    push: params.settings.push,
    email: params.settings.email,
    updated_at: updatedAt,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function applySyncMutation(params: {
  userId: string;
  action: SyncableAction;
  state: AppState;
}): Promise<void> {
  if (params.action.type === "CREATE_HABIT") {
    const createdId =
      params.action.id ?? params.state.habits[0]?.id ?? crypto.randomUUID();

    const createdFromState = params.state.habits.find(
      (habit) => habit.id === createdId,
    );

    if (createdFromState) {
      console.debug(
        `[applySyncMutation] Creating habit from state: ${createdFromState.name} (${createdFromState.id})`,
      );
      await syncHabitById({
        userId: params.userId,
        habitId: createdFromState.id,
        state: params.state,
      });
      console.debug(`[applySyncMutation] Habit created successfully`);
      return;
    }

    const createdRow: HabitRow = {
      id: createdId,
      user_id: params.userId,
      name: params.action.name,
      frequency: params.action.frequency,
      color: params.action.color,
      tracking_mode: params.action.trackingMode,
      daily_target: normalizeTarget(params.action.dailyTarget, 1),
      completion_rule: normalizeRule(params.action.completionRule, "goal"),
      measurement: params.action.measurement,
      history: {},
      done_today: false,
      updated_at: new Date().toISOString(),
    };

    if (!supabase) {
      return;
    }

    console.debug(
      `[applySyncMutation] Creating habit from action payload: ${createdRow.name} (${createdRow.id})`,
    );
    const { error } = await supabase.from("habits").upsert(createdRow);

    if (error) {
      throw new Error(error.message);
    }

    console.debug(`[applySyncMutation] Habit created successfully`);
    return;
  }

  if (params.action.type === "DELETE_HABIT") {
    console.debug(`[applySyncMutation] Deleting habit: ${params.action.id}`);
    await deleteHabitById({
      userId: params.userId,
      habitId: params.action.id,
    });
    console.debug(`[applySyncMutation] Habit deleted successfully`);
    return;
  }

  if (isHabitMutation(params.action)) {
    console.debug(
      `[applySyncMutation] Updating habit: ${params.action.id} (${params.action.type})`,
    );
    await syncHabitById({
      userId: params.userId,
      habitId: params.action.id,
      state: params.state,
    });
    console.debug(`[applySyncMutation] Habit updated successfully`);
    return;
  }

  if (isSettingsMutation(params.action)) {
    console.debug(
      `[applySyncMutation] Syncing settings: ${params.action.type}`,
    );
    await syncSettings({
      userId: params.userId,
      settings: params.state.settings,
      settingsUpdatedAt: params.state.settingsUpdatedAt,
    });
  }
}

export async function pushLocalSnapshot(params: {
  userId: string;
  state: AppState;
}): Promise<void> {
  if (!supabase) {
    console.warn("[pushLocalSnapshot] Supabase client not available");
    return;
  }

  const habitRows = params.state.habits.map((habit) =>
    toHabitRow(params.userId, habit),
  );

  if (habitRows.length > 0) {
    console.debug(`[pushLocalSnapshot] Uploading ${habitRows.length} habits`);
    const { error: habitsError } = await supabase
      .from("habits")
      .upsert(habitRows);

    if (habitsError) {
      console.error("[pushLocalSnapshot] Habits upsert error:", habitsError);
      throw new Error(habitsError.message);
    }
    console.debug("[pushLocalSnapshot] Habits uploaded successfully");
  } else {
    console.debug("[pushLocalSnapshot] No habits to upload");
  }

  await syncSettings({
    userId: params.userId,
    settings: params.state.settings,
    settingsUpdatedAt: params.state.settingsUpdatedAt,
  });
  console.debug("[pushLocalSnapshot] Settings synced");
}
