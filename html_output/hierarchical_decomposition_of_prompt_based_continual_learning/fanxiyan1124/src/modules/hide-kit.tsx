import React from 'react';
import { SymbolHint } from '../components/SymbolHint';

export type HideTone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'neutral';

export function hideClass(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(' ');
}

export function HideScene({
  chapter,
  cue,
  tone = 'blue',
  children,
  className,
}: {
  chapter: string;
  cue: string;
  tone?: HideTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={hideClass('hide-scene', `is-${tone}`, className)}>
      <div className="hide-film-edge" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
      </div>
      <header className="hide-scene-ribbon">
        <span>{chapter}</span>
        <strong>{cue}</strong>
        <em>工作读数仅用于教学映射</em>
      </header>
      <div className="hide-scene-content">{children}</div>
    </div>
  );
}

export function HidePanel({
  title,
  meta,
  tone = 'neutral',
  children,
  className,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  tone?: HideTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={hideClass('hide-panel', `is-${tone}`, className)}>
      <div className="hide-panel-heading">
        <h3>{title}</h3>
        {meta ? <span>{meta}</span> : null}
      </div>
      <div className="hide-panel-body">{children}</div>
    </section>
  );
}

export function HideBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: HideTone;
}) {
  return <span className={hideClass('hide-badge', `is-${tone}`)}>{children}</span>;
}

export function HideSegment<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: string; note?: string }>;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={hideClass('hide-segment', className)} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? 'is-active' : ''}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          title={option.note}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function HideMetric({
  label,
  value,
  tone = 'blue',
  note,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: HideTone;
  note?: React.ReactNode;
}) {
  return (
    <div className={hideClass('hide-metric', `is-${tone}`)}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

export function HideBar({
  label,
  value,
  max = 100,
  tone = 'blue',
  note,
}: {
  label: React.ReactNode;
  value: number;
  max?: number;
  tone?: HideTone;
  note?: React.ReactNode;
}) {
  return (
    <div className={hideClass('hide-bar-row', `is-${tone}`)}>
      <span>{label}</span>
      <i>
        <b style={{ width: `${Math.max(0, Math.min(100, value / max * 100))}%` }} />
      </i>
      <strong>{note ?? value}</strong>
    </div>
  );
}

export function HideFigure({
  src,
  alt,
  caption,
  className,
  tone = 'neutral',
}: {
  src: string;
  alt: string;
  caption: React.ReactNode;
  className?: string;
  tone?: HideTone;
}) {
  return (
    <figure className={hideClass('hide-figure', `is-${tone}`, className)}>
      <div className="hide-figure-window">
        <img src={src} alt={alt} loading="lazy" />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function HideNote({
  title,
  tone = 'neutral',
  children,
}: {
  title?: React.ReactNode;
  tone?: HideTone;
  children: React.ReactNode;
}) {
  return (
    <div className={hideClass('hide-note', `is-${tone}`)}>
      {title ? <strong>{title}</strong> : null}
      <div>{children}</div>
    </div>
  );
}

export function HideFormula({
  lead,
  children,
  note,
}: {
  lead: React.ReactNode;
  children: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div className="hide-formula">
      <span>{lead}</span>
      <code>{children}</code>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

export function HideSymbol({
  symbol,
  meaning,
}: {
  symbol: React.ReactNode;
  meaning: string;
}) {
  return <SymbolHint meaning={meaning}>{symbol}</SymbolHint>;
}

export function HideNegativeStrip({
  tasks = 4,
  active = 2,
  faded = false,
  compact = false,
}: {
  tasks?: number;
  active?: number;
  faded?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={hideClass('hide-negative-strip', faded && 'is-faded', compact && 'is-compact')}>
      {Array.from({ length: tasks }, (_, index) => (
        <div key={index} className={index === active ? 'is-active' : ''}>
          <span>{`T${index + 1}`}</span>
          <i />
          <b>{`类别 ${index * 3 + 1}-${index * 3 + 3}`}</b>
        </div>
      ))}
    </div>
  );
}

export function HideContactGrid({
  tasks = 4,
  classes = 4,
  task = 1,
  classIndex = 1,
  phase = 'tap',
  onTask,
  onClass,
}: {
  tasks?: number;
  classes?: number;
  task?: number;
  classIndex?: number;
  phase?: 'identity' | 'within' | 'tap';
  onTask?: (index: number) => void;
  onClass?: (index: number) => void;
}) {
  return (
    <div className={hideClass('hide-contact-grid', `is-${phase}`)} role="grid" aria-label="已见任务接触表">
      <div className="hide-contact-head">
        <span>任务行</span>
        <span>类别格</span>
      </div>
      {Array.from({ length: tasks }, (_, row) => (
        <div
          key={row}
          className={hideClass(
            'hide-contact-row',
            row === task && 'is-current',
            phase === 'identity' && row !== task && 'is-dimmed',
            phase === 'tap' && 'is-shared',
          )}
          role="row"
        >
          <button type="button" onClick={() => onTask?.(row)} aria-label={`选择任务 ${row + 1}`}>
            {`T${row + 1}`}
          </button>
          <div role="gridcell">
            {Array.from({ length: classes }, (_, col) => (
              <button
                key={col}
                type="button"
                className={hideClass(
                  row === task && col === classIndex && 'is-selected',
                  phase === 'tap' && 'is-live',
                )}
                onClick={() => {
                  onTask?.(row);
                  onClass?.(col);
                }}
                aria-label={`任务 ${row + 1} 的类别 ${col + 1}`}
              >
                <span>{String.fromCharCode(65 + col)}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HideStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: HideTone;
}) {
  return (
    <div className={hideClass('hide-stat', `is-${tone}`)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function HideKeyValue({
  label,
  value,
  note,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div className="hide-key-value">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

export function HideDotField({
  count = 48,
  tone = 'blue',
  seed = 11,
  className,
}: {
  count?: number;
  tone?: HideTone;
  seed?: number;
  className?: string;
}) {
  return (
    <div className={hideClass('hide-dot-field', `is-${tone}`, className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const x = ((index * 47 + seed * 13) % 89) + 5;
        const y = ((index * 71 + seed * 17) % 83) + 8;
        return <i key={index} style={{ left: `${x}%`, top: `${y}%` }} />;
      })}
    </div>
  );
}
