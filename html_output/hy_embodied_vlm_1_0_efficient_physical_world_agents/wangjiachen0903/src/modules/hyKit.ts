// Shared Canvas palette and label helper for paper-specific widgets.
// Semantic color roles follow contract.md §5.

export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
};

export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 11, color = C.ink): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "PingFang SC", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}
