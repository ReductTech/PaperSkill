import { useState, useCallback } from 'react';

/**
 * Progressive chapter reveal. Chapters start hidden and are revealed as the
 * learner moves through the tutorial. `revealTo(count)` is used by the Part
 * directory links so navigation remains functional even before a target
 * chapter has been revealed.
 */
export function useProgressiveChapters(total: number, beginCount = 1) {
  const [revealed, setRevealed] = useState(0);

  const begin = useCallback(() => setRevealed(Math.min(beginCount, total)), [beginCount, total]);
  const revealNext = useCallback(
    () => setRevealed((n) => Math.min(n + 1, total)),
    [total]
  );
  const revealTo = useCallback(
    (count: number) => setRevealed((n) => Math.max(n, Math.min(count, total))),
    [total]
  );

  return { revealed, begin, revealNext, revealTo };
}
