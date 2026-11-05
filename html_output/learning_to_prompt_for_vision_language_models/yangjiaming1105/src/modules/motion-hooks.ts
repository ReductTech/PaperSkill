import { useEffect, useRef, useState } from 'react';

/** Smooth a learner-triggered numeric change; interrupted transitions continue
 * from the displayed value. No timers run after the transition completes. */
export function useAnimatedNumbers(values: number[], duration = 650): number[] {
  const [display, setDisplay] = useState(values);
  const current = useRef(values);
  const signature = values.join('|');
  useEffect(() => {
    const target = signature.split('|').map(Number);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const from = current.current.length === target.length ? [...current.current] : [...target];
    let frame = 0;
    const finish = () => { cancelAnimationFrame(frame); current.current = target; setDisplay(target); };
    if (media.matches || document.hidden || duration <= 0 || target.every((value, i) => value === from[i])) { finish(); return; }
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = target.map((value, i) => from[i] + (value - from[i]) * eased);
      current.current = next; setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    const visibility = () => { if (document.hidden) finish(); };
    const preference = () => { if (media.matches) finish(); };
    frame = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', visibility);
    media.addEventListener('change', preference);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', preference); };
  }, [signature, duration]);
  return display;
}
