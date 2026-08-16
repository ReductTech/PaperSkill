import { useState, useCallback } from 'react';

/**
 * Progressive chapter reveal. Mirrors the legacy chapter-loader.js: chapters start
 * hidden; the learner reveals them one at a time via a "start" / "continue" button.
 * Returns the count of revealed chapters, a `begin()` to reveal the first, and a
 * `revealNext()` to advance. Chapter i is visible when `revealed >= i + 1`.
 */
export function useProgressiveChapters(total: number, initial = 0) {
  const [revealed, setRevealed] = useState(() => Math.max(0, Math.min(initial, total)));

  const begin = useCallback(() => setRevealed(1), []);
  const revealNext = useCallback(
    () => setRevealed((n) => Math.min(n + 1, total)),
    [total]
  );

  const revealTo = useCallback(
    (count: number) => setRevealed(Math.max(0, Math.min(count, total))),
    [total]
  );

  return { revealed, begin, revealNext, revealTo };
}
