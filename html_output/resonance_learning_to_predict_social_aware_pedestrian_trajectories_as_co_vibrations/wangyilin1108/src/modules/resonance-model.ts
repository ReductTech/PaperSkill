export type Point = readonly [number, number];
export type Observation = { t: number; position: Point };

export const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
export const scale = (p: Point, s: number): Point => [p[0] * s, p[1] * s];
export const distance = (a: Point, b: Point) => Math.hypot(...sub(a, b));
export const number = (n: number) => (Math.abs(n) < 0.005 ? 0 : n).toFixed(2);
export const last = <T,>(items: readonly T[]) => items[items.length - 1];

const y = [-.20, -.23, -.18, -.12, -.16, -.08, .04, .25];
export const history: Observation[] = y.map((v, t) => ({
  t,
  position: [-5.5 + t * .75, v],
}));

/** Least squares for position = intercept + slope × time, retaining real time indices. */
export function fitLine(points: readonly Observation[]) {
  const meanTime = points.reduce((sum, p) => sum + p.t, 0) / points.length;
  const meanPosition = scale(points.reduce<Point>((sum, p) => add(sum, p.position), [0, 0]), 1 / points.length);
  const variance = points.reduce((sum, p) => sum + (p.t - meanTime) ** 2, 0);
  const covariance = points.reduce<Point>((sum, p) =>
    add(sum, scale(sub(p.position, meanPosition), p.t - meanTime)), [0, 0]);
  const slope = scale(covariance, 1 / variance);
  return { slope, at: (time: number) => add(meanPosition, scale(slope, time - meanTime)) };
}

export const baseFit = fitLine(history);
export const positions = history.map(point => point.position);
export const future = Array.from({ length: 12 }, (_, i) => baseFit.at(i + 8));

/** Explicit toy displacement curves for visualizing the additive structure in Eq. (1). */
export function offsets(i: number, self = 1, social = 1) {
  const t = (i + 1) / 12;
  return {
    own: [0.36 * self * t, 2.05 * self * t ** 1.25] as Point,
    neighbor: [-1.35 * social * Math.sin(Math.PI * t / 2), .92 * social * Math.sin(Math.PI * t)] as Point,
  };
}

export function composed(self: number, social: number) {
  return future.map((base, i) => {
    const { own, neighbor } = offsets(i, self, social);
    return add(add(base, own), neighbor);
  });
}

export const align = (points: Point[]) => points.map(point => sub(point, last(points)));

/** Single-level orthonormal Haar; each row represents an adjacent pair of observations. */
export function haar(points: Point[]) {
  return Array.from({ length: points.length / 2 }, (_, pair) => {
    const a = points[pair * 2], b = points[pair * 2 + 1];
    return [...scale(add(a, b), Math.SQRT1_2), ...scale(sub(a, b), Math.SQRT1_2)];
  });
}

export function neighborTrack(endpoint: Point, pace: number, sway = .3): Point[] {
  return Array.from({ length: 8 }, (_, i) => {
    const t = i - 7;
    return add(endpoint, [t * pace * -.48, Math.sin(t * 1.1) * sway + t * -.09]);
  });
}

export function sector(point: Point) {
  const angle = (Math.atan2(point[1], point[0]) * 180 / Math.PI + 360) % 360;
  return { angle, index: Math.floor(angle / 45) };
}

export function metric(trajectory: Point[], truth: Point[]) {
  const errors = trajectory.map((point, i) => distance(point, truth[i]));
  return {
    ade: errors.reduce((sum, error) => sum + error, 0) / errors.length,
    fde: last(errors),
    l2: Math.hypot(...errors),
  };
}
