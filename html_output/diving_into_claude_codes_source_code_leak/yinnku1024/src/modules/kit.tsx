import React from 'react';

/* 印刷厂视觉组件库。所有页面共用同一套纸页、油墨与计量条，
   让 13 页保持同一种"在印厂里翻校样"的观感，而不是每页各画一套。 */

export const INK = {
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  paper: '#fffef9',
  edge: '#e4dcc6',
  edgeStrong: '#cfc4a6',
  wood: '#92400e',
  moss: '#76906a',
  mossSoft: '#b8c9a7',
};

export type Tone = 'blue' | 'green' | 'red' | 'orange';
export type FeedbackTone = 'good' | 'bad' | 'neutral';

/* 统一反馈条：good 正常态、bad 风险态、neutral 未完成。
   全页只允许这一处出现"判定"语气，避免操作提示和结论混在一起。 */
export function Feedback({ tone, children }: { tone: FeedbackTone; children: React.ReactNode }) {
  return <div className="ps-feedback" data-tone={tone} role="status">{children}</div>;
}

/* 计量条：value/max 只用于显示比例，readout 允许出现"3 / 8"这类精确值。 */
export function Meter({ label, value, max = 100, tone = 'blue', readout }: {
  label: string; value: number; max?: number; tone?: Tone; readout?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="ps-meter" data-tone={tone}>
      <span><b>{label}</b><em>{readout ?? `${Math.round(pct)}%`}</em></span>
      <b><i style={{ width: `${pct}%` }} /></b>
    </div>
  );
}

/* 开关用 button[role=switch]，键盘空格/回车可用；焦点样式来自全局 button:focus-visible。 */
export function Switch({ checked, onChange, children }: {
  checked: boolean; onChange: (next: boolean) => void; children: React.ReactNode;
}) {
  return (
    <button type="button" className="ps-switch" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <i aria-hidden="true" />{children}
    </button>
  );
}

/* 纸页图元：右上折角代表"校样"，虚线描边代表"未核验"。 */
export function Sheet({ x = 0, y = 0, w = 150, h = 190, tone = INK.edgeStrong, fill = INK.paper,
  lines = 3, dash = false, children }: {
  x?: number; y?: number; w?: number; h?: number; tone?: string; fill?: string;
  lines?: number; dash?: boolean; children?: React.ReactNode;
}) {
  const fold = Math.min(28, w * 0.16);
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M12 0 H${w - fold} L${w} ${fold} V${h - 12} Q${w} ${h} ${w - 12} ${h} H12 Q0 ${h} 0 ${h - 12} V12 Q0 0 12 0 Z`}
        fill={fill} stroke={tone} strokeWidth={3} strokeDasharray={dash ? '9 7' : undefined} />
      <path d={`M${w - fold} 0 V${fold} H${w}`} fill="none" stroke={tone} strokeWidth={3} />
      {Array.from({ length: lines }, (_, i) => (
        <rect key={i} x={18} y={44 + i * 26} width={Math.max(20, w - 44 - (i % 3) * 16)} height={8} rx={4} fill={tone} opacity={0.45} />
      ))}
      {children}
    </g>
  );
}

/* 橡皮图章：只用于"已核验/风险"这类状态，旋转 -4° 让它像真的盖上去。 */
export function Stamp({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'red' | 'blue' }) {
  const color = tone === 'red' ? INK.red : tone === 'blue' ? INK.blue : INK.green;
  return <span className="ps-stamp" style={{ color }}>{children}</span>;
}

export function Dot({ tone = 'blue' }: { tone?: Tone }) {
  const color = tone === 'green' ? INK.green : tone === 'red' ? INK.red : tone === 'orange' ? INK.orange : INK.blue;
  return <span aria-hidden="true" style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 999, background: color }} />;
}

/* 序号圆点：沿用同一套蓝色，只有"未完成"才退成米色。 */
export function Step({ n, muted = false }: { n: number | string; muted?: boolean }) {
  return <span className={`ps-num${muted ? ' ps-num--muted' : ''}`}>{n}</span>;
}
