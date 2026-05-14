type ThemeLike = "light" | "dark" | "system";

type SettingsLike = {
  theme: ThemeLike;
  push: boolean;
  email: boolean;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeTheme(theme: unknown): ThemeLike {
  return theme === "light" || theme === "dark" || theme === "system"
    ? theme
    : "system";
}

export function normalizeSettings(
  value: unknown,
  defaults: SettingsLike,
): SettingsLike {
  if (!isRecord(value)) {
    return defaults;
  }

  return {
    theme: normalizeTheme(value.theme),
    push: typeof value.push === "boolean" ? value.push : defaults.push,
    email: typeof value.email === "boolean" ? value.email : defaults.email,
  };
}

export function loadSavedState(storageKey: string): unknown {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persistSnapshot(storageKey: string, snapshot: unknown): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    // Ignore write failures (private mode / quota).
  }
}
