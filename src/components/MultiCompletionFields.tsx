import type { CompletionRule, HabitSettingsPatch } from "../context/types";
import { COUNTING_RULE_OPTIONS } from "../constants/habit";
import { withActiveClass } from "../utils/classNames";

type MultiCompletionFieldsProps = {
  measurement: string;
  dailyTarget: number;
  completionRule: CompletionRule;
  onChange: (patch: HabitSettingsPatch) => void;
  disabled?: boolean;
  idPrefix: string;
  title?: string;
};

export default function MultiCompletionFields({
  measurement,
  dailyTarget,
  completionRule,
  onChange,
  disabled = false,
  idPrefix,
  title,
}: MultiCompletionFieldsProps): JSX.Element {
  return (
    <>
      {title ? <p className="t-label">{title}</p> : null}

      <div>
        <label
          className="t-label label-mb-6"
          htmlFor={`${idPrefix}Measurement`}
        >
          Measurement Label
        </label>
        <input
          id={`${idPrefix}Measurement`}
          className="line-input line-input-mid"
          value={measurement}
          onChange={(event) => onChange({ measurement: event.target.value })}
          disabled={disabled}
        />
      </div>

      <div>
        <label className="t-label label-mb-6" htmlFor={`${idPrefix}Target`}>
          Daily Target
        </label>
        <input
          id={`${idPrefix}Target`}
          className="line-input line-input-lg"
          type="number"
          min="1"
          value={dailyTarget}
          onChange={(event) =>
            onChange({
              dailyTarget: Math.max(1, Number(event.target.value) || 1),
            })
          }
          disabled={disabled}
        />
      </div>

      <div>
        <p className="t-label label-mb-8">Stats Counting Rule</p>
        <div className="stack stack-gap-8">
          {COUNTING_RULE_OPTIONS.map((rule) => (
            <button
              key={rule.value}
              className={withActiveClass(
                "freq-btn action-chip",
                completionRule === rule.value,
              )}
              onClick={() => onChange({ completionRule: rule.value })}
              aria-pressed={completionRule === rule.value}
              disabled={disabled}
            >
              {rule.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
