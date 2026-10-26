import React from 'react';

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const fmt = (v: number, d = 2) => Number(v.toFixed(d)).toString();

export type Tone = 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'none';

// Hex mirrors contract.md §5 (semantic color roles).
const TONE_HEX: Record<Tone, string> = {
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  none: '#9aa7ba',
};

export interface CellSpec {
  label: string;
  tone?: Tone;
  on?: boolean;
}

export function MatrixGrid({ cells, size = 72, gap = 6 }: { cells: CellSpec[][]; size?: number; gap?: number }) {
  const cols = cells.reduce((m, r) => Math.max(m, r.length), 0);
  return (
    <div className="aq-matrix" role="img" aria-label="矩阵表示"
      style={{ gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap }}>
      {cells.flatMap((row, r) => row.map((c, cc) => {
        const fill = c.on ? TONE_HEX[c.tone ?? 'blue'] : '#fbfcfe';
        const color = c.on ? '#ffffff' : TONE_HEX[c.tone ?? 'none'];
        return (
          <div key={`${r}-${cc}`} className="aq-cell"
            style={{ width: size, height: size, background: fill, color, borderColor: c.on ? 'transparent' : 'var(--line)' }}>
            {c.label}
          </div>
        );
      }))}
    </div>
  );
}

export function Slider({ label, value, min, max, step, unit = '', onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void;
}) {
  const decimals = step < 0.01 ? 4 : step < 1 ? 3 : 2;
  return (
    <label className="aq-slider">
      <span><strong>{label}</strong>{unit ? <small>{unit}</small> : null}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
      <b>{value.toFixed(decimals)}</b>
    </label>
  );
}

export function SegButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" className={`aq-btn ${active ? 'is-active' : ''}`}
      onClick={onClick} aria-pressed={active}>{children}</button>
  );
}

export function Feedback({ children, tone = 'blue' }: {
  children: React.ReactNode; tone?: 'blue' | 'green' | 'red' | 'orange';
}) {
  const cls = tone === 'green' ? 'good' : tone === 'red' ? 'bad' : tone === 'orange' ? 'warn' : '';
  return <div className={`aq-feedback ${cls}`} aria-live="polite"><span className="aq-feedback-text">{children}</span></div>;
}

// Shared cover scene: the subject (mountain) is fixed; the camera frame transforms.
export function CameraScene({ op, progress }: { op: 'old' | 'new'; progress: number }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ph = progress * Math.PI * 2;
  const k = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(ph);
  const scale = 1 + (op === 'new' ? 0.22 : 0.3) * k;
  const rotate = op === 'new' ? 0.14 * Math.sin(ph + 1.2) : 0;
  const tx = op === 'new' ? 30 * Math.sin(ph + 0.6) : 0;
  const ty = op === 'new' ? -20 * Math.cos(ph) : 0;
  const levels = op === 'new' ? 8 + Math.round(2 * k) : 4 + Math.round(1 * k);
  const cx = 300, cy = 200;
  const bands: string[] = [];
  for (let i = 0; i < levels; i += 1) {
    const t = i / Math.max(1, levels - 1);
    const r = Math.round(178 - 86 * t);
    const g = Math.round(198 - 74 * t);
    const b = Math.round(170 - 60 * t);
    bands.push(`rgb(${r},${g},${b})`);
  }
  return (
    <svg className="aq-photo" viewBox="0 0 660 400" role="img"
      aria-label={op === 'old' ? '旧方法：只有变焦，画面压色阶后仍有断层' : '新方法：缩放加平移加旋转，画面压色阶后细节保留'}>
      <rect width="660" height="400" fill="#dcecf0" />
      <circle cx="560" cy="64" r="26" fill="#f2d98a" opacity="0.9" />
      <path d="M0 300 L150 180 L270 290 L400 150 L540 300 L660 210 L660 400 L0 400 Z" fill="#b7cfc9" />
      <path d="M0 340 L180 235 L330 330 L470 205 L660 340 L660 400 L0 400 Z" fill="#86a89f" />
      <g stroke="#d7deea" strokeWidth="1" opacity="0.6">
        {Array.from({ length: 11 }).map((_, i) => <line key={`v${i}`} x1={i * 66} y1="0" x2={i * 66} y2="400" />)}
        {Array.from({ length: 7 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * 66} x2="660" y2={i * 66} />)}
      </g>
      <g transform={`translate(${cx + tx} ${cy + ty}) rotate(${(rotate * 180) / Math.PI}) scale(${scale}) translate(${-cx} ${-cy})`}>
        <rect x="150" y="90" width="300" height="220" fill="none"
          stroke={op === 'new' ? '#228d5c' : '#c43f52'} strokeWidth="4" strokeDasharray="10 8" />
        {[[150, 90], [450, 90], [150, 310], [450, 310]].map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y - 16} V${y + 16} M${x - 16} ${y} H${x + 16}`}
            stroke={op === 'new' ? '#228d5c' : '#c43f52'} strokeWidth="4" />
        ))}
      </g>
      <g transform="translate(500 260)">
        <rect width="120" height="104" rx="8" fill="#0f1b26" />
        {bands.map((c, i) => (
          <rect key={i} x="6" y={6 + i * (92 / levels)} width="108" height={92 / levels} fill={c} />
        ))}
        <text x="60" y="126" textAnchor="middle" fontSize="15" fill="#68778f">压色阶预览</text>
      </g>
      <text x="24" y="36" fontSize="20" fontWeight="700" fill="#33415a">
        {op === 'old' ? '仅缩放 · 变换受限' : '缩放 + 平移 + 旋转'}
      </text>
    </svg>
  );
}