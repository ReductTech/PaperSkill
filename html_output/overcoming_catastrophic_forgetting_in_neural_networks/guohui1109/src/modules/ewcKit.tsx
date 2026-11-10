// Shared drawing kit for the "mixing console" theme (paper-specific helper, not a widget).
import React, { useEffect, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { CHANNELS, FADER_MAX, Vec } from './ewcMath';

export { SymbolHint };

// Semantic palette from contract.md §5.
export const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed',
  text: '#21324a', muted: '#68778f', border: '#d7deea', white: '#ffffff',
};
export const FONT = '"Segoe UI","PingFang SC","Hiragino Sans GB",Arial,sans-serif';
export const T = { body: 28, head: 34, big: 44 };

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const fmt = (v: number, d = 2) => (Math.abs(v) < 0.005 && d <= 2 ? 0 : v).toFixed(d);

/** Animate a numeric vector toward `target`; honours prefers-reduced-motion and cancels on unmount. */
export function useTweenVec(target: Vec, ms = 900): Vec {
  const [shown, setShown] = useState<Vec>(target);
  const shownRef = useRef<Vec>(target);
  useEffect(() => {
    const from = shownRef.current;
    const same = from.length === target.length && from.every((v, i) => Math.abs(v - target[i]) < 1e-4);
    if (same) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || ms <= 0) {
      shownRef.current = target; setShown(target); return;
    }
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = clamp((now - t0) / ms, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      const next = from.map((v, i) => v + (target[i] - v) * e);
      shownRef.current = next; setShown(next);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.join(','), ms]);
  return shown;
}

