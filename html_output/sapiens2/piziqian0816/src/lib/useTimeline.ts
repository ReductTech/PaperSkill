import { useEffect, useState } from 'react';

export function useTimeline(durationMs: number) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      setProgress((value) => {
        const next = Math.min(1, value + 50 / durationMs);
        if (next >= 1) setPlaying(false);
        return next;
      });
    }, 50);
    return () => window.clearInterval(interval);
  }, [durationMs, playing]);

  const toggle = () => {
    if (progress >= 1) {
      setProgress(0);
      setPlaying(true);
    } else setPlaying((value) => !value);
  };

  const seek = (nextProgress: number, shouldPlay = false) => {
    const boundedProgress = Math.max(0, Math.min(1, nextProgress));
    setProgress(boundedProgress);
    setPlaying(shouldPlay && boundedProgress < 1);
  };

  return { progress, playing, toggle, seek };
}
