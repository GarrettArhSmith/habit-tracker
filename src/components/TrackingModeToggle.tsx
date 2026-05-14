import type { TrackingMode } from "../context/types";
import { withActiveClass } from "../utils/classNames";

type TrackingModeToggleProps = {
  trackingMode: TrackingMode;
  onChange: (mode: TrackingMode) => void;
  disabled?: boolean;
  label?: string;
  labelClassName?: string;
};

export default function TrackingModeToggle({
  trackingMode,
  onChange,
  disabled = false,
  label,
  labelClassName = "t-label label-mb-10",
}: TrackingModeToggleProps): JSX.Element {
  return (
    <>
      {label ? <p className={labelClassName}>{label}</p> : null}
      <div className="freq-grid">
        <button
          className={withActiveClass("freq-btn", trackingMode === "binary")}
          onClick={() => onChange("binary")}
          aria-pressed={trackingMode === "binary"}
          disabled={disabled}
        >
          Single Check
        </button>
        <button
          className={withActiveClass("freq-btn", trackingMode === "multiple")}
          onClick={() => onChange("multiple")}
          aria-pressed={trackingMode === "multiple"}
          disabled={disabled}
        >
          Multi Completion
        </button>
      </div>
    </>
  );
}