/** Convert a pointer position into the local user space of an SVG element (handles stage scaling and zoom). */
export function svgPoint(el: Element, clientX: number, clientY: number): { x: number; y: number } | null {
  const m = (el as SVGGraphicsElement).getScreenCTM();
  if (!m) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

/** Pointer + keyboard props for a draggable SVG handle. `onPoint` receives local coordinates. */
export function dragHandle(onPoint: (p: { x: number; y: number }) => void, onKey?: (key: string, shift: boolean) => void) {
  return {
    style: { cursor: 'grab', touchAction: 'none' } as React.CSSProperties,
    tabIndex: 0,
    onPointerDown: (e: React.PointerEvent<SVGElement>) => {
      if (!e.isPrimary) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const p = svgPoint(e.currentTarget, e.clientX, e.clientY); if (p) onPoint(p);
    },
    onPointerMove: (e: React.PointerEvent<SVGElement>) => {
      if (!e.isPrimary || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const p = svgPoint(e.currentTarget, e.clientX, e.clientY); if (p) onPoint(p);
    },
    onKeyDown: (e: React.KeyboardEvent<SVGElement>) => {
      if (!onKey || !e.key.startsWith('Arrow')) return;
      e.preventDefault(); onKey(e.key, e.shiftKey);
    },
  };
}

/** Plot a sampled function as an SVG polyline path. */
export function curvePath(f: (x: number) => number, x0: number, x1: number, n: number, mapX: (x: number) => number, mapY: (y: number) => number): string {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    d += `${i ? 'L' : 'M'}${mapX(x).toFixed(1)} ${mapY(f(x)).toFixed(1)}`;
  }
  return d;
}

export interface FaderProps {
  cx: number; top: number; h: number; value: number;
  label?: string; anchor?: number; target?: number; stiffness?: number;
  max?: number; color?: string; onChange?: (v: number) => void; locked?: boolean;
  grooveW?: number; showValue?: boolean; capW?: number; labelSize?: number; ariaLabel?: string;
}

const valueToY = (v: number, top: number, h: number, max: number) => top + h * (1 - clamp(v, 0, max) / max);

/** Zig-zag rubber band / spring between two y positions on the right of the fader. */
export function Spring({ x, y1, y2, width, color = C.support, opacity = 1 }:
  { x: number; y1: number; y2: number; width: number; color?: string; opacity?: number }) {
  const n = 8, amp = 11;
  const pts: string[] = [`${x},${y1}`];
  for (let i = 1; i <= n; i++) {
    const y = y1 + ((y2 - y1) * i) / (n + 1);
    pts.push(`${x + (i % 2 ? amp : -amp)},${y}`);
  }
  pts.push(`${x},${y2}`);
  return <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round"
    strokeLinecap="round" opacity={opacity} aria-hidden="true" />;
}

export function Fader(p: FaderProps) {
  const max = p.max ?? FADER_MAX;
  const cap = p.capW ?? 64, gw = p.grooveW ?? 12;
  const y = valueToY(p.value, p.top, p.h, max);
  const set = (el: SVGGraphicsElement, clientX: number, clientY: number) => {
    const m = el.getScreenCTM(); if (!m || !p.onChange) return;
    const pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    p.onChange(clamp((1 - (pt.y - p.top) / p.h) * max, 0, max));
  };
  const interactive = !!p.onChange && !p.locked;
  const color = p.color ?? C.blue;
  return <g>
    <rect x={p.cx - gw / 2} y={p.top} width={gw} height={p.h} rx={gw / 2} fill="#dfe7d6" stroke={C.dark} strokeWidth="2" />
    {[0, 0.25, 0.5, 0.75, 1].map(k => <line key={k} x1={p.cx - cap / 2 - 8} x2={p.cx - cap / 2 - 1} y1={p.top + p.h * k} y2={p.top + p.h * k} stroke={C.light} strokeWidth="3" />)}
    {p.stiffness !== undefined && p.anchor !== undefined && Math.abs(p.value - p.anchor) > 0.004 &&
      <Spring x={p.cx + cap / 2 + 22} y1={valueToY(p.anchor, p.top, p.h, max)} y2={y}
        width={2 + 1.15 * Math.sqrt(p.stiffness)} opacity={0.9} />}
    {p.anchor !== undefined && <g aria-hidden="true">
      <rect x={p.cx - cap / 2 - 6} y={valueToY(p.anchor, p.top, p.h, max) - 6} width={cap + 12} height="12" rx="3"
        fill="none" stroke={C.blue} strokeWidth="3" strokeDasharray="7 5" />
    </g>}
    {p.target !== undefined && <polygon aria-hidden="true" fill={C.orange}
      points={`${p.cx + cap / 2 + 2},${valueToY(p.target, p.top, p.h, max)} ${p.cx + cap / 2 + 16},${valueToY(p.target, p.top, p.h, max) - 9} ${p.cx + cap / 2 + 16},${valueToY(p.target, p.top, p.h, max) + 9}`} />}
    <rect x={p.cx - cap / 2} y={y - 17} width={cap} height="34" rx="9" fill={p.locked ? '#9fb0c8' : color}
      stroke={C.text} strokeWidth="2.5" />
    <line x1={p.cx - cap / 2 + 9} x2={p.cx + cap / 2 - 9} y1={y} y2={y} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    {p.locked && <g transform={`translate(${p.cx + cap / 2 + 8} ${y - 36})`} aria-hidden="true">
      <rect x="0" y="12" width="26" height="20" rx="4" fill={C.support} />
      <path d="M5 12 V7 a8 8 0 0 1 16 0 V12" fill="none" stroke={C.support} strokeWidth="4" />
    </g>}
    {interactive && <rect x={p.cx - cap / 2 - 14} y={p.top - 26} width={cap + 28} height={p.h + 52} fill="transparent"
      style={{ cursor: 'grab', touchAction: 'none' }} tabIndex={0} role="slider"
      aria-label={p.ariaLabel ?? `${p.label ?? '推子'}位置`} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Number(p.value.toFixed(2))}
      onPointerDown={e => { if (!e.isPrimary) return; e.currentTarget.setPointerCapture(e.pointerId); set(e.currentTarget, e.clientX, e.clientY); }}
      onPointerMove={e => { if (e.isPrimary && e.currentTarget.hasPointerCapture(e.pointerId)) set(e.currentTarget, e.clientX, e.clientY); }}
      onKeyDown={e => {
        const step = e.shiftKey ? 0.1 : 0.02;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); p.onChange!(clamp(p.value + step, 0, max)); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); p.onChange!(clamp(p.value - step, 0, max)); }
      }} />}
    {p.label && <text x={p.cx} y={p.top + p.h + 38} textAnchor="middle" fontSize={p.labelSize ?? T.body} fontWeight="700" fill={C.text} fontFamily={FONT}>{p.label}</text>}
    {p.showValue && <text x={p.cx} y={p.top - 34} textAnchor="middle" fontSize={T.body} fill={C.muted} fontFamily={FONT}>{fmt(p.value)}</text>}
  </g>;
}

