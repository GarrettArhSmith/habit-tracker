import type { Dispatch, SetStateAction } from "react";
import type { AppAction, Habit, HabitSettingsPatch } from "../context/types";
import {
  createDraftFromHabit,
  type HabitDraft,
  updateDraftWithPatch,
} from "./habitDetailUtils";

export function applyDraftPatch(params: {
  isEditMode: boolean;
  patch: HabitSettingsPatch;
  setDraft: Dispatch<SetStateAction<HabitDraft>>;
}): void {
  if (!params.isEditMode) {
    return;
  }

  params.setDraft((previous) => updateDraftWithPatch(previous, params.patch));
}

export function applyDraftColor(params: {
  isEditMode: boolean;
  color: string;
  setDraft: Dispatch<SetStateAction<HabitDraft>>;
}): void {
  if (!params.isEditMode) {
    return;
  }

  params.setDraft((previous) => ({ ...previous, color: params.color }));
}

export function resetDraftFromHabit(params: {
  habit: Habit;
  setDraft: Dispatch<SetStateAction<HabitDraft>>;
  setIsEditMode: Dispatch<SetStateAction<boolean>>;
}): void {
  params.setDraft(createDraftFromHabit(params.habit));
  params.setIsEditMode(false);
}

export function saveDraftToStore(params: {
  habit: Habit;
  draft: HabitDraft;
  dispatch: Dispatch<AppAction>;
  setIsEditMode: Dispatch<SetStateAction<boolean>>;
}): void {
  params.dispatch({
    type: "UPDATE_HABIT_SETTINGS",
    id: params.habit.id,
    patch: {
      trackingMode: params.draft.trackingMode,
      dailyTarget: params.draft.dailyTarget,
      completionRule: params.draft.completionRule,
      measurement: params.draft.measurement,
    },
  });

  if (params.draft.color !== params.habit.color) {
    params.dispatch({
      type: "UPDATE_HABIT_COLOR",
      id: params.habit.id,
      color: params.draft.color,
    });
  }

  params.setIsEditMode(false);
}

export function toggleEditMode(params: {
  isEditMode: boolean;
  onCancel: () => void;
  setIsEditMode: Dispatch<SetStateAction<boolean>>;
}): void {
  if (params.isEditMode) {
    params.onCancel();
    return;
  }

  params.setIsEditMode(true);
}
