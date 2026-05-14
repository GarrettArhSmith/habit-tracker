export function withActiveClass(baseClass: string, isActive: boolean): string {
  return isActive ? `${baseClass} active` : baseClass;
}
