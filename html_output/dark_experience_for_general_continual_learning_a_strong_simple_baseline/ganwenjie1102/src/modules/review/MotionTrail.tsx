import { curve, mix, type Point } from "./lifecycle-model";
import { useId } from 'react';

/** A short, already-travelled section behind a moving object, matching D1. */
export function MotionTrail({ points, progress, className }: {
  points: readonly [Point, Point, Point, Point];
  progress: number;
  className: string;
}) {
  const id=useId().replace(/:/g,'');
  if (progress <= .025 || progress >= .999) return null;
  const start = Math.max(0, progress - .32), end = Math.max(0, progress - .035);
  const a=curve(start,...points),b=curve(end,...points);
  const path = Array.from({ length: 16 }, (_, i) => {
    const p = curve(mix(start, end, i / 15), points[0], points[1], points[2], points[3]);
    return `${i ? "L" : "M"}${p.x} ${p.y}`;
  }).join(" ");
  return <g aria-hidden="true"><defs><linearGradient id={id} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}><stop stopColor="#668796" stopOpacity="0"/><stop offset="1" stopColor="#668796" stopOpacity=".9"/></linearGradient></defs><path d={path} className={className} data-trail-progress={progress}
    style={{stroke:`url(#${id})`,strokeDasharray:'none',strokeWidth:2.5}}
    opacity={Math.min(1, progress * 10, (1 - progress) * 12)} /></g>;
}
