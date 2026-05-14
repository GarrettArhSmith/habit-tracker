// Generates a color scale array: [blank, shade1, shade2, shade3, shade4]
// Uses opacity blending to keep colors saturated while respecting blank color and theme
export function generateColorScale(
  base: string,
  blankColor?: string,
): string[] {
  const blank = blankColor ?? "var(--track)";
  // Convert hex to RGB for opacity blending
  const rgb = hexToRGB(base);
  // Build scale with increasing opacity of base color
  // This keeps saturation high while naturally blending with blank in all themes
  const scale = [
    blank,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`,
    base,
  ];
  return scale;
}

function hexToRGB(hex: string) {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    const r = c.charAt(0);
    const g = c.charAt(1);
    const b = c.charAt(2);
    c = `${r}${r}${g}${g}${b}${b}`;
  }

  const parseChannel = (value: string): number => {
    const parsed = Number.parseInt(value, 16);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const r = parseChannel(c.substring(0, 2));
  const g = parseChannel(c.substring(2, 4));
  const b = parseChannel(c.substring(4, 6));
  return { r, g, b };
}
