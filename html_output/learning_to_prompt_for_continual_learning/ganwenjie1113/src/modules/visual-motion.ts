import { useLayoutEffect, useState } from "react";

export type MotionPoint = Readonly<{ x: number; y: number }>;
export type MotionAnchors = Readonly<{
  width: number;
  height: number;
  points: Readonly<Record<string, MotionPoint>>;
}>;

export function useMotionAnchors(rootRef: { current: HTMLElement | null }) {
  const [geometry, setGeometry] = useState<MotionAnchors | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!root.isConnected) return;
        const rootRect = root.getBoundingClientRect();
        const points: Record<string, MotionPoint> = {};
        root.querySelectorAll<HTMLElement>("[data-motion-anchor]").forEach(element => {
          const name = element.dataset.motionAnchor;
          if (!name) return;
          const rect = element.getBoundingClientRect();
          points[name] = {
            x: rect.left - rootRect.left + rect.width / 2,
            y: rect.top - rootRect.top + rect.height / 2,
          };
        });
        const next = { width: rootRect.width, height: rootRect.height, points };
        setGeometry(previous => {
          if (previous && Math.abs(previous.width - next.width) < 0.5 && Math.abs(previous.height - next.height) < 0.5) {
            const names = Object.keys(points);
            if (names.length === Object.keys(previous.points).length && names.every(name => {
              const before = previous.points[name];
              return before && Math.abs(before.x - points[name].x) < 0.5 && Math.abs(before.y - points[name].y) < 0.5;
            })) return previous;
          }
          return next;
        });
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll<HTMLElement>("[data-motion-anchor]").forEach(element => observer.observe(element));
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [rootRef]);

  return geometry;
}

function bezierCoordinate(t: number, first: number, second: number) {
  const inverse = 1 - t;
  return 3 * inverse * inverse * t * first + 3 * inverse * t * t * second + t * t * t;
}

export function easeMotion(value: number) {
  const progress = Math.max(0, Math.min(1, value));
  let low = 0;
  let high = 1;
  let parameter = progress;
  for (let iteration = 0; iteration < 14; iteration += 1) {
    parameter = (low + high) / 2;
    if (bezierCoordinate(parameter, 0.77, 0.175) < progress) low = parameter;
    else high = parameter;
  }
  return bezierCoordinate(parameter, 0, 1);
}

export function pointOnCurve(start: MotionPoint, end: MotionPoint, progress: number, offset = 0): MotionPoint {
  const t = easeMotion(progress);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lift = Math.min(84, Math.max(22, Math.abs(dy) * 0.13 + Math.abs(dx) * 0.025)) + offset;
  const first = { x: start.x + dx * 0.28, y: start.y + dy * 0.18 - lift };
  const second = { x: start.x + dx * 0.72, y: end.y - dy * 0.18 - lift };
  const inverse = 1 - t;
  return {
    x: inverse ** 3 * start.x + 3 * inverse ** 2 * t * first.x + 3 * inverse * t ** 2 * second.x + t ** 3 * end.x,
    y: inverse ** 3 * start.y + 3 * inverse ** 2 * t * first.y + 3 * inverse * t ** 2 * second.y + t ** 3 * end.y,
  };
}

export function curvePath(start: MotionPoint, end: MotionPoint, offset = 0) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lift = Math.min(84, Math.max(22, Math.abs(dy) * 0.13 + Math.abs(dx) * 0.025)) + offset;
  const firstX = start.x + dx * 0.28;
  const firstY = start.y + dy * 0.18 - lift;
  const secondX = start.x + dx * 0.72;
  const secondY = end.y - dy * 0.18 - lift;
  return `M ${start.x} ${start.y} C ${firstX} ${firstY}, ${secondX} ${secondY}, ${end.x} ${end.y}`;
}
