import React, { useId } from 'react';

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const fmt = (value: number, digits = 1) => {
  const fixed = Number(value.toFixed(digits));
  return Number.isInteger(fixed) ? String(fixed) : fixed.toFixed(digits);
};

export type GlcTone = 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'neutral';

const toneColor: Record<GlcTone, string> = {
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  neutral: '#68778f'
};

export function ToneText({ tone = 'neutral', children }: {
  tone?: GlcTone;
  children: React.ReactNode;
}) {
  return <span style={{ color: toneColor[tone] }}>{children}</span>;
}

export function StageBadge({ children, tone = 'blue' }: {
  children: React.ReactNode;
  tone?: GlcTone;
}) {
  return <span className={`glc-badge is-${tone}`}>{children}</span>;
}

export function MetricBar({ label, value, max, suffix = '%', tone = 'red', caption }: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  tone?: GlcTone;
  caption?: string;
}) {
  return <div className={`glc-metric-row is-${tone}`}>
    <div className="glc-metric-label">
      <span>{label}</span>
      <b>{fmt(value)}{suffix}</b>
    </div>
    <div className="glc-metric-track">
      <span style={{ width: `${clamp(value / max, 0, 1) * 100}%` }} />
    </div>
    {caption && <p>{caption}</p>}
  </div>;
}

function paletteColor(col: number, row: number, detail: number, mode: 'pixel' | 'latent') {
  const x = (col + .5) / 24;
  const y = (row + .5) / 15;
  const ridge = y > .47 + .11 * Math.sin(x * Math.PI * 1.3) - .1 * Math.abs(x - .5);
  const backHill = y > .37 + .07 * Math.sin(x * 8);
  const sun = Math.hypot((x - .74) * 1.7, y - .23) < .105;
  const river = y > .64 && Math.abs(x - (.48 + .16 * Math.sin(y * 5.4))) < (y - .59) * .34;
  const fence = y > .77 && row % 2 === 0 && col % 4 === 0;
  const detailGate = detail / 100;

  if (sun) return detailGate > .12 ? '#f3b45f' : '#dfd4a6';
  if (fence) return '#73533e';
  if (river) return detailGate > .2 ? '#76a9bb' : '#8da7aa';
  if (ridge) return detailGate > .42 ? '#3f7765' : '#617c70';
  if (backHill) return detailGate > .3 ? '#7fa69a' : '#8fa8a0';
  if (mode === 'latent') {
    if (y < .18) return '#d8e9e7';
    if (y < .34) return '#e8dfbf';
    return '#dce6da';
  }
  if (y < .34) return detailGate > .6 ? '#d5e8e8' : '#dce7e6';
  if (y < .62) return detailGate > .55 ? '#e6dfc4' : '#e2ddca';
  return detailGate > .58 ? '#c6d8b8' : '#cbd8c0';
}

export function MosaicArtwork({
  detail = 80,
  mode = 'latent',
  generative = false,
  className = '',
  label
}: {
  detail?: number;
  mode?: 'pixel' | 'latent';
  generative?: boolean;
  className?: string;
  label?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const gap = mode === 'pixel' ? clamp(4 - detail / 32, 0, 4.4) : clamp(1.8 - detail / 80, 0, 1.8);
  const cells = [];
  for (let row = 0; row < 15; row += 1) {
    for (let col = 0; col < 24; col += 1) {
      const wobble = mode === 'pixel' && detail < 45
        ? Math.sin((row * 11 + col * 7) * 1.7) * (45 - detail) * .045
        : 0;
      cells.push(
        <rect
          key={`${row}-${col}`}
          x={col * 25 + gap / 2 + wobble}
          y={row * 25 + gap / 2}
          width={25 - gap}
          height={25 - gap}
          rx={mode === 'latent' ? 4 : 1.5}
          fill={paletteColor(col, row, detail, mode)}
          opacity={mode === 'pixel' && detail < 36 && (row + col) % 7 === 0 ? .42 : 1}
        />
      );
    }
  }
  const textureDots = [];
  if (generative) {
    for (let index = 0; index < 34; index += 1) {
      const x = 42 + ((index * 71) % 516);
      const y = 173 + ((index * 43) % 166);
      textureDots.push(<circle key={index} cx={x} cy={y} r={2 + index % 3}
        fill={index % 3 === 0 ? '#ffffff' : '#3d7565'} opacity={.22 + (index % 4) * .08} />);
    }
  }
  return <svg className={`glc-mosaic ${className}`} viewBox="0 0 600 380" role="img"
    aria-label={label || `${mode === 'latent' ? '潜空间语义马赛克' : '像素空间马赛克'}，细节预算 ${Math.round(detail)}`}>
    <defs>
      <clipPath id={`${uid}-clip`}><rect width="600" height="380" rx="22" /></clipPath>
      <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#243650" floodOpacity=".16" />
      </filter>
      <pattern id={`${uid}-grid`} width="25" height="25" patternUnits="userSpaceOnUse">
        <path d="M25 0H0V25" fill="none" stroke="#fff" strokeWidth="1" opacity=".22" />
      </pattern>
    </defs>
    <g clipPath={`url(#${uid}-clip)`} filter={`url(#${uid}-shadow)`}>
      <rect width="600" height="380" fill="#e8eee6" />
      {cells}
      <rect width="600" height="380" fill={`url(#${uid}-grid)`} />
      {mode === 'latent' && <>
        <path d="M34 246 C125 205 184 164 271 202 C348 235 418 155 570 223"
          fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" opacity=".22" />
        <path d="M150 317 C214 281 270 269 325 286 C388 305 438 270 496 261"
          fill="none" stroke="#27446e" strokeWidth="7" strokeLinecap="round" opacity=".18" />
      </>}
      {textureDots}
    </g>
    <rect x="2" y="2" width="596" height="376" rx="21" fill="none" stroke="#ffffff" strokeWidth="8" opacity=".8" />
    <rect x="8" y="8" width="584" height="364" rx="17" fill="none" stroke="#98aa9c" strokeWidth="2" opacity=".55" />
  </svg>;
}

export function StudioPanel({ children, className = '', tone = 'neutral' }: {
  children: React.ReactNode;
  className?: string;
  tone?: GlcTone;
}) {
  return <section className={`glc-panel is-${tone} ${className}`}>{children}</section>;
}

export function CodeChip({ children, tone = 'blue', active = true }: {
  children: React.ReactNode;
  tone?: GlcTone;
  active?: boolean;
}) {
  return <span className={`glc-code-chip is-${tone}${active ? ' is-active' : ''}`}>{children}</span>;
}

export function StudioFrame({ children, label = '马赛克修复工作台' }: {
  children: React.ReactNode;
  label?: string;
}) {
  return <div className="glc-studio-frame" aria-label={label}>
    <div className="glc-studio-shelf" aria-hidden="true" />
    {children}
  </div>;
}

/** Registered only so the assembler stages the shared drawing kit beside scene widgets. */
export function GlcKitFrame(_props: { chapterId: string; moduleId: string }) {
  return null;
}
