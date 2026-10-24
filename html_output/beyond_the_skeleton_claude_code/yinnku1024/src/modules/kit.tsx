import React from 'react';

/* 体检中心视觉组件库：科室牌、体检单行、印章与计量条。 */

export const HW = {
  ink: '#21324a',
  muted: '#68778f',
  line: '#d8e3dc',
  lineStrong: '#b4c7bc',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  teal: '#5c7a72',
  tealDark: '#3f564f',
  mint: '#e9f2ed',
  white: '#ffffff',
  panel: '#f7faf8',
};

export type Tone = 'blue' | 'green' | 'red' | 'orange' | 'teal';
export type FeedbackTone = 'good' | 'bad' | 'neutral';

/* 统一反馈条：整页只有这一处下判断。 */
export function Feedback({ tone, children }: { tone: FeedbackTone; children: React.ReactNode }) {
  return <div className="hw-feedback" data-tone={tone} role="status">{children}</div>;
}

export function Meter({ label, value, max = 100, tone = 'blue', readout }: {
  label: string; value: number; max?: number; tone?: Tone; readout?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="hw-meter" data-tone={tone}>
      <span><b>{label}</b><em>{readout ?? `${Math.round(pct)}%`}</em></span>
      <b><i style={{ width: `${pct}%` }} /></b>
    </div>
  );
}

export function Switch({ checked, onChange, children }: {
  checked: boolean; onChange: (next: boolean) => void; children: React.ReactNode;
}) {
  return (
    <button type="button" className="hw-switch" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <i aria-hidden="true" />{children}
    </button>
  );
}

export function Num({ n }: { n: number | string }) {
  return <span className="hw-num">{n}</span>;
}

export function Dept({ children }: { children: React.ReactNode }) {
  return <span className="hw-dept">{children}</span>;
}

export function Stamp({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'red' | 'blue' }) {
  const color = tone === 'red' ? HW.red : tone === 'blue' ? HW.blue : HW.green;
  return <span className="hw-stamp" style={{ color }}>{children}</span>;
}
