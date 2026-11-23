import React from 'react';
import './photo-tutorial.css';

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const pct = (value: number) => `${Math.round(value)}%`;

export function CameraGlyph({ mode = 'video', className = '' }: { mode?: 'video' | 'scanner'; className?: string }) {
  return <svg viewBox="0 0 180 120" className={`photo-camera ${className}`} aria-hidden="true">
    <ellipse cx="90" cy="108" rx="63" ry="8" fill="#24455a" opacity=".12" />
    <path d="M65 77 L51 108 M115 77 L130 108 M88 42 V77" stroke="#31556d" strokeWidth="7" strokeLinecap="round" />
    <rect x="42" y="24" width="96" height="56" rx="14" fill="#27446e" stroke="#163451" strokeWidth="4" />
    <circle cx="90" cy="52" r="21" fill="#dbe6ec" stroke="#7c9ab2" strokeWidth="5" />
    <circle cx="90" cy="52" r="10" fill="#2d5879" />
    {mode === 'scanner' ? <path d="M28 24 H152" stroke="#b8c9a7" strokeWidth="8" strokeLinecap="round" /> :
      <path d="M107 31 H132" stroke="#ffd5a8" strokeWidth="4" strokeLinecap="round" />}
  </svg>;
}

export function TissueFrame({ state = 'low', label = '', className = '' }: {
  state?: 'low' | 'mid' | 'clean' | 'failed';
  label?: string;
  className?: string;
}) {
  const fill = state === 'failed' ? '#e8b2af' : state === 'clean' ? '#d78ca5' : state === 'mid' ? '#b990ba' : '#8db7aa';
  const edge = state === 'failed' ? '#c43f52' : state === 'clean' ? '#228d5c' : '#799bad';
  return <div className={`photo-tissue ${className}`} aria-label={label || '组织切片示意图'} role="img">
    <svg viewBox="0 0 420 140" aria-hidden="true">
      <rect x="2" y="2" width="416" height="136" rx="10" fill="#fffdf7" stroke={edge} strokeWidth={state === 'failed' ? 7 : 3} />
      <path d="M28 93 C57 32 104 26 145 63 C168 83 185 116 222 108 C263 98 265 39 308 42 C353 45 379 75 391 94 L391 130 H25 Z" fill={fill} />
      <path d="M63 86 C98 70 121 61 152 76 M201 101 C230 85 254 74 288 80 M301 63 C326 58 353 69 366 89" fill="none" stroke="#f7e7ef" strokeWidth="3" opacity=".85" />
      {Array.from({ length: 18 }).map((_, index) => <circle key={index} cx={48 + (index * 47) % 316} cy={59 + (index * 29) % 54} r="3.2" fill={state === 'clean' ? '#5d2c42' : '#557d8c'} opacity={state === 'low' ? .38 : .8} />)}
      {(state === 'mid' || state === 'clean') && <path d="M287 50 L306 45 L329 57 L327 79 L307 87 L285 73 Z" fill="none" stroke="#13ffe0" strokeWidth="3" opacity=".7" />}
      {state === 'failed' && <><path d="M14 11 H91 V43 H14 Z" fill="none" stroke="#c43f52" strokeWidth="5" /><path d="M350 104 H405 V132 H350 Z" fill="none" stroke="#c43f52" strokeWidth="5" /></>}
    </svg>
    {label && <span className="photo-tissue-label">{label}</span>}
  </div>;
}

export function Feedback({ tone = 'blue', children }: { tone?: 'blue' | 'green' | 'red' | 'orange'; children: React.ReactNode }) {
  return <div className={`photo-feedback is-${tone}`} role="status" aria-live="polite">{children}</div>;
}

export function MetricBar({ label, value, max, text, active }: { label: string; value: number; max: number; text: string; active?: boolean }) {
  return <div className={`photo-metric ${active ? 'is-active' : ''}`}>
    <span>{label}</span>
    <div className="photo-metric-track"><i style={{ width: pct((value / max) * 100) }} /></div>
    <strong>{text}</strong>
  </div>;
}

export function SmallCameraPattern({ count = 6, active = 0 }: { count?: number; active?: number }) {
  return <div className="photo-frame-strip" aria-hidden="true">
    {Array.from({ length: count }).map((_, index) => <span key={index} className={index === active ? 'is-active' : index === active - 1 ? 'is-prev' : ''}>
      <i />
    </span>)}
  </div>;
}

export function PhotoButton({ selected, children, onClick, title }: {
  selected?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return <button type="button" className={`photo-button ${selected ? 'is-selected' : ''}`}
    aria-pressed={selected} title={title} onClick={onClick}>{children}</button>;
}

export function PhotoLegend({ children }: { children: React.ReactNode }) {
  return <div className="photo-legend">{children}</div>;
}
