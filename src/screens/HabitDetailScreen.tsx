import { useEffect, useState } from "react";
import { useApp } from "../context/api";
import {
  ActivityMapCard,
  AppearanceCard,
  CompletionSettingsCard,
  DetailTopBar,
  StatsGrid,
} from "./HabitDetailSections";
import {
  createDraftFromHabit,
  DEFAULT_DRAFT,
  getHabitStats,
  hasDraftChanges,
  type HabitDraft,
} from "./habitDetailUtils";
import {
  applyDraftColor,
  applyDraftPatch,
  resetDraftFromHabit,
  saveDraftToStore,
  toggleEditMode,
} from "./habitDetailActions";

export default function HabitDetailScreen(): JSX.Element | null {
  const { state, dispatchAsync } = useApp();
  const habit = state.detailId
    ? state.habits.find((item) => item.id === state.detailId)
    : undefined;
  const [isEditMode, setIsEditMode] = useState(false);
  const [draft, setDraft] = useState<HabitDraft>(DEFAULT_DRAFT);

  useEffect(() => {
    if (!habit) {
      return;
    }

    const activeHabit = habit;
    setDraft(createDraftFromHabit(activeHabit));
    setIsEditMode(false);
  }, [habit]);

  if (!habit) return null;

  const activeHabit = habit;
  const stats = getHabitStats(activeHabit);
  const hasPendingChanges = hasDraftChanges(activeHabit, draft);

  function updateHabitSettings(
    patch: Parameters<typeof applyDraftPatch>[0]["patch"],
  ): void {
    applyDraftPatch({ isEditMode, patch, setDraft });
  }

  function cancelEdits(): void {
    resetDraftFromHabit({
      habit: activeHabit,
      setDraft,
      setIsEditMode,
    });
  }

  function saveEdits(): void {
    saveDraftToStore({
      habit: activeHabit,
      draft,
      dispatch: (action) => {
        void dispatchAsync(action);
      },
      setIsEditMode,
    });
  }

  async function deleteHabit(): Promise<void> {
    const shouldDelete = window.confirm(
      `Delete "${activeHabit.name}"? This cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    await dispatchAsync({ type: "DELETE_HABIT", id: activeHabit.id });
  }

  function handleColorChange(color: string): void {
    applyDraftColor({ isEditMode, color, setDraft });
  }

  function handleEditToggle(): void {
    toggleEditMode({
      isEditMode,
      onCancel: cancelEdits,
      setIsEditMode,
    });
  }

  return (
    <div className="screen">
      <DetailTopBar
        name={habit.name}
        isEditMode={isEditMode}
        onBack={() => {
          void dispatchAsync({ type: "BACK" });
        }}
        onEditToggle={handleEditToggle}
      />

      <h2 className="habit-display-name">{habit.name}</h2>

      <StatsGrid color={habit.color} stats={stats} />

      <ActivityMapCard habit={activeHabit} />

      <AppearanceCard
        selectedColor={draft.color}
        isEditMode={isEditMode}
        onColorChange={handleColorChange}
      />

      <CompletionSettingsCard
        draft={draft}
        isEditMode={isEditMode}
        onPatchChange={updateHabitSettings}
      />

      {isEditMode ? (
        <>
          <button
            className="primary-btn"
            onClick={saveEdits}
            disabled={!hasPendingChanges}
          >
            Save Changes
          </button>
          <button className="danger-btn" onClick={() => void deleteHabit()}>
            Delete Habit
          </button>
        </>
      ) : null}
    </div>
  );
}
