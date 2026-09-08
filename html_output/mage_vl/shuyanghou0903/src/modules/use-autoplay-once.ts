import { useCallback, useEffect, useRef, useState } from 'react';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function useAutoplayOnce(durationMs = 5600) {
  const hostRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const visibleRef = useRef(false);
  const intentToPlayRef = useRef(false);
  const autoStartedRef = useRef(false);
  const [progress, setProgressState] = useState(0);
  const [playing, setPlaying] = useState(false);

  const commitProgress = useCallback((next: number) => {
    const clamped = clamp01(next);
    progressRef.current = clamped;
    setProgressState(clamped);
  }, []);

  const pause = useCallback(() => {
    intentToPlayRef.current = false;
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (progressRef.current >= 1) commitProgress(0);
    intentToPlayRef.current = true;
    if (visibleRef.current && document.visibilityState !== 'hidden') setPlaying(true);
  }, [commitProgress]);

  const replay = useCallback(() => {
    commitProgress(0);
    intentToPlayRef.current = true;
    if (visibleRef.current && document.visibilityState !== 'hidden') setPlaying(true);
  }, [commitProgress]);

  const setProgress = useCallback((next: number) => {
    intentToPlayRef.current = false;
    setPlaying(false);
    commitProgress(next);
  }, [commitProgress]);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const enter = () => {
      visibleRef.current = true;
      if (!autoStartedRef.current) {
        autoStartedRef.current = true;
        if (reduced) {
          commitProgress(1);
          return;
        }
        intentToPlayRef.current = true;
        setPlaying(true);
      } else if (intentToPlayRef.current && progressRef.current < 1 && document.visibilityState !== 'hidden') {
        setPlaying(true);
      }
    };
    const leave = () => {
      visibleRef.current = false;
      setPlaying(false);
    };
    if (typeof IntersectionObserver === 'undefined') {
      enter();
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) enter(); else leave();
    }, { threshold: .24 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [commitProgress]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setPlaying(false);
      } else if (visibleRef.current && intentToPlayRef.current && progressRef.current < 1) {
        setPlaying(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    let frame = 0;
    const startedAt = performance.now() - progressRef.current * durationMs;
    const tick = (now: number) => {
      const next = clamp01((now - startedAt) / durationMs);
      commitProgress(next);
      if (next >= 1) {
        intentToPlayRef.current = false;
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [commitProgress, durationMs, playing]);

  return {
    hostRef,
    progress,
    playing,
    completed: progress >= 1,
    play,
    pause,
    replay,
    setProgress,
    toggle: playing ? pause : play,
  };
}
