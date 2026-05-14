import { useId } from "react";

/**
 * SVG-based circular progress ring.
 * Matches the design system's "rounded stroke cap" spec.
 */
type ProgressRingProps = {
  percent?: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
};

export default function ProgressRing({
  percent = 0,
  size = 100,
  stroke = 8,
  color = "var(--primary-container)",
  trackColor = "var(--track)",
}: ProgressRingProps): JSX.Element {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const gradientId = `progress-ring-gradient-${useId().replace(/:/g, "")}`;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (clampedPercent / 100) * circ;

  return (
    <svg
      className="progress-ring-svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
      aria-label={`${Math.round(percent)}% complete`}
      role="img"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop
            offset="100%"
            stopColor={`color-mix(in oklab, ${color} 65%, var(--surface-tint))`}
          />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle
        className="progress-ring-track"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        className="progress-ring-bar"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 400ms ease" }}
      />
    </svg>
  );
}
