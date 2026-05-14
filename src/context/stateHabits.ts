import { normalizeHabit } from "../domain/habitNormalize";
import { createSeedHabits } from "../mocks/seedHabits";

export function resolveInitialHabits(params: {
  savedRecord: Record<string, unknown> | null;
  forcePreviewMocks: boolean;
  fallbackColor?: string;
}): ReturnType<typeof normalizeHabit>[] {
  const fallbackColor = params.fallbackColor ?? "#10b981";

  function normalizeFrom(
    source: unknown[],
  ): ReturnType<typeof normalizeHabit>[] {
    return source.map((habit) => normalizeHabit(habit, fallbackColor));
  }

  if (params.forcePreviewMocks) {
    return normalizeFrom(createSeedHabits());
  }

  const savedHabitsRaw = params.savedRecord?.habits;
  if (Array.isArray(savedHabitsRaw) && savedHabitsRaw.length > 0) {
    return normalizeFrom(savedHabitsRaw);
  }

  return [];
}
