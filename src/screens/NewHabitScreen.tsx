import { useState } from "react";
import {
  X,
  CircleUser,
  CalendarDays,
  CalendarRange,
  Lightbulb,
} from "lucide-react";
import { useApp } from "../context/api";
import ColorPicker from "../components/ColorPicker";
import type { CompletionRule, TrackingMode } from "../context/types";
import type { LucideIcon } from "lucide-react";
import MultiCompletionFields from "../components/MultiCompletionFields";
import { COLOR_PRESETS } from "../constants/colors";

function withActiveClass(baseClassName: string, isActive: boolean): string {
  return isActive ? `${baseClassName} active` : baseClassName;
}

type FrequencyOption = {
  label: string;
  value: string;
  Icon: LucideIcon;
};

type CreateHabitAction = {
  type: "CREATE_HABIT";
  name: string;
  frequency: string;
  color: string;
  trackingMode: TrackingMode;
  measurement: string;
  dailyTarget: number;
  completionRule: CompletionRule;
};

function canCreateHabit(
  name: string,
  isMultiple: boolean,
  measurement: string,
): boolean {
  if (!name.trim()) {
    return false;
  }

  return !isMultiple || Boolean(measurement.trim());
}

function buildCreateHabitAction(input: {
  name: string;
  frequency: string;
  color: string;
  trackingMode: TrackingMode;
  measurement: string;
  dailyTarget: number;
  completionRule: CompletionRule;
}): CreateHabitAction {
  const trimmedName = input.name.trim();
  return {
    type: "CREATE_HABIT",
    name: trimmedName,
    frequency: input.frequency,
    color: input.color,
    trackingMode: input.trackingMode,
    measurement: input.measurement,
    dailyTarget: input.dailyTarget,
    completionRule: input.completionRule,
  };
}

function getDefaultHabitColor(): string {
  const firstPreset = COLOR_PRESETS[0];
  return firstPreset ? firstPreset.value : "#10b981";
}

function getSelectedPresetName(color: string): string {
  const selectedPreset = COLOR_PRESETS.find((preset) => preset.value === color);
  return selectedPreset ? selectedPreset.name : "Custom";
}

type MultiCompletionSettingsProps = {
  measurement: string;
  dailyTarget: number;
  completionRule: CompletionRule;
  onChange: (patch: {
    measurement?: string;
    dailyTarget?: number;
    completionRule?: CompletionRule;
  }) => void;
};

type FrequencySelectorProps = {
  frequency: string;
  onChange: (frequency: string) => void;
  frequencies: ReadonlyArray<FrequencyOption>;
};

type CompletionModeToggleProps = {
  mode: TrackingMode;
  onChange: (mode: TrackingMode) => void;
};

function FrequencySelector({
  frequency,
  onChange,
  frequencies,
}: FrequencySelectorProps): JSX.Element {
  return (
    <section>
      <p className="t-label label-mb-10">Frequency</p>
      <div className="freq-grid">
        {frequencies.map(({ label, value, Icon }) => (
          <button
            key={value}
            className={withActiveClass("freq-btn", frequency === value)}
            onClick={() => onChange(value)}
            aria-pressed={frequency === value}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function CompletionModeToggle({
  mode,
  onChange,
}: CompletionModeToggleProps): JSX.Element {
  return (
    <section>
      <p className="t-label label-mb-10">Completion Mode</p>
      <div className="freq-grid">
        <button
          className={withActiveClass("freq-btn", mode === "binary")}
          onClick={() => onChange("binary")}
          aria-pressed={mode === "binary"}
        >
          Single Check
        </button>
        <button
          className={withActiveClass("freq-btn", mode === "multiple")}
          onClick={() => onChange("multiple")}
          aria-pressed={mode === "multiple"}
        >
          Multi Completion
        </button>
      </div>
    </section>
  );
}

function MultiCompletionSettings({
  measurement,
  dailyTarget,
  completionRule,
  onChange,
}: MultiCompletionSettingsProps): JSX.Element {
  return (
    <article className="card card-stack-12">
      <MultiCompletionFields
        measurement={measurement}
        dailyTarget={dailyTarget}
        completionRule={completionRule}
        onChange={onChange}
        idPrefix="newHabit"
        title="Multi Completion Settings"
      />
    </article>
  );
}

const FREQUENCIES: ReadonlyArray<FrequencyOption> = [
  { label: "Daily", value: "Daily", Icon: CalendarDays },
  { label: "Weekly", value: "Mon, Wed, Fri", Icon: CalendarRange },
];

export default function NewHabitScreen(): JSX.Element {
  const { dispatch } = useApp();
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("Daily");
  const [color, setColor] = useState(getDefaultHabitColor());
  const [trackingMode, setTrackingMode] = useState<TrackingMode>("binary");
  const [measurement, setMeasurement] = useState("times");
  const [dailyTarget, setDailyTarget] = useState(5);
  const [completionRule, setCompletionRule] = useState<CompletionRule>("goal");

  const selectedPresetName = getSelectedPresetName(color);
  const isMultiple = trackingMode === "multiple";
  const canCreate = canCreateHabit(name, isMultiple, measurement);

  const createAction = buildCreateHabitAction({
    name,
    frequency,
    color,
    trackingMode,
    measurement,
    dailyTarget,
    completionRule,
  });

  return (
    <div className="screen">
      {/* Top bar */}
      <header className="topbar">
        <button
          className="icon-btn"
          aria-label="Close"
          onClick={() => dispatch({ type: "BACK" })}
        >
          <X size={20} />
        </button>
        <h1 className="screen-title-center">New Habit</h1>
        <button className="icon-btn" aria-label="Profile">
          <CircleUser size={20} />
        </button>
      </header>

      {/* Habit name */}
      <section>
        <label className="t-label label-mb-8" htmlFor="habitName">
          Habit Name
        </label>
        <input
          id="habitName"
          className="line-input"
          placeholder="e.g. Morning Meditation"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          autoFocus
        />
      </section>

      <CompletionModeToggle mode={trackingMode} onChange={setTrackingMode} />

      {isMultiple ? (
        <MultiCompletionSettings
          measurement={measurement}
          dailyTarget={dailyTarget}
          completionRule={completionRule}
          onChange={(patch) => {
            if (patch.measurement !== undefined) {
              setMeasurement(patch.measurement);
            }

            if (patch.dailyTarget !== undefined) {
              setDailyTarget(patch.dailyTarget);
            }

            if (patch.completionRule !== undefined) {
              setCompletionRule(patch.completionRule);
            }
          }}
        />
      ) : null}

      <FrequencySelector
        frequency={frequency}
        onChange={setFrequency}
        frequencies={FREQUENCIES}
      />

      {/* Signature colour */}
      <section>
        <div className="signature-row">
          <p className="t-label">Signature Color</p>
          <p className="hint-selected-color">{selectedPresetName} Selected</p>
        </div>
        <div className="card card-pad-md">
          <ColorPicker selected={color} onChange={setColor} />
        </div>
      </section>

      {/* Why this color tip */}
      <article className="card tip-card">
        <div className="insight-head">
          <Lightbulb size={18} />
          <h3 className="sub-title-15">Why this color?</h3>
        </div>
        <p className="t-body-sm">
          Consistent visual cues help your brain build associations. Choosing a
          distinct color for each habit increases retention by up to 40%.
        </p>
      </article>

      {/* CTA */}
      <button
        className="primary-btn"
        onClick={() => dispatch(createAction)}
        disabled={!canCreate}
      >
        Create Habit
      </button>
    </div>
  );
}
