import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { clamp01 } from './easing';

export interface PointerBounds {
  left: number;
  width: number;
}

export function pointerToProgress(clientX: number, bounds: PointerBounds): number {
  if (bounds.width <= 0) return 0;
  return clamp01((clientX - bounds.left) / bounds.width);
}

const CORPUS_MIN = 100;
const CORPUS_MAX = 50_000;

export function logProgressToCorpusSize(progress: number): number {
  const logMin = Math.log10(CORPUS_MIN);
  const logMax = Math.log10(CORPUS_MAX);
  return Math.round(10 ** (logMin + clamp01(progress) * (logMax - logMin)));
}

export type DirectManipulationOwner = 'timeline' | 'pointer' | 'manual';

export interface DirectManipulationState {
  owner: DirectManipulationOwner;
  dragging: boolean;
}

export function beginDirectManipulation(state: DirectManipulationState): DirectManipulationState {
  return { owner: 'pointer', dragging: true };
}

export function endDirectManipulation(state: DirectManipulationState): DirectManipulationState {
  return { owner: 'manual', dragging: false };
}

export interface ContinuousControlOptions {
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  onTakeControl?: () => void;
  mapProgressToValue?: (progress: number) => number;
}

export interface ContinuousControlBindings {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
  onLostPointerCapture: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

export function useContinuousControl({
  value,
  min,
  max,
  step,
  onValueChange,
  onTakeControl,
  mapProgressToValue = (progress) => min + progress * (max - min),
}: ContinuousControlOptions): { bindings: ContinuousControlBindings; dragging: boolean; owner: DirectManipulationOwner } {
  const [ownership, setOwnership] = useState<DirectManipulationState>({ owner: 'timeline', dragging: false });
  const latestProgressRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const releasedRef = useRef(false);

  const clampValue = useCallback((next: number) => {
    const bounded = Math.max(min, Math.min(max, next));
    if (step <= 0) return bounded;
    const snapped = Math.round((bounded - min) / step) * step + min;
    return Math.max(min, Math.min(max, Number(snapped.toFixed(6))));
  }, [max, min, step]);

  const flush = useCallback(() => {
    frameRef.current = null;
    const pending = latestProgressRef.current;
    latestProgressRef.current = null;
    if (pending !== null) onValueChange(clampValue(mapProgressToValue(pending)));
  }, [clampValue, mapProgressToValue, onValueChange]);

  const scheduleFlush = useCallback(() => {
    if (frameRef.current !== null) return;
    if (typeof requestAnimationFrame !== 'function') {
      flush();
      return;
    }
    frameRef.current = requestAnimationFrame(flush);
  }, [flush]);

  const queueProgress = useCallback((progress: number) => {
    latestProgressRef.current = clamp01(progress);
    scheduleFlush();
  }, [scheduleFlush]);

  const pointerProgress = useCallback((event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return pointerToProgress(event.clientX, { left: bounds.left, width: bounds.width });
  }, []);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    releasedRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onTakeControl?.();
    setOwnership(beginDirectManipulation(ownership));
    queueProgress(pointerProgress(event));
  }, [onTakeControl, ownership, pointerProgress, queueProgress]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!ownership.dragging) return;
    queueProgress(pointerProgress(event));
  }, [ownership.dragging, pointerProgress, queueProgress]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!ownership.dragging) return;
    releasedRef.current = true;
    queueProgress(pointerProgress(event));
    setOwnership((current) => endDirectManipulation(current));
  }, [ownership.dragging, pointerProgress, queueProgress]);

  const cancelDrag = useCallback(() => {
    if (!ownership.dragging) return;
    latestProgressRef.current = null;
    if (frameRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    releasedRef.current = true;
    setOwnership((current) => ({ ...current, dragging: false, owner: 'manual' }));
  }, [ownership.dragging]);

  const onLostPointerCapture = useCallback(() => {
    if (!releasedRef.current) cancelDrag();
    releasedRef.current = false;
  }, [cancelDrag]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    let direction = 0;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') direction = 1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') direction = -1;
    if (event.key === 'Home') {
      event.preventDefault();
      onTakeControl?.();
      onValueChange(min);
      setOwnership({ owner: 'manual', dragging: false });
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      onTakeControl?.();
      onValueChange(max);
      setOwnership({ owner: 'manual', dragging: false });
      return;
    }
    if (direction === 0) return;
    event.preventDefault();
    onTakeControl?.();
    onValueChange(clampValue(value + direction * step));
    setOwnership({ owner: 'manual', dragging: false });
  }, [clampValue, max, min, onTakeControl, onValueChange, step, value]);

  useEffect(() => () => {
    if (frameRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  const bindings = useMemo(() => ({
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: cancelDrag,
    onLostPointerCapture,
    onKeyDown,
  }), [cancelDrag, onKeyDown, onLostPointerCapture, onPointerDown, onPointerMove, onPointerUp]);

  return { bindings, dragging: ownership.dragging, owner: ownership.owner };
}
