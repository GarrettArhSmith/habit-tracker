import { useEffect, useRef } from "react";
import { lastNDays } from "../domain/habitMetrics";
import type { CSSProperties } from "react";
import { generateColorScale } from "./colorUtils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type HeatmapSlot = {
  key: string;
  title: string;
  intensity: 0 | 1 | 2 | 3 | 4;
};

type HeatmapProps = {
  days?: number;
  getIntensity: (dateKey: string) => 0 | 1 | 2 | 3 | 4;
  getAmountLabel?: (dateKey: string) => string;
  color?: string;
  blankColor?: string;
  caption?: string;
  compact?: boolean;
  rows?: number;
  flow?: "column" | "row";
  showRowLabels?: boolean;
  showMonthLabels?: boolean;
  fitContainer?: boolean;
};

type HeatmapCssVars = CSSProperties & {
  "--hm-cell-size": string;
  "--hm-label-width": string;
};

function getAmountLabel(
  key: string,
  intensity: 0 | 1 | 2 | 3 | 4,
  getLabel?: (dateKey: string) => string,
): string {
  return getLabel ? getLabel(key) : String(intensity);
}

function buildHeatmapSlots(
  keys: string[],
  startOffset: number,
  rowCount: number,
  columnCount: number,
  flow: "column" | "row",
  getIntensity: (dateKey: string) => 0 | 1 | 2 | 3 | 4,
  getAmount: ((dateKey: string) => string) | undefined,
): Array<HeatmapSlot | null> {
  const slots: Array<HeatmapSlot | null> = Array.from(
    { length: columnCount * rowCount },
    () => null,
  );

  keys.forEach((key, index) => {
    const slotIndex = startOffset + index;
    let row = 0;
    let column = 0;
    if (flow === "column") {
      row = slotIndex % rowCount;
      column = Math.floor(slotIndex / rowCount);
    } else {
      row = Math.floor(slotIndex / columnCount);
      column = slotIndex % columnCount;
    }
    const date = new Date(`${key}T00:00:00`);
    const intensity = getIntensity(key);
    const amountLabel = getAmountLabel(key, intensity, getAmount);

    slots[column * rowCount + row] = {
      key,
      title: `${date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })}\n${amountLabel}`,
      intensity,
    };
  });

  return slots;
}

function getFirstSlotInColumn(
  slots: Array<HeatmapSlot | null>,
  columnIndex: number,
  rowCount: number,
): HeatmapSlot | null {
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const slot = slots[columnIndex * rowCount + rowIndex];
    if (slot) {
      return slot;
    }
  }

  return null;
}

