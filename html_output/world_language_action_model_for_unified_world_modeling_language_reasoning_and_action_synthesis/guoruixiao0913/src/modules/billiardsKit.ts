// Shared billiards drawing kit for the WLA tutorial.
//
// Every analogy card (560x140), hero side (560x140) and interactive module
// (1080x280) draws with these helpers so the whole page shares one scene
// vocabulary: the same felt, cushions, pockets, cue, ball and label style.
//
// Color roles follow the paper-skill contract (stable across the tutorial):
//   guide/current -> GUIDE, success/paper method -> SUCCESS, failure/old -> FAIL,
//   user-controlled emphasis -> EMPHASIS, auxiliary mechanism -> AUX.
// Semantic colors explain state; most pixels stay neutral (FIELD/FELT/FELT_DARK).

export const FIELD = '#f5f8f0';
export const FELT = '#b8c9a7';
export const FELT_DARK = '#76906a';
export const CUE_WOOD = '#92400e';
export const GUIDE = '#27446e';
export const SUCCESS = '#228d5c';
export const FAIL = '#c43f52';
export const EMPHASIS = '#f07e47';
export const AUX = '#7c3aed';
export const TEXT = '#21324a';
export const TEXT_MUTED = '#68778f';
export const BORDER = '#d7deea';

export const BALL_R = 10;
export const POCKET_R = 14;

export interface TableOptions {
  /** x positions of the drawn pockets (side pockets on the rail line). */
  pockets?: number[];
  /** top edge of the felt band */
  bandTop?: number;
  /** bottom edge of the felt band */
  bandBottom?: number;
  feltColor?: string;
}

export interface BallOptions {
  /** short label drawn inside the ball (<= 8 chars, usually omitted) */
  label?: string;
  /** ring color drawn around the ball (target / selected marker) */
  ring?: string;
  /** dashed outline, used for "imagined" or planned states */
  dashed?: boolean;
}

export interface CueOptions {
  tipColor?: string;
  /** shaft width in px */
  width?: number;
}

export interface LineOptions {
  color?: string;
  dashed?: boolean;
  width?: number;
}

export interface LabelOptions {
  align?: CanvasTextAlign;
  color?: string;
  size?: number;
}

export interface LegendItem {
  color: string;
  text: string;
}

/** Vertical bounds of the felt band for a canvas height. */
export function feltBounds(h: number, bandTop = 70, bandBottom = h - 70) {
  return { top: bandTop, bottom: bandBottom, mid: (bandTop + bandBottom) / 2 };
}

/** Quiet field plus shared ground: fill, cushions, pocket marks. */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = FIELD;
  ctx.fillRect(0, 0, w, h);
}

/** Felt band with cushions and pockets, drawn over the quiet field. */
export function drawTable(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  options: TableOptions = {},
): void {
  const bandTop = options.bandTop ?? 70;
  const bandBottom = options.bandBottom ?? h - 70;
  const pockets = options.pockets ?? [w - 96];
  const felt = options.feltColor ?? FELT;

  // cushions (depth) above and below the felt
  ctx.fillStyle = FELT_DARK;
  ctx.fillRect(40, bandTop - 16, Math.max(0, w - 80), 16);
  ctx.fillRect(40, bandBottom, Math.max(0, w - 80), 16);

  // felt
  ctx.fillStyle = felt;
  ctx.fillRect(40, bandTop, Math.max(0, w - 80), Math.max(0, bandBottom - bandTop));

  // pocket marks on the rail line
  pockets.forEach((px) => {
    ctx.beginPath();
    ctx.arc(px, bandTop - 8, POCKET_R * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = FELT_DARK;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, bandBottom + 8, POCKET_R * 0.6, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * A cue: the tip sits at (tipX, tipY) and the shaft extends backwards along
 * `angleRad + PI`. The tip carries `tipColor` so "chalked" states read clearly.
 */
export function drawCue(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  angleRad: number,
  length: number,
  options: CueOptions = {},
): void {
  const width = options.width ?? 6;
  const backX = tipX - Math.cos(angleRad) * length;
  const backY = tipY - Math.sin(angleRad) * length;

  ctx.save();
  ctx.lineCap = 'round';
  // shaft
  ctx.strokeStyle = CUE_WOOD;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(backX, backY);
  ctx.stroke();
  // butt
  ctx.lineWidth = width + 4;
  ctx.beginPath();
  ctx.moveTo(backX + Math.cos(angleRad) * length * 0.22, backY + Math.sin(angleRad) * length * 0.22);
  ctx.lineTo(backX, backY);
  ctx.stroke();
  // tip (皮头)
  ctx.fillStyle = options.tipColor ?? GUIDE;
  ctx.beginPath();
  ctx.arc(tipX, tipY, width * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A ball with an optional ring / dashed outline for planned or imagined states. */
export function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  options: BallOptions = {},
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = options.dashed ? TEXT_MUTED : FELT_DARK;
  if (options.dashed) ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  if (options.ring) {
    ctx.beginPath();
    ctx.arc(x, y, r + 7, 0, Math.PI * 2);
    ctx.strokeStyle = options.ring;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (options.label) {
    ctx.fillStyle = TEXT;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.label, x, y);
  }
  ctx.restore();
}

/** Aim / travel line. Dashed = planned, solid = active path. */
export function drawAimLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: LineOptions = {},
): void {
  ctx.save();
  ctx.strokeStyle = options.color ?? GUIDE;
  ctx.lineWidth = options.width ?? 1.5;
  if (options.dashed) ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Target resting spot or pocket marker. */
export function drawTargetSpot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  state: 'idle' | 'hit' | 'miss' = 'idle',
): void {
  const color = state === 'hit' ? SUCCESS : state === 'miss' ? FAIL : EMPHASIS;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (state === 'idle') ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** The only in-Canvas text: short labels (<= 8 chars) and bare numbers. */
export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: LabelOptions = {},
): void {
  ctx.save();
  ctx.fillStyle = options.color ?? TEXT;
  ctx.font = `${options.size ?? 13}px "Segoe UI", sans-serif`;
  ctx.textAlign = options.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** At most three legend entries. */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: LegendItem[],
  x: number,
  y: number,
): void {
  ctx.save();
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  items.slice(0, 3).forEach((item, i) => {
    const cy = y + i * 18;
    ctx.fillStyle = item.color;
    ctx.fillRect(x, cy - 5, 10, 10);
    ctx.fillStyle = TEXT_MUTED;
    ctx.fillText(item.text, x + 16, cy);
  });
  ctx.restore();
}
