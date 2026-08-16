/**
 * Pedagogical 2D nonlinear velocity field for §4.2 inference & §4.3 Euler demos.
 * NOT claimed as the paper's actual 2D action-space field.
 */

export interface Vec2 {
  x: number;
  y: number;
}

/** Shared teaching geometry — §4.2 inference & §4.3 must match. */
export const TEACHING_FIELD = {
  /** Y₀ clean target (τ=0, s=1) */
  Y_goal: { x: 190, y: 42 },
  /** Y₁ noise start (τ=1, s=0) */
  Y_start: { x: 50, y: 95 },
  /** Curvature amplitude (visual units) */
  A: 24,
  /** Pull-back strength toward reference curve */
  kappa: 3.0,
} as const;

export const TEACHING_NOTE =
  '二维教学速度场 · 用于说明 Euler 离散过程，非论文定量轨迹';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function unitPerp(dx: number, dy: number): Vec2 {
  const len = Math.hypot(dx, dy) || 1;
  return { x: -dy / len, y: dx / len };
}

/** s ∈ [0,1]: s=0 → τ=1 noise; s=1 → τ=0 clean */
export function sFromTau(tau: number): number {
  return 1 - tau;
}

export function tauFromS(s: number): number {
  return 1 - s;
}

/** Reference curved path C(s) = lerp(start, goal, s) + A·sin(πs)·n⊥ */
export function referencePath(s: number): Vec2 {
  const { Y_start, Y_goal, A } = TEACHING_FIELD;
  const dx = Y_goal.x - Y_start.x;
  const dy = Y_goal.y - Y_start.y;
  const n = unitPerp(dx, dy);
  const bx = lerp(Y_start.x, Y_goal.x, s);
  const by = lerp(Y_start.y, Y_goal.y, s);
  const bend = A * Math.sin(Math.PI * s);
  return { x: bx + bend * n.x, y: by + bend * n.y };
}

/** C'(s) = (Y_goal − Y_start) + Aπ cos(πs) n⊥ */
export function referenceDerivative(s: number): Vec2 {
  const { Y_start, Y_goal, A } = TEACHING_FIELD;
  const dx = Y_goal.x - Y_start.x;
  const dy = Y_goal.y - Y_start.y;
  const n = unitPerp(dx, dy);
  const bendD = A * Math.PI * Math.cos(Math.PI * s);
  return { x: dx + bendD * n.x, y: dy + bendD * n.y };
}

/** g(z,s) = C'(s) + κ·(C(s) − z) — pedagogical nonlinear velocity field */
export function velocityField(z: Vec2, s: number): Vec2 {
  const { kappa } = TEACHING_FIELD;
  const c = referencePath(s);
  const cd = referenceDerivative(s);
  return {
    x: cd.x + kappa * (c.x - z.x),
    y: cd.y + kappa * (c.y - z.y),
  };
}

export interface EulerNode extends Vec2 {
  tau: number;
  s: number;
  step: number;
}

/** True Euler integration: z_{i+1} = z_i + Δs · g(z_i, s_i) */
export function eulerPath(steps: number): EulerNode[] {
  const { Y_start } = TEACHING_FIELD;
  const ds = 1 / steps;
  const pts: EulerNode[] = [
    { x: Y_start.x, y: Y_start.y, tau: 1, s: 0, step: 0 },
  ];
  let z: Vec2 = { ...Y_start };

  for (let i = 0; i < steps; i++) {
    const s_i = i / steps;
    const v = velocityField(z, s_i);
    z = { x: z.x + ds * v.x, y: z.y + ds * v.y };
    const s_next = (i + 1) / steps;
    pts.push({
      x: z.x,
      y: z.y,
      tau: tauFromS(s_next),
      s: s_next,
      step: i + 1,
    });
  }
  return pts;
}

/** Sample reference curve for SVG path */
export function referenceCurvePoints(segments = 48): Vec2[] {
  return Array.from({ length: segments + 1 }, (_, i) => referencePath(i / segments));
}

/** Grid arrow samples for vector-field background at fixed s */
export function fieldArrows(
  cols: number,
  rows: number,
  x0: number,
  y0: number,
  w: number,
  h: number,
  s = 0.5,
  scale = 0.045
): { x1: number; y1: number; x2: number; y2: number }[] {
  const arrows: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = x0 + (c + 0.5) * (w / cols);
      const py = y0 + (r + 0.5) * (h / rows);
      const v = velocityField({ x: px, y: py }, s);
      const len = Math.hypot(v.x, v.y) || 1;
      const ux = (v.x / len) * len * scale;
      const uy = (v.y / len) * len * scale;
      arrows.push({ x1: px, y1: py, x2: px + ux, y2: py + uy });
    }
  }
  return arrows;
}
