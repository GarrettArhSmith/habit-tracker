import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { Habit } from "../context/types";
import { getDayCount, getHeatmapIntensity } from "../domain/habitMetrics";
import Heatmap from "./Heatmap";

type CssVarStyle = CSSProperties & {
  "--toggle-color"?: string;
};

type HomeHabitCardProps = {
  habit: Habit;
  day: string;
  onOpen: (id: string) => void;
  onToggle: (event: MouseEvent<HTMLButtonElement>, id: string) => void;
  onAdjust: (
    event: MouseEvent<HTMLButtonElement>,
    id: string,
    delta: number,
  ) => void;
};

export default function HomeHabitCard({
  habit,
  day,
  onOpen,
  onToggle,
  onAdjust,
}: HomeHabitCardProps): JSX.Element {
  return (
    <article
      className="card habit-card"
      onClick={() => onOpen(habit.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) =>
        event.key === "Enter" && onOpen(habit.id)
      }
    >
      <div className="habit-card-top">
        <div className="habit-card-text">
          <h2 className="habit-name">{habit.name}</h2>
        </div>

        {habit.trackingMode === "multiple" ? (
          <div
            className="count-control"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="count-btn"
              onClick={(event) => onAdjust(event, habit.id, -1)}
              aria-label={`Decrease ${habit.name}`}
            >
              <Minus size={16} />
            </button>
            <p className="count-value" style={{ color: habit.color }}>
              {getDayCount(habit, day)}
              <span>{habit.measurement}</span>
            </p>
            <button
              className="count-btn"
              onClick={(event) => onAdjust(event, habit.id, 1)}
              aria-label={`Increase ${habit.name}`}
            >
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <button
            className={`toggle-btn ${habit.doneToday ? "done" : ""}`}
            style={{ "--toggle-color": habit.color } as CssVarStyle}
            onClick={(event) => onToggle(event, habit.id)}
            aria-label={
              habit.doneToday
                ? `Mark ${habit.name} incomplete`
                : `Mark ${habit.name} complete`
            }
            aria-pressed={habit.doneToday}
          >
            <Check size={22} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div>
        <p className="t-label label-mb-8">Last 30 days</p>
        <Heatmap
          days={30}
          getIntensity={(dateKey) => getHeatmapIntensity(habit, dateKey)}
          getAmountLabel={(dateKey) => {
            const count = getDayCount(habit, dateKey);
            return habit.trackingMode === "multiple"
              ? `${count} ${habit.measurement}`
              : `${count} completion${count === 1 ? "" : "s"}`;
          }}
          color={habit.color}
          rows={2}
          flow="row"
          showRowLabels={false}
          showMonthLabels={false}
          fitContainer
        />
      </div>
    </article>
  );
}