function buildMonthLabels(
  slots: Array<HeatmapSlot | null>,
  columnCount: number,
  rowCount: number,
): string[] {
  const monthLabels: string[] = [];
  let lastMonth = "";

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const firstSlot = getFirstSlotInColumn(slots, columnIndex, rowCount);
    if (!firstSlot) {
      monthLabels.push("");
      continue;
    }

    const monthKey = firstSlot.key.slice(0, 7);
    if (monthKey === lastMonth) {
      monthLabels.push("");
      continue;
    }

    lastMonth = monthKey;
    monthLabels.push(
      new Date(`${firstSlot.key}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
      }),
    );
  }

  return monthLabels;
}

function renderHeatmapCell(
  slot: HeatmapSlot | null,
  rowIndex: number,
  columnIndex: number,
  scale: string[],
  fitContainer: boolean,
  compact: boolean,
): JSX.Element {
  const cellSizeStyle = fitContainer
    ? {
        width: "100%",
        height: compact ? "10px" : "12px",
        aspectRatio: "auto",
      }
    : undefined;

  // blank cell (no data or no completion)
  if (!slot || slot.intensity === 0) {
    return (
      <span
        key={slot ? slot.key : `r${rowIndex}-c${columnIndex}`}
        className="hm-cell"
        style={{
          backgroundColor: scale[0],
          ...cellSizeStyle,
        }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span
      key={slot.key}
      className="hm-cell"
      style={{
        backgroundColor: scale[slot.intensity],
        ...cellSizeStyle,
      }}
      title={slot.title}
    />
  );
}

function maybeScrollHeatmapToEnd(
  element: HTMLDivElement | null,
  compact: boolean,
): void {
  if (compact || !element) {
    return;
  }

  element.scrollLeft = element.scrollWidth;
}

function renderMonthHeader(
  showMonthLabels: boolean,
  showRowLabels: boolean,
  columnCount: number,
  monthLabels: string[],
): JSX.Element | null {
  if (!showMonthLabels) {
    return null;
  }

  const monthGridTemplateColumns = showRowLabels
    ? `var(--hm-label-width) repeat(${columnCount}, var(--hm-cell-size))`
    : `repeat(${columnCount}, var(--hm-cell-size))`;

  return (
    <div
      className="heatmap-months"
      style={{
        gridTemplateColumns: monthGridTemplateColumns,
      }}
      aria-hidden="true"
    >
      {showRowLabels ? <span /> : null}
      {monthLabels.map((label, index) => (
        <span
          key={`${label || "blank"}-${index}`}
          className="heatmap-month-label"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function getHeatmapSizing(compact: boolean): {
  cellSize: number;
  labelWidth: number;
  shellClassName: string;
} {
  if (compact) {
    return {
      cellSize: 10,
      labelWidth: 24,
      shellClassName: "heatmap-shell compact",
    };
  }

  return {
    cellSize: 13,
    labelWidth: 28,
    shellClassName: "heatmap-shell",
  };
}

function renderCaption(caption?: string): JSX.Element | null {
  if (!caption) {
    return null;
  }

  return (
    <p
      style={{
        fontSize: 12,
        color: "var(--on-surface-variant)",
        textAlign: "center",
      }}
    >
      {caption}
    </p>
  );
}

function getStartOffset(
  flow: "column" | "row",
  firstKey: string | undefined,
): number {
  if (flow !== "column" || !firstKey) {
    return 0;
  }

  return new Date(`${firstKey}T00:00:00`).getDay();
}

function buildRowTemplateColumns(params: {
  shouldShowRowLabels: boolean;
  fitContainer: boolean;
  columnCount: number;
}): string {
  const { shouldShowRowLabels, fitContainer, columnCount } = params;

  if (shouldShowRowLabels) {
    return `var(--hm-label-width) repeat(${columnCount}, var(--hm-cell-size))`;
  }

  if (fitContainer) {
    return `repeat(${columnCount}, minmax(0, 1fr))`;
  }

  return `repeat(${columnCount}, var(--hm-cell-size))`;
}

function getRowLabels(
  shouldShowRowLabels: boolean,
  rowCount: number,
): string[] {
  return shouldShowRowLabels
    ? WEEKDAY_LABELS.slice(0, rowCount)
    : Array.from({ length: rowCount }, (_, index) => `row-${index}`);
}

function renderHeatmapRows(params: {
  rowLabels: string[];
  rowCount: number;
  columnCount: number;
  shouldShowRowLabels: boolean;
  rowTemplateColumns: string;
  slots: Array<HeatmapSlot | null>;
  scale: string[];
  fitContainer: boolean;
  compact: boolean;
}): JSX.Element[] {
  const {
    rowLabels,
    rowCount,
    columnCount,
    shouldShowRowLabels,
    rowTemplateColumns,
    slots,
    scale,
    fitContainer,
    compact,
  } = params;

  return rowLabels.map((label, rowIndex) => (
    <div
      key={label}
      className="heatmap-row"
      style={{
        gridTemplateColumns: rowTemplateColumns,
      }}
    >
      {shouldShowRowLabels ? (
        <span className="heatmap-row-label">{label}</span>
      ) : null}
      {Array.from({ length: columnCount }, (_, columnIndex) => {
        const slot: HeatmapSlot | null =
          slots[columnIndex * rowCount + rowIndex] ?? null;
        return renderHeatmapCell(
          slot,
          rowIndex,
          columnIndex,
          scale,
          fitContainer,
          compact,
        );
      })}
    </div>
  ));
}

/**
 * Weekday heatmap with one row per weekday and columns for calendar weeks.
 * Each cell's colour is a tinted version of `color` at varying opacity levels.
 */
export default function Heatmap({
  days = 140,
  getIntensity,
  getAmountLabel,
  color = "var(--primary-container)",
  blankColor,
  caption,
  compact = false,
  rows = 7,
  flow = "column",
  showRowLabels,
  showMonthLabels,
  fitContainer = false,
}: HeatmapProps): JSX.Element {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const keys = lastNDays(days);
  const rowCount = Math.max(1, rows);
  const startOffset = getStartOffset(flow, keys[0]);
  const columnCount = Math.ceil((startOffset + keys.length) / rowCount);
  const shouldShowRowLabels =
    showRowLabels ?? (flow === "column" && rowCount === 7);
  const shouldShowMonthLabels =
    showMonthLabels ?? (!compact && flow === "column");
  const slots = buildHeatmapSlots(
    keys,
    startOffset,
    rowCount,
    columnCount,
    flow,
    getIntensity,
    getAmountLabel,
  );
  const sizing = getHeatmapSizing(compact);
  const heatmapStyle: HeatmapCssVars = {
    "--hm-cell-size": `${sizing.cellSize}px`,
    "--hm-label-width": `${sizing.labelWidth}px`,
  };
  // Generate color scale: [blank, ...4 shades]
  const scale = generateColorScale(color ?? "#10b981", blankColor);
  const monthLabels = buildMonthLabels(slots, columnCount, rowCount);
  const monthHeader = renderMonthHeader(
    shouldShowMonthLabels,
    shouldShowRowLabels,
    columnCount,
    monthLabels,
  );
  const captionElement = renderCaption(caption);
  const rowTemplateColumns = buildRowTemplateColumns({
    shouldShowRowLabels,
    fitContainer,
    columnCount,
  });
  const rowLabels = getRowLabels(shouldShowRowLabels, rowCount);
  const rowsMarkup = renderHeatmapRows({
    rowLabels,
    rowCount,
    columnCount,
    shouldShowRowLabels,
    rowTemplateColumns,
    slots,
    scale,
    fitContainer,
    compact,
  });

  useEffect(() => {
    maybeScrollHeatmapToEnd(tableRef.current, compact);
  }, [compact, days, columnCount]);

  return (
    <div className={sizing.shellClassName}>
      <div
        ref={tableRef}
        className="heatmap-table"
        role="img"
        aria-label="Habit activity heatmap"
        style={heatmapStyle}
      >
        {monthHeader}
        {rowsMarkup}
      </div>
      {captionElement}
    </div>
  );
}
