import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export function useAutoSequence(
  length: number,
  index: number,
  setIndex: Dispatch<SetStateAction<number>>,
  intervalMs = 900,
) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (index >= length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setIndex((value) => value + 1), intervalMs);
    return () => window.clearTimeout(timer);
  }, [index, intervalMs, length, playing, setIndex]);

  const select = (next: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(length - 1, next)));
  };

  const toggle = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIndex(length - 1);
      return;
    }
    if (index >= length - 1) setIndex(0);
    setPlaying(true);
  };

  return { playing, select, toggle, stop: () => setPlaying(false) };
}
