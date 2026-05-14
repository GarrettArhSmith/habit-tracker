import { generateColorScale } from "./colorUtils";

type HeatmapLegendProps = {
  color?: string;
  blankColor?: string;
  className?: string;
};

export default function HeatmapLegend({
  color = "#10b981",
  blankColor,
  className = "",
}: HeatmapLegendProps) {
  // Only show the 4 gradient colors (intensity 1–4)
  const scale = generateColorScale(color, blankColor).slice(1);
  return (
    <div className={`legend-row ${className}`}>
      <span className="t-label label-tight">Less</span>
      {scale.map((c, i) => (
        <span
          key={i}
          className="legend-swatch-sm"
          style={{ backgroundColor: c }}
        />
      ))}
      <span className="t-label label-tight">More</span>
    </div>
  );
}
