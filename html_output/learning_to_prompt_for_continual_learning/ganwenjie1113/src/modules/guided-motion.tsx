
import type { MotionPoint } from "./visual-motion";

export function DiagramParameter({ symbol, index }: { symbol: string; index: number | string }) {
  return <tspan className="motion-parameter">
    <tspan>{symbol}</tspan><tspan className="motion-parameter-index" dy=".24em">{index}</tspan>
  </tspan>;
}

export const blend = (start: number, end: number, amount: number) => start + (end - start) * amount;

export function elapsed(time: number, start: number, end: number) {
  return Math.max(0, Math.min(1, (time - start) / (end - start)));
}

export function arrive(time: number, start: number, end: number) {
  const t = elapsed(time, start, end);
  return t * t * (3 - 2 * t);
}

export type MotionCurve = readonly [MotionPoint, MotionPoint, MotionPoint, MotionPoint];

export function curvePosition([a, b, c, d]: MotionCurve, t: number) {
  const u = 1 - t;
  return {
    x: u ** 3 * a.x + 3 * u ** 2 * t * b.x + 3 * u * t ** 2 * c.x + t ** 3 * d.x,
    y: u ** 3 * a.y + 3 * u ** 2 * t * b.y + 3 * u * t ** 2 * c.y + t ** 3 * d.y,
  };
}

export function MotionTrace({ curve, progress, color, opacity = 1 }: {
  curve: MotionCurve; progress: number; color: string; opacity?: number;
}) {
  const [a, b, c, d] = curve;
  return <g aria-hidden="true" opacity={opacity}>
    <path d={`M${a.x} ${a.y} C${b.x} ${b.y},${c.x} ${c.y},${d.x} ${d.y}`}
      stroke={color} fill="none" opacity=".24" />
    {Array.from({ length: 10 }, (_, i) => {
      const t = progress - i * .024;
      if (t <= 0 || t >= 1) return null;
      const point = curvePosition(curve, t);
      return <circle key={i} cx={point.x} cy={point.y} r={i === 0 ? 3 : 1.9} fill={color}
        opacity={Math.min(t / .07, (1 - progress) / .075, 1) * (1 - i / 10)} />;
    })}
  </g>;
}
