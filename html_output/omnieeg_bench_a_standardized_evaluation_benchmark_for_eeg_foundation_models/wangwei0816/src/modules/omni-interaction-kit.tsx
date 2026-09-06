import { useEffect, useRef, useState } from 'react';

export type Point = { x: number; y: number };

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function usePanelWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(900);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setWidth(node.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, width, mobile: width < 620 };
}

export function localPoint(event: React.PointerEvent<SVGElement>, viewWidth: number, viewHeight: number): Point {
  const svg = event.currentTarget instanceof SVGSVGElement
    ? event.currentTarget
    : event.currentTarget.ownerSVGElement;
  const rect = (svg ?? event.currentTarget).getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * viewWidth,
    y: ((event.clientY - rect.top) / rect.height) * viewHeight,
  };
}

export function WavePath({
  x,
  y,
  width,
  amp,
  phase = 0,
  color = '#245d87',
  opacity = 1,
  strokeWidth = 2,
}: {
  x: number;
  y: number;
  width: number;
  amp: number;
  phase?: number;
  color?: string;
  opacity?: number;
  strokeWidth?: number;
}) {
  const points: string[] = [];
  const count = Math.max(36, Math.round(width / 4));
  for (let i = 0; i <= count; i += 1) {
    const px = x + (i / count) * width;
    const t = i / count;
    const signal =
      Math.sin(t * Math.PI * 8 + phase) * 0.42 +
      Math.sin(t * Math.PI * 19 + phase * 0.7) * 0.22 +
      Math.sin(t * Math.PI * 43 + 1.1) * 0.08;
    points.push(`${px.toFixed(1)},${(y + signal * amp).toFixed(1)}`);
  }
  return (
    <polyline
      points={points.join(' ')}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}

export function SvgArrow({
  x1,
  y1,
  x2,
  y2,
  color = '#8a99aa',
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 7;
  const ax = x2 - Math.cos(angle) * size;
  const ay = y2 - Math.sin(angle) * size;
  const left = `${ax + Math.cos(angle + Math.PI / 2) * 4},${ay + Math.sin(angle + Math.PI / 2) * 4}`;
  const right = `${ax + Math.cos(angle - Math.PI / 2) * 4},${ay + Math.sin(angle - Math.PI / 2) * 4}`;
  return (
    <g aria-hidden="true">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" />
      <polygon points={`${x2},${y2} ${left} ${right}`} fill={color} />
    </g>
  );
}
