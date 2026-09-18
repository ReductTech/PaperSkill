import React from 'react';

// Shared atoms for the paper's interactive labs. Every lab keeps the same
// skeleton: stage (visual) → controls → feedback, so the interaction grammar
// is identical across all 12 modules.

export type FeedbackTone = '' | 'good' | 'bad' | 'info' | 'warn';

export function Feedback({ tone, children }: { tone: FeedbackTone; children: React.ReactNode }) {
  return <div className={`lab-feedback ${tone}`}>{children}</div>;
}

export function Chip({
  active,
  onClick,
  children,
  tone,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  tone?: 'good' | 'bad';
}) {
  return (
    <button
      type="button"
      className={`lab-chip ${active ? 'is-active' : ''} ${tone ? `tone-${tone}` : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Btn({
  onClick,
  children,
  variant = 'primary',
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`lab-btn lab-btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Slider({
  label,
  value,
  onChange,
  display,
}: {
  label: string;
  value: number; // 0..100
  onChange: (v: number) => void;
  display?: string;
}) {
  return (
    <label className="lab-slider">
      <span className="lab-slider-label">
        {label}
        <b className="lab-slider-val">{display ?? value.toFixed(2)}</b>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/** Small status pill used inside stage graphics. */
export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'good' | 'bad' | 'info' | 'warn';
  children: React.ReactNode;
}) {
  return <span className={`lab-pill tone-${tone}`}>{children}</span>;
}

export function StageCaption({ children }: { children: React.ReactNode }) {
  return <div className="lab-stage-caption">{children}</div>;
}
