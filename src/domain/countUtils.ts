export function toCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (value === true) {
    return 1;
  }

  return 0;
}
