import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { classNames } from '../utils';
import { emitTelemetry, getTelemetryState } from '../telemetry';
import { ScrollCue } from './ScrollCue';

export type LessonFlowRevealMode = 'immediate' | 'scroll' | 'cue';

export interface LessonStepContext {
  complete: () => void;
  reset: () => void;
  isComplete: boolean;
}

export interface LessonFlowStep {
  id: string;
  revealMode?: LessonFlowRevealMode;
  /** Completing this step marks the whole module as learned. */
  completesLesson?: boolean;
  render: (context: LessonStepContext) => ReactNode;
}

export interface LessonFlowProps {
  steps: LessonFlowStep[];
  className?: string;
  cueText?: ReactNode;
  /** Stable module-level key used to restore completed lesson steps after a revisit. */
  persistenceKey?: string;
}

interface LessonProgressState { completedIds?: string[]; visibleCount?: number; completed?: boolean; }

/** Manages lesson-step visibility; individual blocks only report their own completion. */
export function LessonFlow({
  steps,
  className,
  cueText = '下一段内容已经准备好，向下滚动继续学习',
  persistenceKey,
}: LessonFlowProps) {
  const moduleKey = persistenceKey || 'lesson';
  const progressKey = `lesson-flow:${moduleKey}`;
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(Math.min(1, steps.length));
  const [, setHydrated] = useState(false);
  const [revealedIndex, setRevealedIndex] = useState<number | null>(null);
  const [cueIndex, setCueIndex] = useState<number | null>(null);
  const completedIdsRef = useRef<string[]>([]);
  const visibleCountRef = useRef(Math.min(1, steps.length));
  const hydratedRef = useRef(false);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const cueTargetRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const reset = useCallback(() => {
    completedIdsRef.current = [];
    visibleCountRef.current = Math.min(1, steps.length);
    setCompletedIds([]);
    setVisibleCount(Math.min(1, steps.length));
    setRevealedIndex(null);
    setCueIndex(null);
    emitTelemetry('lesson_reset', rootRef.current, { state_key: progressKey, state: { completedIds: [], visibleCount: Math.min(1, steps.length), completed: false } });
  }, [progressKey, steps.length]);

  const complete = useCallback((id: string) => {
    const index = steps.findIndex((step) => step.id === id);
    if (!hydratedRef.current || index < 0 || completedIdsRef.current.includes(id)) return;
    const nextIndex = index + 1;
    const nextCompleted = [...completedIdsRef.current, id];
    const nextVisibleCount = Math.min(steps.length, Math.max(visibleCountRef.current, nextIndex + 1));
    const lessonCompleted = Boolean(steps[index]?.completesLesson);
    completedIdsRef.current = nextCompleted;
    visibleCountRef.current = nextVisibleCount;
    setCompletedIds(nextCompleted);
    emitTelemetry('lesson_progress', rootRef.current, { state_key: progressKey, state: { completedIds: nextCompleted, visibleCount: nextVisibleCount, completed: lessonCompleted } });
    if (lessonCompleted) emitTelemetry('module_complete', rootRef.current, { state_key: `module:${moduleKey}`, state: { completed: true, completedIds: nextCompleted } });
    if (nextIndex < steps.length) {
      setVisibleCount(nextVisibleCount);
      setRevealedIndex(nextIndex);
    }
  }, [moduleKey, progressKey, steps]);

  useEffect(() => {
    if (revealedIndex === null) return;
    const mode = steps[revealedIndex]?.revealMode ?? 'immediate';
    const target = stepRefs.current[revealedIndex];
    if (!target) return;
    if (mode === 'scroll') {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } else if (mode === 'cue') {
      setCueIndex(revealedIndex);
    }
    setRevealedIndex(null);
  }, [revealedIndex, steps]);

  useEffect(() => {
    let active = true;
    void getTelemetryState<LessonProgressState>(progressKey, moduleKey).then((entry) => {
      if (!active) return;
      if (!entry?.state) {
        hydratedRef.current = true;
        setHydrated(true);
        return;
      }
      const restoredIds = Array.isArray(entry.state.completedIds) ? entry.state.completedIds.filter((id) => steps.some((step) => step.id === id)) : [];
      const restoredVisible = Number(entry.state.visibleCount);
      const nextVisibleCount = Number.isFinite(restoredVisible) ? Math.min(steps.length, Math.max(1, restoredVisible)) : Math.min(steps.length, restoredIds.length + 1);
      completedIdsRef.current = restoredIds;
      visibleCountRef.current = nextVisibleCount;
      setCompletedIds(restoredIds);
      setVisibleCount(nextVisibleCount);
      hydratedRef.current = true;
      setHydrated(true);
    });
    return () => { active = false; };
  }, [moduleKey, progressKey, steps]);

  return (
    <div className={classNames('edu-lesson-flow', className)} ref={rootRef} data-state-key={progressKey}>
      {steps.slice(0, visibleCount).map((step, index) => (
        <section
          className={classNames('edu-lesson-flow-step', index > 0 && 'is-revealed')}
          key={step.id}
          ref={(node) => { stepRefs.current[index] = node; if (index === cueIndex) cueTargetRef.current = node; }}
          data-step-id={step.id}
        >
          {step.render({
            complete: () => complete(step.id),
            reset,
            isComplete: completedIds.includes(step.id),
          })}
        </section>
      ))}
      {cueIndex !== null && (
        <ScrollCue targetRef={cueTargetRef} onDismiss={() => setCueIndex(null)}>{cueText}</ScrollCue>
      )}
    </div>
  );
}
