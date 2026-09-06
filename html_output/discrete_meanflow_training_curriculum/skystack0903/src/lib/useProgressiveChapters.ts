import { useState, useCallback } from 'react';

/**
 * Progressive chapter reveal. Mirrors the legacy chapter-loader.js: chapters start
 * hidden; the learner reveals them one at a time via a "start" / "continue" button.
 * Returns the count of revealed chapters, a `begin()` to reveal the first, and a
 * `revealNext()` to advance. Chapter i is visible when `revealed >= i + 1`.
 */
export function useProgressiveChapters(total: number) {
  const [revealed, setRevealed] = useState(0);

  const begin = useCallback(() => setRevealed(1), []);
  const revealNext = useCallback(
    () => setRevealed((n) => Math.min(n + 1, total)),
    [total]
  );
  const revealThrough = useCallback(
    (chapterNumber: number) => setRevealed((n) => Math.max(n, Math.min(chapterNumber, total))),
    [total]
  );

  return { revealed, begin, revealNext, revealThrough };
}
