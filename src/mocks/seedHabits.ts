import { lastNDays, todayKey } from "../domain/habitMetrics";
import { normalizeTarget, type NormalizeHabit } from "../domain/habitNormalize";

function seededRandom(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return ((hash >>> 0) % 1_000_000) / 1_000_000;
}

function getSeededMultipleCount(
  habit: Omit<NormalizeHabit, "history" | "doneToday">,
  day: string,
): number {
  const target = normalizeTarget(habit.dailyTarget, 1);
  const roll = seededRandom(`${habit.id}-${day}-count`);

  if (roll < 0.2) {
    return Math.max(1, Math.floor(target * 0.3));
  }

  if (roll < 0.45) {
    return Math.max(1, Math.floor(target * 0.6));
  }

  if (roll < 0.75) {
    return Math.max(1, Math.floor(target * 0.85));
  }

  if (roll < 0.92) {
    return target;
  }

  // Occasionally exceed target to preview over-achievement states.
  return Math.max(target + 1, Math.ceil(target * 1.2));
}

function createCompletionPlan(
  dayCount: number,
  templateCount: number,
): number[] {
  const completedByBand = [0, 1, 3, 6, templateCount];
  const levelsPerBand = Math.floor(dayCount / completedByBand.length);
  const remainder = dayCount % completedByBand.length;
  const completionPlan: number[] = [];

  completedByBand.forEach((completedCount, band) => {
    const baseCount = levelsPerBand + (band < remainder ? 1 : 0);
    for (let i = 0; i < baseCount; i += 1) {
      completionPlan.push(completedCount);
    }
  });

  return completionPlan;
}

function shuffleIndices(length: number, seedPrefix: string): number[] {
  const order = Array.from({ length }, (_, index) => index);

  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seededRandom(`${seedPrefix}-${i}`) * (i + 1));
    [order[i], order[j]] = [order[j] ?? i, order[i] ?? j];
  }

  return order;
}

function applyCompletionForDay(params: {
  day: string;
  completedCount: number;
  templates: ReadonlyArray<Omit<NormalizeHabit, "history" | "doneToday">>;
  histories: Array<Record<string, number>>;
}): void {
  const { day, completedCount, templates, histories } = params;
  const habitOrder = shuffleIndices(templates.length, day);

  for (let pick = 0; pick < completedCount; pick += 1) {
    const habitIndex = habitOrder[pick];
    if (habitIndex === undefined) {
      continue;
    }

    const habit = templates[habitIndex];
    if (!habit) {
      continue;
    }

    histories[habitIndex] ??= {};
    const history = histories[habitIndex];
    if (!history) {
      continue;
    }

    history[day] =
      habit.trackingMode === "multiple"
        ? getSeededMultipleCount(habit, day)
        : 1;
  }
}

function buildBalancedHistories(
  days: string[],
  templates: ReadonlyArray<Omit<NormalizeHabit, "history" | "doneToday">>,
): Array<Record<string, number>> {
  const histories: Array<Record<string, number>> = templates.map(() => ({}));
  const completionPlan = createCompletionPlan(days.length, templates.length);
  const planOrder = shuffleIndices(completionPlan.length, "plan");

  for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
    const day = days[dayIndex];
    if (!day) {
      continue;
    }

    const planIndex = planOrder[dayIndex] ?? dayIndex;
    const completedCount = completionPlan[planIndex] ?? 0;

    applyCompletionForDay({ day, completedCount, templates, histories });
  }

  return histories;
}

export function createSeedHabits(): NormalizeHabit[] {
  const today = todayKey();
  const days = lastNDays(365);

  const templates: Array<Omit<NormalizeHabit, "history" | "doneToday">> = [
    {
      id: "7eddbbce-2fe9-4753-b7df-27f36765d4ca",
      name: "Morning Meditation",
      color: "#10b981",
      trackingMode: "binary",
      dailyTarget: 1,
      completionRule: "goal",
      measurement: "times",
    },
    {
      id: "73653e6c-a98a-4637-b113-edfbe750d2f4",
      name: "Water Intake",
      color: "#06b6d4",
      trackingMode: "multiple",
      dailyTarget: 8,
      completionRule: "weighted",
      measurement: "glasses",
    },
    {
      id: "0dd629be-4e24-4a94-a3f3-dd0ad0f0f4b9",
      name: "Read 20 Pages",
      color: "#2170e4",
      trackingMode: "binary",
      dailyTarget: 1,
      completionRule: "goal",
      measurement: "times",
    },
    {
      id: "11e8cbc9-5033-46b9-b881-8ea02d9ca7d1",
      name: "Exercise",
      color: "#fc7c78",
      trackingMode: "multiple",
      dailyTarget: 30,
      completionRule: "goal",
      measurement: "minutes",
    },
    {
      id: "8dcf7ea3-b9ff-4106-a7c4-b2a3d6032dc5",
      name: "Journal Entry",
      color: "#f59e0b",
      trackingMode: "binary",
      dailyTarget: 1,
      completionRule: "goal",
      measurement: "times",
    },
    {
      id: "e585d277-cd26-4321-92bb-5cb88b99bf85",
      name: "Fruits & Veggies",
      color: "#ec4899",
      trackingMode: "multiple",
      dailyTarget: 5,
      completionRule: "any",
      measurement: "servings",
    },
    {
      id: "f7252496-6f4a-4e49-b973-4e4ba2cdb5ea",
      name: "No Sweets",
      color: "#8b5cf6",
      trackingMode: "binary",
      dailyTarget: 1,
      completionRule: "goal",
      measurement: "days",
    },
    {
      id: "57f02ab5-eb0a-4fb9-97bc-faa59e8f9fbe",
      name: "Gratitude Practice
  ];

  const histories = buildBalancedHistories(days, templates);

  return templates.map((template, index) => {
    const history = histories[index] ?? {};

    return {
      ...template,
      history,
      doneToday: (history[today] ?? 0) > 0,
    };
  });
}
