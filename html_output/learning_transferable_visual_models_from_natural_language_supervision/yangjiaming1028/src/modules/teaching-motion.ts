import { useEffect, useRef, useState } from 'react';

/** One finite response to a learner action; never starts an idle animation loop. */
export function useTeachingProgress(key: string, duration: number) {
  const [progress, setProgress] = useState(1);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const finish = () => { if (frame) cancelAnimationFrame(frame); setProgress(1); };
    if (preference.matches) { setProgress(1); return; }
    setProgress(0);
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const next = Math.min(1, (now - start) / duration);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    preference.addEventListener('change', finish);
    return () => { if (frame) cancelAnimationFrame(frame); preference.removeEventListener('change', finish); };
  }, [key, duration]);
  return progress;
}

/** Retarget from the current visual state so quick slider changes remain continuous. */
export function useTeachingValues(target: number[], duration = 720) {
  const [values, setValues] = useState(target);
  const current = useRef(target);
  const key = target.join(',');
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const finish = () => { if (frame) cancelAnimationFrame(frame); current.current = target; setValues(target); };
    if (preference.matches) { finish(); return; }
    const from = current.current;
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = target.map((value, i) => from[i] + (value - from[i]) * eased);
      current.current = next;
      setValues(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    preference.addEventListener('change', finish);
    return () => { if (frame) cancelAnimationFrame(frame); preference.removeEventListener('change', finish); };
  }, [key, duration]);
  return values;
}

export const motionEase = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
