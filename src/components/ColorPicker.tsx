import { Check } from "lucide-react";
import { COLOR_PRESETS } from "../constants/colors";

type ColorPickerProps = {
  selected: string;
  onChange: (color: string) => void;
  disabled?: boolean;
};

export default function ColorPicker({
  selected,
  onChange,
  disabled = false,
}: ColorPickerProps): JSX.Element {
  return (
    <div className="color-chip-grid">
      {COLOR_PRESETS.map((preset) => (
        <button
          key={preset.value}
          className={`color-chip ${selected === preset.value ? "active" : ""}`}
          style={{ backgroundColor: preset.value }}
          onClick={() => onChange(preset.value)}
          disabled={disabled}
          aria-label={`${preset.name} ${selected === preset.value ? "(selected)" : ""}`}
          title={preset.name}
        >
          {selected === preset.value && <Check size={18} strokeWidth={2.5} />}
        </button>
      ))}
    </div>
  );
}
