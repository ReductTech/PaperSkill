import { useEffect, useRef, useState } from 'react';

/** Finite, user-controlled playback; pauses out of view and in background tabs. */
export function useLessonPlayback(steps = 5, duration = 10) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const visible = useRef(true);
  useEffect(() => {
    const el = root.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; }, { threshold: .1 });
    observer.observe(el); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing) return;
    let frame = 0, previous = performance.now();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let accumulated = 0;
    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, .1); previous = now;
      if (visible.current && document.visibilityState === 'visible') {
        accumulated += delta;
        if (!reduced || accumulated >= duration / (steps - 1)) {
          const change = reduced ? 1 / (steps - 1) : delta / duration;
          accumulated = 0;
          setProgress(p => { const next = Math.min(1, p + change); if (next >= 1) setPlaying(false); return next; });
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [playing, duration, steps]);
  return { root, progress, playing, step: Math.min(steps - 1, Math.floor(progress * steps)),
    toggle: () => { if (progress >= 1) setProgress(0); setPlaying(v => !v); },
    reset: () => { setPlaying(false); setProgress(0); },
    seek: (value: number) => { setPlaying(false); setProgress(Math.max(0, Math.min(1, value))); },
    advance: () => { setPlaying(false); setProgress(p => Math.min(1, (Math.floor(p * (steps - 1) + .001) + 1) / (steps - 1))); }
  };
}
export type LessonPlayback = ReturnType<typeof useLessonPlayback>;
