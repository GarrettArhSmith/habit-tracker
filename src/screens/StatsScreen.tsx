import { Trophy, Lightbulb, TrendingUp } from "lucide-react";
import { useApp } from "../context/api";
import ProgressRing from "../components/ProgressRing";
import Heatmap from "../components/Heatmap";
import HeatmapLegend from "../components/HeatmapLegend";
import ScreenTopBar from "../components/ScreenTopBar";
import type { ReactNode } from "react";
import { getCurrentStreak, todayKey } from "../domain/habitMetrics";
import {
  formatDailyProgressValue,
  selectConsistencyPercent,
  selectDailyProgressSummary,
  selectGlobalHeatmapAmountLabel,
  selectGlobalHeatmapIntensity,
  selectSortedHabitsByCurrentStreak,
  selectTotalCompletionsAllHabits,
} from "../context/selectors";

export default function StatsScreen(): JSX.Element {
  const { state, dispatch } = useApp();
  const { habits } = state;

  const today = todayKey();
  const dailySummary = selectDailyProgressSummary(habits, today);
  const completed = formatDailyProgressValue(dailySummary.totalProgress);
  const total = dailySummary.totalHabits;
  const pct = dailySummary.percent;

  // 5-level global heatmap: intensity = ratio of habits completed that day
  function globalIntensity(day: string): 0 | 1 | 2 | 3 | 4 {
    return selectGlobalHeatmapIntensity(habits, day);
  }

  function globalAmount(day: string): string {
    return selectGlobalHeatmapAmountLabel(habits, day);
  }

  /* Per-habit detail link */
  function openDetail(id: string): void {
    dispatch({ type: "NAVIGATE", view: "detail", detailId: id });
  }

  const sorted = selectSortedHabitsByCurrentStreak(habits);
  const top = sorted[0];

  const totalCompletionsAll = selectTotalCompletionsAllHabits(habits);
  const consistency30 = selectConsistencyPercent(habits, 30);

  return (
    <div className="screen">
      {/* Top bar */}
      <ScreenTopBar profileAriaLabel="Profile" />

      {/* Daily velocity hero */}
      <article className="card stat-hero">
        <div className="section-stack-6">
          <p className="t-label">Daily Velocity</p>
          <h2 className="font-16-600 text-on-surface title-clamp-hero">
            Total habits completed today
          </h2>
          <p className="stat-value-xl">
            {completed}
            <span className="stat-value-sub"> / {total}</span>
          </p>
        </div>

        <div className="progress-ring-wrap">
          <ProgressRing percent={pct} size={108} stroke={9} />
          <p className="progress-ring-label">{pct}%</p>
        </div>
      </article>

      {/* Activity intensity heatmap */}
      <section className="section-stack-12">
        <div className="row-between">
          <h3 className="section-title-18">Activity Intensity</h3>
          <p className="t-label">Last 12 months</p>
        </div>
        <article className="card">
          <Heatmap
            days={365}
            getIntensity={globalIntensity}
            getAmountLabel={globalAmount}
            color="#10b981"
          />
          <HeatmapLegend color="#10b981" />
        </article>
      </section>

      {/* All-time streaks */}
      <section className="section-stack-12">
        <h3 className="section-title-18">All Time Streaks</h3>

        {top && (
          <button
            type="button"
            className="card legendary-card clickable"
            onClick={() => openDetail(top.id)}
            aria-label={`Open details for ${top.name}`}
          >
            <div className="inline-row-8 mb-6">
              <Trophy size={16} style={{ color: top.color }} />
              <span className="legendary-badge" style={{ color: top.color }}>
                Legendary Status
              </span>
            </div>
            <p className="legendary-name">{top.name}</p>
            <p className="legendary-streak" style={{ color: top.color }}>
              {getCurrentStreak(top)}
              <span className="legendary-streak-unit"> days</span>
            </p>
            <p className="t-body-sm mt-4">
              Your longest active streak across all categories.
            </p>
          </button>
        )}

        <div className="stack">
          {sorted.slice(1).map((h) => (
            <button
              type="button"
              key={h.id}
              className="card streak-item"
              onClick={() => openDetail(h.id)}
              aria-label={`Open details for ${h.name}`}
            >
              <span
                style={{
                  backgroundColor: h.color,
                }}
                className="streak-dot"
              />
              <span className="streak-name">{h.name}</span>
              <span className="streak-value" style={{ color: h.color }}>
                {getCurrentStreak(h)} days
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Growth Insights */}
      <section className="section-stack-12">
        <h3 className="section-title-18">Growth Insights</h3>
        <div className="stack">
          <InsightCard
            icon={<TrendingUp size={18} />}
            title="Consistency Peak"
            body={
              top
                ? `${top.name} is leading with a ${getCurrentStreak(top)}-day active run. Keeping this momentum will strengthen your overall score.`
                : "Start logging habits to unlock insights."
            }
          />
          <InsightCard
            icon={<Lightbulb size={18} />}
            title="Master Tracker"
            body={`You've logged ${totalCompletionsAll} total completions. Your 30-day consistency rate is ${consistency30}%.`}
          />
        </div>
      </section>
    </div>
  );
}

type InsightCardProps = {
  icon: ReactNode;
  title: string;
  body: string;
};

function InsightCard({ icon, title, body }: InsightCardProps): JSX.Element {
  return (
    <article className="card insight-card">
      <div className="insight-head">
        {icon}
        <h4 className="sub-title-15">{title}</h4>
      </div>
      <p className="t-body-sm">{body}</p>
    </article>
  );
}
