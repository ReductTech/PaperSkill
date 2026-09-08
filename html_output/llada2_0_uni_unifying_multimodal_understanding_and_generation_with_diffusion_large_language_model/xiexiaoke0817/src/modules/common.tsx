import React from 'react';

export type TokenKind = 'text' | 'image' | 'special' | 'mask' | 'done';

export const kindLabel: Record<TokenKind, string> = {
  text: '文本',
  image: '图像',
  special: '边界',
  mask: 'MASK',
  done: '已恢复',
};

export function Token({
  kind,
  label,
  active = false,
  delay = 0,
}: {
  kind: TokenKind;
  label?: string;
  active?: boolean;
  delay?: number;
}) {
  return (
    <span
      className={`ll-token ${kind} ${active ? 'active' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      title={kindLabel[kind]}
    >
      {label || (kind === 'mask' ? 'MASK' : kindLabel[kind])}
    </span>
  );
}

export function Segmented({
  items,
  value,
  onChange,
  label,
}: {
  items: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="ll-segmented" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          type="button"
          key={item.value}
          className={item.value === value ? 'selected' : ''}
          aria-pressed={item.value === value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({
  label,
  value,
  tone = 'blue',
  note,
}: {
  label: string;
  value: string;
  tone?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  note?: string;
}) {
  return (
    <div className={`ll-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

export function Notice({
  children,
  tone = 'blue',
}: {
  children: React.ReactNode;
  tone?: 'blue' | 'green' | 'orange' | 'red';
}) {
  return <div className={`ll-notice ${tone}`}>{children}</div>;
}

