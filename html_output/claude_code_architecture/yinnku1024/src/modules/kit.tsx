import React from 'react';

/* 调度所视觉组件库：信号灯、铭牌、轨道与计量条。
   所有页面共用同一套线宽与圆角，让 13 页看起来像同一张控制室图纸。 */

export const RW = {
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  lineStrong: '#b9c4d3',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  steel: '#5b6b7f',
  steelDark: '#3c4a5c',
  rail: '#8795a6',
  sleeper: '#8a6a4a',
  panel: '#f7f9fc',
  white: '#ffffff',
};

export type Tone = 'blue' | 'green' | 'red' | 'orange' | 'steel';
export type FeedbackTone = 'good' | 'bad' | 'neutral';

/* 统一反馈条：good 通过、bad 风险、neutral 未完成。整页只有这一处下判断。 */
export function Feedback({ tone, children }: { tone: FeedbackTone; children: React.ReactNode }) {
  return <div className="rw-feedback" data-tone={tone} role="status">{children}</div>;
}

export function Meter({ label, value, max = 100, tone = 'blue', readout }: {
  label: string; value: number; max?: number; tone?: Tone; readout?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="rw-meter" data-tone={tone}>
      <span><b>{label}</b><em>{readout ?? `${Math.round(pct)}%`}</em></span>
      <b><i style={{ width: `${pct}%` }} /></b>
    </div>
  );
}

/* 开关用 button[role=switch]，空格/回车可用。 */
export function Switch({ checked, onChange, children }: {
  checked: boolean; onChange: (next: boolean) => void; children: React.ReactNode;
}) {
  return (
    <button type="button" className="rw-switch" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <i aria-hidden="true" />{children}
    </button>
  );
}

/* 信号灯：on=通过，warn=用户可调，off=故障。 */
export function Signal({ state = 'off', label }: { state?: 'on' | 'warn' | 'off'; label?: string }) {
  return <span className="rw-signal" data-state={state}><i aria-hidden="true" />{label}</span>;
}

export function Plate({ children, tone = 'blue' }: { children: React.ReactNode; tone?: Tone }) {
  const color = tone === 'green' ? RW.green : tone === 'red' ? RW.red : tone === 'orange' ? RW.orange : tone === 'steel' ? RW.steel : RW.blue;
  return <span className="rw-plate" style={{ color }}>{children}</span>;
}

export function Num({ n, tone = 'blue' }: { n: number | string; tone?: 'blue' | 'steel' | 'muted' }) {
  const cls = tone === 'steel' ? ' rw-num--steel' : tone === 'muted' ? ' rw-num--muted' : '';
  return <span className={`rw-num${cls}`}>{n}</span>;
}

/* 一节车厢：用于封面和工具页，车身宽度由调用方给。 */
export function Car({ x, y, w = 120, h = 46, color = RW.steel, label }: {
  x: number; y: number; w?: number; h?: number; color?: string; label?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="6" fill={color} opacity="0.16" />
      <rect width={w} height={h} rx="6" fill="none" stroke={color} strokeWidth="3" />
      <rect x="10" y={h - 10} width={w - 20} height="4" rx="2" fill={color} opacity="0.45" />
      {label ? <text x={w / 2} y={h / 2 + 10} textAnchor="middle" fill={color} fontSize="30">{label}</text> : null}
    </g>
  );
}
