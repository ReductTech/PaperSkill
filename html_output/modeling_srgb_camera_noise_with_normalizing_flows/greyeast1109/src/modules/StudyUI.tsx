import type { ReactNode } from 'react';
import { imageUrl, paperUrl } from '../data/study';

export function StudySection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="study-detail"><h2>{title}</h2><div className="detail-body">{children}</div></section>;
}

export function Switcher<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return <div className="switcher" role="group" aria-label={label}>
    {options.map(option => <button key={option.value} type="button" aria-pressed={option.value === value}
      onClick={() => onChange(option.value)}>{option.label}</button>)}
  </div>;
}

export function Readout({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: 'mint' | 'amber' }) {
  return <div className="readout" data-tone={tone}><span>{label}</span><strong>{value}</strong></div>;
}

export function SourceLink({ page, children }: { page: number; children: ReactNode }) {
  return <a href={`${paperUrl}#page=${page}`} target="_blank" rel="noreferrer" className="source-link">{children} <span aria-hidden="true">↗</span></a>;
}

export function PaperFigure({ number, alt }: { number: number; alt: string }) {
  return <img className="paper-figure" src={imageUrl(`paper-fig-${number}`)} loading="lazy" alt={alt} />;
}

export function StudyTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return <div className="study-table-wrap"><table className="study-table">
    <thead><tr>{columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
    <tbody>{rows.map(([name, ...values]) => <tr key={name} data-highlight={name.startsWith('本文') || name.startsWith('四个')}>
      <th scope="row">{name}</th>{values.map((value, index) => <td key={index}>{value}</td>)}
    </tr>)}</tbody>
  </table></div>;
}
