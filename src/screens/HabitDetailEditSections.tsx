import ColorPicker from "../components/ColorPicker";
import type { HabitSettingsPatch } from "../context/types";
import TrackingModeToggle from "../components/TrackingModeToggle";
import MultiCompletionFields from "../components/MultiCompletionFields";
import type { HabitDraft } from "./habitDetailUtils";

type AppearanceCardProps = {
  selectedColor: string;
  isEditMode: boolean;
  onColorChange: (color: string) => void;
};

export function AppearanceCard({
  selectedColor,
  isEditMode,
  onColorChange,
}: AppearanceCardProps): JSX.Element {
  return (
    <article className="card card-stack-14">
      <h3 className="section-title-16">Habit Appearance</h3>
      <p className="t-body-sm">
        Choose a theme color to represent this habit across the app.
      </p>
      <ColorPicker
        selected={selectedColor}
        onChange={onColorChange}
        disabled={!isEditMode}
      />
    </article>
  );
}

type CompletionSettingsCardProps = {
  draft: HabitDraft;
  isEditMode: boolean;
  onPatchChange: (patch: HabitSettingsPatch) => void;
};

export function CompletionSettingsCard({
  draft,
  isEditMode,
  onPatchChange,
}: CompletionSettingsCardProps): JSX.Element {
  const isMultiple = draft.trackingMode === "multiple";

  return (
    <article className="card card-stack-14">
      <h3 className="section-title-16">Completion Settings</h3>
      <TrackingModeToggle
        trackingMode={draft.trackingMode}
        onChange={(trackingMode) => onPatchChange({ trackingMode })}
        disabled={!isEditMode}
      />
      {isMultiple ? (
        <MultiCompletionFields
          measurement={draft.measurement}
          dailyTarget={draft.dailyTarget}
          completionRule={draft.completionRule}
          onChange={onPatchChange}
          idPrefix="detail"
          disabled={!isEditMode}
        />
      ) : null}
    </article>
  );
}
