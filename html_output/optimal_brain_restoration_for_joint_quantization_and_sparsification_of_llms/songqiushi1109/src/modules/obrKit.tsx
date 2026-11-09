import React from 'react';

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const fmt = (v: number, d = 2) => Number(v.toFixed(d)).toString();

export type Tone = 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'none';

// 语义配色严格对应 contract.md §5。
const TONE_HEX: Record<Tone, string> = {
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  none: '#9aa7ba',
};

export function toneHex(tone: Tone): string {
  return TONE_HEX[tone];
}

export function Slider({ label, value, min, max, step, unit = '', onChange, format }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <label className="obr-slider">
      <span className="obr-slider-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
      <b className="obr-slider-value">{format ? format(value) : fmt(value)}{unit}</b>
    </label>
  );
}

export function SegButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" className={`obr-btn ${active ? 'is-active' : ''}`}
      onClick={onClick} aria-pressed={active}>{children}</button>
  );
}

export function Feedback({ children, tone = 'blue' }: {
  children: React.ReactNode; tone?: 'blue' | 'green' | 'red' | 'orange';
}) {
  const cls = tone === 'green' ? 'good' : tone === 'red' ? 'bad' : tone === 'orange' ? 'warn' : '';
  return <div className={`obr-feedback ${cls}`} aria-live="polite"><span className="obr-feedback-text">{children}</span></div>;
}

// 一排书的书脊：搬家整理书架主题的复用视觉元素。厚度代表权重幅值，颜色由语义 tone 决定。
export function BookSpines({ values, tones, height = 150, maxAbs = 1, x = 0, y = 0, baseline = 0 }: {
  values: number[]; tones: Tone[]; height?: number; maxAbs?: number; x?: number; y?: number; baseline?: number;
}) {
  const n = values.length;
  const slotW = 52;
  const total = n * slotW;
  return (
    <g aria-hidden="true">
      {values.map((v, i) => {
        const a = Math.abs(v);
        const h = Math.max(18, (a / maxAbs) * height);
        const t = tones[i] ?? 'none';
        const fill = t === 'none' ? '#c9d3e0' : TONE_HEX[t];
        const cx = x + i * slotW + slotW / 2;
        const by = y + baseline;
        return (
          <g key={i}>
            <rect x={cx - 14} y={by - h} width={28} height={h} rx={4} fill={fill} opacity={0.92} />
            <rect x={cx - 14} y={by - h} width={28} height={6} rx={3} fill="#ffffff" opacity={0.35} />
          </g>
        );
      })}
      <line x1={x} y1={y + baseline + 3} x2={x + total} y2={y + baseline + 3} stroke="#c3ccd9" strokeWidth={3} />
    </g>
  );
}

// 一行权重（技术图形）：每个权重是一个单元格，可标注 prune(红)/retain(蓝)/compensated(绿)/quantized(紫)。
export function WeightRow({ values, states, cell = 44, gap = 5, x = 0, y = 0 }: {
  values: number[]; states: Tone[]; cell?: number; gap?: number; x?: number; y?: number;
}) {
  return (
    <g aria-hidden="true">
      {values.map((v, i) => {
        const t = states[i] ?? 'none';
        const on = t !== 'none';
        const fill = on ? TONE_HEX[t] : '#fbfcfe';
        const stroke = on ? 'transparent' : '#d7deea';
        const cx = x + i * (cell + gap);
        const label = Math.abs(v) < 0.005 ? '0' : fmt(v, 1);
        return (
          <g key={i}>
            <rect x={cx} y={y} width={cell} height={cell} rx={7} fill={fill} stroke={stroke} strokeWidth={1.5} />
            <text x={cx + cell / 2} y={y + cell / 2 + 7} textAnchor="middle" fontSize={15}
              fill={on ? '#ffffff' : '#68778f'} fontWeight={700} fontFamily="Cascadia Code, Consolas, monospace">
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
