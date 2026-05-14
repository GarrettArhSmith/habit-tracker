import type { MouseEvent } from "react";
import { Plus } from "lucide-react";
import { useApp } from "../context/api";
import { getDayProgress, todayKey } from "../domain/habitMetrics";
import ProgressRing from "../components/ProgressRing";
import ScreenTopBar from "../components/ScreenTopBar";
import HomeHabitCard from "../components/HomeHabitCard";

export default function HomeScreen(): JSX.Element {
  const { state, dispatch } = useApp();
  const { habits } = state;

  const today = todayKey();
  const totalProgress = habits.reduce(
    (sum, habit) => sum + getDayProgress(habit, today),
    0,
  );
  const pct = Math.round((totalProgress / Math.max(1, habits.length)) * 100);

  function openDetail(id: string): void {
    dispatch({ type: "NAVIGATE", view: "detail", detailId: id });
  }

  function toggle(event: MouseEvent<HTMLButtonElement>, id: string): void {
    event.stopPropagation();
    dispatch({ type: "TOGGLE_HABIT", id });
  }

  function adjustCount(
    event: MouseEvent<HTMLButtonElement>,
    id: string,
    delta: number,
  ): void {
    event.stopPropagation();
    dispatch({ type: "ADJUST_HABIT_COUNT", id, delta });
  }

  return (
    <>
      <div className="screen">
        {/* Top bar */}
        <ScreenTopBar profileAriaLabel="Settings" />

        {/* Daily completion card */}
        <article className="card progress-card">
          <div className="col col-gap-4">
            <p className="t-label">Daily Completion</p>
            <p className="progress-pct">{pct}%</p>
          </div>
          <ProgressRing percent={pct} size={100} stroke={9} />
        </article>

        {/* Habit list */}
        <section className="stack" aria-label="Today's habits">
          {habits.map((habit) => (
            <HomeHabitCard
              key={habit.id}
              habit={habit}
              day={today}
              onOpen={openDetail}
              onToggle={toggle}
              onAdjust={adjustCount}
            />
          ))}
        </section>
      </div>

      {/* FAB */}
      <button
        className="fab"
        aria-label="Add new habit"
        onClick={() => dispatch({ type: "NAVIGATE", view: "newHabit" })}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </>
  );
}