/** A row of four channel faders. */
export function Console({ theta, anchors, F, targets, onChange, left, top, h, gap, locked, color, labelSize, capW }:
  { theta: Vec; anchors?: Vec; F?: Vec; targets?: Vec; onChange?: (i: number, v: number) => void;
    left: number; top: number; h: number; gap: number; locked?: boolean[]; color?: string; labelSize?: number; capW?: number }) {
  return <g>
    {theta.map((v, i) => <Fader key={i} cx={left + gap * i} top={top} h={h} value={v} label={CHANNELS[i]}
      anchor={anchors?.[i]} stiffness={F?.[i]} target={targets?.[i]} color={color} labelSize={labelSize} capW={capW}
      locked={locked?.[i]} onChange={onChange ? (x => onChange(i, x)) : undefined} />)}
  </g>;
}

export function Bar({ x, y, w, h = 30, value, max, color, label, valueText, labelW = 0 }:
  { x: number; y: number; w: number; h?: number; value: number; max: number; color: string; label?: string; valueText?: string; labelW?: number }) {
  const bw = clamp(value / max, 0, 1) * w;
  return <g>
    {label && <text x={x} y={y - 10} fontSize={T.body} fill={C.text} fontWeight="700" fontFamily={FONT}>{label}</text>}
    <rect x={x + labelW} y={y} width={w} height={h} rx={h / 2} fill="#eef2ea" stroke={C.border} strokeWidth="2" />
    <rect x={x + labelW} y={y} width={Math.max(bw, value > 0 ? h * 0.5 : 0)} height={h} rx={h / 2} fill={color} />
    {valueText && <text x={x + labelW + w + 14} y={y + h / 2 + 10} fontSize={T.body} fill={C.text} fontWeight="700" fontFamily={FONT}>{valueText}</text>}
  </g>;
}

/** Console-shaped panel background used by most pages. */
export function ConsoleBody({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <g aria-hidden="true">
    <rect x={x} y={y} width={w} height={h} rx="26" fill="#eef3e7" stroke={C.dark} strokeWidth="3" />
    <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} rx="18" fill="none" stroke={C.light} strokeWidth="2" />
  </g>;
}

/** Small decorative console used as the recurring theme visual on technical pages. */
export function MiniConsole({ x, y, scale = 1, values = [0.7, 0.35, 0.6, 0.45], locked = [] as boolean[] }:
  { x: number; y: number; scale?: number; values?: Vec; locked?: boolean[] }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden="true">
    <rect x="0" y="0" width="190" height="130" rx="18" fill="#eef3e7" stroke={C.dark} strokeWidth="3" />
    {values.map((v, i) => {
      const cx = 30 + i * 43, yy = 20 + 90 * (1 - v / FADER_MAX);
      return <g key={i}>
        <rect x={cx - 4} y="16" width="8" height="98" rx="4" fill="#dfe7d6" stroke={C.dark} strokeWidth="1.5" />
        <rect x={cx - 14} y={yy - 8} width="28" height="16" rx="5" fill={locked[i] ? C.support : C.blue} stroke={C.text} strokeWidth="1.5" />
      </g>;
    })}
  </g>;
}

/** Equation fragment helper: <S m="…">x</S> shows a Chinese symbol hint on hover/focus/tap. */
export function S({ m, children }: { m: string; children: React.ReactNode }) {
  return <SymbolHint meaning={m}><i>{children}</i></SymbolHint>;
}

export function Slider({ label, value, min, max, step, onChange, display, color }:
  { label: React.ReactNode; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string; color?: string }) {
  return <label className="ewc-slider">
    <span><strong>{label}</strong><b style={color ? { color } : undefined}>{display}</b></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
  </label>;
}

export function Verdict({ tone, children }: { tone: 'good' | 'bad' | 'info'; children: React.ReactNode }) {
  return <div className={`ewc-verdict is-${tone}`} aria-live="polite">{children}</div>;
}
