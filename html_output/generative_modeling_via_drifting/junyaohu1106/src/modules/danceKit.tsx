import React, { useCallback, useEffect, useRef } from 'react';
import type { Pt } from './driftCore';
import { clamp } from './driftCore';

// Shared drawing kit: one stage, one dancer, one tape mark. Colors follow contract.md §5
// and the paper's Fig. 2 (data = blue, generated = orange).
export const INK = { mark: '#27446e', dancer: '#f07e47', net: '#228d5c', bad: '#c43f52', aux: '#7c3aed', text: '#21324a', muted: '#68778f', axis: '#d7deea' };

export function StageFloor({ w, h, curtains = true }: { w: number; h: number; curtains?: boolean }) {
  const planks = Array.from({ length: Math.floor((h - 30) / 60) + 1 }, (_, i) => i);
  return <g aria-hidden="true">
    <rect width={w} height={h} fill="#f6efe2" />
    {planks.map(i => <line key={i} x1={0} x2={w} y1={i * 60 + 30} y2={i * 60 + 30} stroke="#e8dcc6" strokeWidth={2} />)}
    {curtains && <>
      <path d={`M0 0 H46 Q30 ${h / 2} 46 ${h} H0 Z`} fill="#4a5f7f" />
      <path d={`M${w} 0 H${w - 46} Q${w - 30} ${h / 2} ${w - 46} ${h} H${w} Z`} fill="#4a5f7f" />
      <path d={`M0 0 H${w} V14 Q${w / 2} 30 0 14 Z`} fill="#3b4e6b" />
    </>}
  </g>;
}

export function Dancer({ at, color = INK.dancer, scale = 1, opacity = 1 }: { at: Pt; color?: string; scale?: number; opacity?: number }) {
  return <g transform={`translate(${at[0]} ${at[1]}) scale(${scale})`} opacity={opacity} aria-hidden="true">
    <ellipse cy={3} rx={13} ry={4} fill="#21324a" opacity={0.14} />
    <path d="M-4 -12 L-6 2 M4 -12 L6 2" stroke="#6b4b3a" strokeWidth={3} strokeLinecap="round" />
    <path d="M0 -32 L12 -10 H-12 Z" fill={color} />
    <path d="M-2 -28 L-14 -40 M2 -28 L14 -40" stroke="#c3875c" strokeWidth={3} strokeLinecap="round" />
    <circle cy={-37} r={6.5} fill="#e5ae78" />
  </g>;
}

export function TapeMark({ at, size = 9, color = INK.mark, opacity = 1 }: { at: Pt; size?: number; color?: string; opacity?: number }) {
  const [x, y] = at;
  return <path d={`M${x - size} ${y - size} L${x + size} ${y + size} M${x + size} ${y - size} L${x - size} ${y + size}`}
    stroke={color} strokeWidth={5} strokeLinecap="round" opacity={opacity} aria-hidden="true" />;
}

export function Arrow({ from, vec, color, width = 7, maxLen = 260, label, box }: { from: Pt; vec: Pt; color: string; width?: number; maxLen?: number; label?: string; box?: [number, number] }) {
  const len = Math.hypot(vec[0], vec[1]);
  if (len < 3) return null;
  let k = Math.min(1, maxLen / len);
  if (box) {
    // Shorten, keeping the direction, so the tip and its head stay on stage.
    const room = (p: number, d: number, size: number) => (d > 0 ? (size - 16 - p) / d : d < 0 ? (16 - p) / d : Infinity);
    k = Math.max(0, Math.min(k, room(from[0], vec[0], box[0]), room(from[1], vec[1], box[1])));
    if (k * len < 3) return null;
  }
  const tx = from[0] + vec[0] * k;
  const ty = from[1] + vec[1] * k;
  const ux = (vec[0] / len) * 18;
  const uy = (vec[1] / len) * 18;
  return <g aria-hidden="true">
    <line x1={from[0]} y1={from[1]} x2={tx - ux * 0.6} y2={ty - uy * 0.6} stroke={color} strokeWidth={width} strokeLinecap="round" />
    <path d={`M${tx} ${ty} L${tx - ux - uy * 0.6} ${ty - uy + ux * 0.6} L${tx - ux + uy * 0.6} ${ty - uy - ux * 0.6} Z`} fill={color} />
    {label && <text x={box ? clamp(tx + ux * 0.8, 36, box[0] - 36) : tx + ux * 0.8} y={box ? clamp(ty + uy * 0.8 + 9, 30, box[1] - 8) : ty + uy * 0.8 + 9} textAnchor="middle" fontSize={28} fontWeight={750} fill={color} stroke="#f6efe2" strokeWidth={5} paintOrder="stroke">{label}</text>}
  </g>;
}

