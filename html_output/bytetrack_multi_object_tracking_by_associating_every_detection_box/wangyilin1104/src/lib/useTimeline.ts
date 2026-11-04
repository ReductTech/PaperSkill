import { useEffect, useRef, useState } from 'react';

/** One clock for all linked views. Widgets render the same logical progress. */
export function useTimeline({ duration = 5000, loop = false, autoPlay = false } = {}) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(() => autoPlay && !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const current = useRef(0);
  const seek = (value: number) => { current.current = Math.max(0, Math.min(1, value)); setProgress(current.current); };
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { if (media.matches) setPlaying(false); };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let frame = 0, previous = performance.now();
    const tick = (now: number) => {
      const next = current.current + Math.min(now - previous, 100) / duration;
      previous = now;
      if (next >= 1 && !loop) { seek(1); setPlaying(false); return; }
      seek(loop ? next % 1 : next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration, loop]);
  return { progress, playing };
}
