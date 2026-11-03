import { useId } from 'react';

export function LessonCue({ steps, active, title, detail }: {
  steps: readonly string[];
  active: number;
  title: string;
  detail: string;
}) {
  return <div className="lesson-cue" data-attention={active}>
    <ol aria-label="观察顺序">{steps.map((step, i) => <li key={step} aria-current={i === active ? 'step' : undefined}><span>{i + 1}</span>{step}</li>)}</ol>
    <div className="lesson-cue-reading" aria-live="polite"><strong>{title}</strong><span>{detail}</span></div>
  </div>;
}

export function LessonArrowHead({ id, color }: { id: string; color: string }) {
  return <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto" overflow="visible">
    <path d="M1.5 1.5L8 5L1.5 8.5" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </marker>;
}

/** Reveal the shaft only; the arriving arrowhead must never be cut by the stroke mask. */
export function LessonPath({ d, progress = 1, tone = 'data', className = '' }: {
  d: string;
  progress?: number;
  tone?: 'data' | 'history' | 'gradient';
  className?: string;
}) {
  const id = useId().replace(/:/g, '');
  const colors = { data: '#58836c', history: '#668796', gradient: '#a67840' };
  return <g className={`lesson-path ${className}`} data-path-tone={tone} data-path-progress={progress}>
    <defs>
      <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-12" y="-12" width="1320" height="840">
        <path d={d} pathLength="1" fill="none" stroke="white" strokeWidth="10" strokeDasharray="1" strokeDashoffset={1 - progress} />
      </mask>
      <LessonArrowHead id={`${id}-head`} color={colors[tone]} />
    </defs>
    <path className="lesson-shaft" d={d} fill="none" stroke={colors[tone]} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={tone === 'gradient' ? '4 4' : undefined} mask={`url(#${id}-mask)`} />
    <path className="lesson-tip" d={d} fill="none" stroke="none" markerEnd={progress >= 1 ? `url(#${id}-head)` : undefined} aria-hidden="true" />
  </g>;
}