/** Ellipse cut off at the stage edge, so a wide temperature ring never leaves the stage. */
export function StageEllipse({ cx, cy, rx, ry, w, h, ...style }: { cx: number; cy: number; rx: number; ry: number; w: number; h: number } & React.SVGProps<SVGPolygonElement>) {
  const points = Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2;
    return `${clamp(cx + Math.cos(a) * rx, 1, w - 1).toFixed(1)},${clamp(cy + Math.sin(a) * ry, 1, h - 1).toFixed(1)}`;
  }).join(' ');
  return <polygon points={points} aria-hidden="true" {...style} />;
}

/** Pointer position in the SVG's own coordinates, correct under SlideStage scaling. */
export function svgPoint(svg: SVGSVGElement, e: { clientX: number; clientY: number }): Pt {
  const m = svg.getScreenCTM();
  if (!m) return [0, 0];
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return [p.x, p.y];
}

/** Drag on a target inside an svg, yielding to multi-touch (stage pinch zoom). */
export function useDrag(onMove: (p: Pt) => void, onEnd?: () => void) {
  const active = useRef(false);
  return {
    onPointerDown: (e: React.PointerEvent<SVGElement>) => {
      if (!e.isPrimary) return;
      active.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      const svg = e.currentTarget.ownerSVGElement ?? (e.currentTarget as unknown as SVGSVGElement);
      onMove(svgPoint(svg, e));
    },
    onPointerMove: (e: React.PointerEvent<SVGElement>) => {
      if (!active.current || !e.isPrimary) return;
      const svg = e.currentTarget.ownerSVGElement ?? (e.currentTarget as unknown as SVGSVGElement);
      onMove(svgPoint(svg, e));
    },
    onPointerUp: () => { if (active.current) { active.current = false; onEnd?.(); } },
    onPointerCancel: () => { if (active.current) { active.current = false; onEnd?.(); } },
  };
}

/** Arrow-key equivalent for a draggable point. */
export function keyMove(p: Pt, set: (next: Pt) => void, w: number, h: number) {
  return (e: React.KeyboardEvent) => {
    const step = 18;
    const d: Record<string, Pt> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = d[e.key];
    if (!move) return;
    e.preventDefault();
    set([clamp(p[0] + move[0], 0, w), clamp(p[1] + move[1], 0, h)]);
  };
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** requestAnimationFrame loop bound to the mounted component. */
export function useFrame(step: () => void, running: boolean) {
  const saved = useRef(step);
  saved.current = step;
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    const tick = () => { saved.current(); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
}

export function Slider({ label, value, min, max, step, onChange, display }: {
  label: React.ReactNode; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string;
}) {
  const handle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value)), [onChange]);
  return <label className="dk-slider">
    <span className="dk-slider-head"><span>{label}</span><b>{display}</b></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={handle} />
  </label>;
}

export function Feedback({ tone, children }: { tone: 'good' | 'mid' | 'bad'; children: React.ReactNode }) {
  return <div className={`dk-feedback is-${tone}`} aria-live="polite">{children}</div>;
}

export function Chips<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (id: T) => void }) {
  return <div className="dk-chips">{options.map(o =>
    <button key={o.id} type="button" className={value === o.id ? 'is-on' : ''} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>)}</div>;
}

/** Small static theme visual for technical and evidence pages. */
export function BowingDancers({ width = 300, height = 150 }: { width?: number; height?: number }) {
  return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="舞者在舞台上谢幕" className="dk-theme">
    <StageFloor w={width} h={height} curtains={false} />
    <path d={`M0 0 H26 Q18 ${height / 2} 26 ${height} H0 Z M${width} 0 H${width - 26} Q${width - 18} ${height / 2} ${width - 26} ${height} H${width} Z`} fill="#4a5f7f" />
    {[0.28, 0.5, 0.72].map((f, i) => <Dancer key={f} at={[width * f, height * 0.84]} scale={Math.min(1.7, (height * 0.78) / 46)} color={i === 1 ? INK.net : INK.dancer} />)}
  </svg>;
}
