import type { Vector2 } from "./icarl-runtime";

export type HerdingChartPoint = { x: number; y: number };

export const HERDING_CHART = {
  width: 620,
  height: 620,
  center: { x: 310, y: 310 },
  radius: 232,
  topAngleDeg: -90,
} as const;

/** Project a feature into the fixed chart without changing distances except for the chart scale. */
export function projectHerdingFeature(vector: Vector2): HerdingChartPoint {
  return {
    x: HERDING_CHART.center.x + vector[0] * HERDING_CHART.radius,
    y: HERDING_CHART.center.y - vector[1] * HERDING_CHART.radius,
  };
}

/** Clockwise sweep from the top of the SVG circle to an already projected point. */
export function clockwiseOffsetFromTop(point: HerdingChartPoint): number {
  const angle = (Math.atan2(point.y - HERDING_CHART.center.y, point.x - HERDING_CHART.center.x) * 180) / Math.PI;
  const offset = angle - HERDING_CHART.topAngleDeg;
  return ((offset % 360) + 360) % 360;
}
