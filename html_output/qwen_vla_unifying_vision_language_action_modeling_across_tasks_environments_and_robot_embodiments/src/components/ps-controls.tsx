import React from 'react';

export function PsSegmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="ps-segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={`ps-segment${value === o.value ? ' is-active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PsButton({
  children,
  variant = 'ghost',
  active,
  onClick,
  className = '',
  disabled,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  active?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const cls = [
    'ps-button',
    variant === 'primary' ? 'ps-button--primary' : 'ps-button--ghost',
    active ? 'is-active' : '',
    disabled ? 'is-disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function PsChip({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={`ps-chip${selected ? ' is-selected' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function PsFeedback({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'good' | 'bad';
}) {
  return <div className={`ps-feedback ps-feedback--${tone}`}>{children}</div>;
}

export function PsSliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="ps-slider-row">
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="ps-slider-val">{display ?? value}</span>
    </div>
  );
}

export function IconPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M3 2.5v9l8-4.5-8-4.5z" fill="currentColor" />
    </svg>
  );
}

export function IconReset() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M2.5 7a4.5 4.5 0 0 1 7.8-3.1M11.5 7A4.5 4.5 0 0 1 3.7 10.1M11 2.5V5H8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CanvasStage({
  aspectW,
  aspectH,
  children,
  overlay,
  className = '',
}: {
  aspectW: number;
  aspectH: number;
  children: React.ReactNode;
  overlay?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`canvas-stage ${className}`.trim()}
      style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
    >
      {children}
      {overlay ? <div className="canvas-stage-overlay">{overlay}</div> : null}
    </div>
  );
}
