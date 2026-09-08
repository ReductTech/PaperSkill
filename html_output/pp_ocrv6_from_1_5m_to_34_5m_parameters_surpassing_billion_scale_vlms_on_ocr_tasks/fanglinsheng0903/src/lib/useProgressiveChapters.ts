import { useCallback, useEffect, useState } from 'react';

function readInitialProgress(total: number, storageKey: string) {
  if (typeof window === 'undefined') return 0;

  let stored = 0;
  try {
    stored = Number.parseInt(window.sessionStorage.getItem(storageKey) || '0', 10) || 0;
  } catch {
    stored = 0;
  }

  const hashMatch = window.location.hash.match(/^#chap-(\d+)$/);
  const fromHash = hashMatch ? Number.parseInt(hashMatch[1], 10) : 0;
  return Math.min(total, Math.max(0, stored, fromHash));
}

/**
 * Progressive chapter reveal. Mirrors the legacy chapter-loader.js: chapters start
 * hidden; the learner reveals them one at a time via a "start" / "continue" button.
 * Returns the count of revealed chapters, a `begin()` to reveal the first, and a
 * `revealNext()` to advance. Chapter i is visible when `revealed >= i + 1`.
 */
export function useProgressiveChapters(
  total: number,
  storageKey = 'paper-skill:revealed-chapters'
) {
  const [revealed, setRevealed] = useState(() => readInitialProgress(total, storageKey));

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey, String(revealed));
    } catch {
      // Progress persistence is best-effort when storage is unavailable.
    }
  }, [revealed, storageKey]);

  const begin = useCallback(() => setRevealed(1), []);
  const revealNext = useCallback(
    () => setRevealed((n) => Math.min(n + 1, total)),
    [total]
  );

  return { revealed, begin, revealNext };
}
