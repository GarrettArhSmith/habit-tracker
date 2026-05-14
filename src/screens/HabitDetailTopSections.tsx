import { ArrowLeft, Pencil, X } from "lucide-react";
import { Zap, Trophy, CheckCircle2 } from "lucide-react";
import Heatmap from "../components/Heatmap";
import HeatmapLegend from "../components/HeatmapLegend";
import type { Habit } from "../context/types";
import { getDayCount, getHeatmapIntensity } from "../domain/habitMetrics";
import { getActivityCaption, type HabitStats } from "./habitDetailUtils";

type DetailTopBarProps = {
  name: string;
  isEditMode: boolean;
  onBack: () => void;
  onEditToggle: () => void;
};

export function DetailTopBar({
  name,
  isEditMode,
  onBack,
  onEditToggle,
}: DetailTopBarProps): JSX.Element {
  return (
    <header className="topbar">
      <button className="icon-btn" aria-label="Back" onClick={onBack}>
        <ArrowLeft size={20} />
      </button>
      <h1 className="screen-title-center screen-title-ellipsis">{name}</h1>
      <button
        className="icon-btn"
        aria-label={isEditMode ? "Cancel editing" : "Edit habit"}
        onClick={onEditToggle}
      >
        {isEditMode ? <X size={20} /> : <Pencil size={18} />}
      </button>
    </header>
  );
}

type StatsGridProps = {
  color: string;
  stats: HabitStats;
};

function Tile(props: {
  icon: JSX.Element;
  label: string;
  value: string | number;
  valueColor: string;
  className?: string;
}): JSX.Element {
  return (
    <article
      className={`card stat-tile${props.className ? ` ${props.className}` : ""}`}
    >
      <div className="inline-row-8">
        {props.icon}
        <p className="t-label">{props.label}</p>
      </div>
      <p
        className="t-stat"
        style={{ color: props.valueColor, letterSpacing: "-0.03em" }}
      >
        {props.value}
      </p>
    </article>
  );
}

export function StatsGrid({ color, stats }: StatsGridProps): JSX.Element {
  return (
    <div className="stat-grid-2">
      <Tile
        icon={<Zap size={20} style={{ color }} />}
        label="Current Streak"
        value={`${stats.currentStreak} days`}
        valueColor={color}
      />
      <Tile
        icon={<CheckCircle2 size={20} className="icon-tertiary" />}
        label="Total Completions"
        value={stats.totalCompletions}
        valueColor="var(--tertiary)"
      />
      <div className="stat-tile full-width">
        <Tile
          icon={<Trophy size={20} className="icon-secondary" />}
          label="Best Streak"
          value={`${stats.bestStreak} days`}
          valueColor="var(--secondary)"
        />
      </div>
    </div>
  );
}

type ActivityMapCardProps = {
  habit: Habit;
};

export function ActivityMapCard({ habit }: ActivityMapCardProps): JSX.Element {
  return (
    <article className="card card-stack-14">
      <div className="row-between">
        <h3 className="section-title-16">Activity Map</h3>
        <HeatmapLegend color={habit.color} />
      </div>

      <Heatmap
        days={312}
        getIntensity={(day) => getHeatmapIntensity(habit, day)}
        getAmountLabel={(day) => {
          const count = getDayCount(habit, day);
          if (habit.trackingMode === "multiple") {
            return `${count} ${habit.measurement}`;
          }

          return `${count} completion${count === 1 ? "" : "s"}`;
        }}
        color={habit.color}
        caption={getActivityCaption(habit)}
      />
    </article>
  );
}
