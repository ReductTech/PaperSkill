import { useEffect, useRef, useState } from 'react';

const LOOP_MS = 7800;
const STAGES = 3;
const motionPreference = '(prefers-reduced-motion: reduce)';

/** One clock drives the illustration, its captions and the progress rail.
 * Leaving the viewport or tab preserves the current point in the lesson. */
export function useLessonTimeline() {
  const root = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(() => matchMedia(motionPreference).matches);
  const [playRequested, setPlayRequested] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [progress, setProgress] = useState(() => reduced ? 0.5 / STAGES : 0);
  const elapsed = useRef(progress * LOOP_MS);
  const lastTime = useRef(0);
  const requested = !reduced || playRequested;
  const running = requested && inView && pageVisible;

  useEffect(() => {
    const media = matchMedia(motionPreference);
    const changePreference = () => {
      setReduced(media.matches);
      setPlayRequested(false);
    };
    const changeVisibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting && entry.intersectionRatio >= 0.04);
    }, { threshold: [0, 0.04] });
    if (root.current) observer.observe(root.current);
    media.addEventListener('change', changePreference);
    document.addEventListener('visibilitychange', changeVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', changePreference);
      document.removeEventListener('visibilitychange', changeVisibility);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    let frame: number;
    lastTime.current = performance.now();
    const advance = (now: number) => {
      const delta = Math.max(0, now - lastTime.current);
      lastTime.current = now;
      elapsed.current = (elapsed.current + delta) % LOOP_MS;
      setProgress(elapsed.current / LOOP_MS);
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  function seek(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= STAGES) return;
    const position = (index + 0.5) / STAGES;
    elapsed.current = position * LOOP_MS;
    lastTime.current = performance.now();
    setProgress(position);
  }

  return {
    root, progress, stage: Math.floor(progress * STAGES), running, requested,
    play: () => setPlayRequested(true), seek,
  };
}
