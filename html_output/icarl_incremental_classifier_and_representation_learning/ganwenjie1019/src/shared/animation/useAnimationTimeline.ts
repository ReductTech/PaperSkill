import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * One clip of a continuous teaching animation.
 *
 * `durationMs` covers visible motion; `holdMs` is an in-place pause on the end state so the
 * reader can observe the result before the next cause is introduced. A clip therefore never
 * needs to "jump" to a different picture at its boundary: state at `totalMs` already equals
 * the state at the next clip's time 0 for every object that survives the boundary.
 */
export type AnimationClip = {
  id: string;
  durationMs: number;
  holdMs?: number;
  narrative: string;
};

export type TimelineStatus = "playing" | "paused" | "finished";

export type TimelineState = {
  clipIndex: number;
  clip: AnimationClip;
  /** 0–1 while the clip is moving; frozen at 1 during the hold. */
  progress: number;
  /** Milliseconds elapsed inside the current clip, including its hold. */
  elapsedMs: number;
  status: TimelineStatus;
  isHolding: boolean;
  atStart: boolean;
  atEnd: boolean;
  /** Whether a previous/next clip exists. Stepping is bounded by the clip list, not by time. */
  hasPrevious: boolean;
  hasNext: boolean;
  totalClips: number;
};

export type TimelineControls = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  replayClip: () => void;
  stepBack: () => void;
  stepForward: () => void;
  goToClip: (index: number, options?: { autoPlay?: boolean }) => void;
};

function totalMs(clip: AnimationClip): number {
  return Math.max(1, clip.durationMs + (clip.holdMs ?? 0));
}

/** Visual-QA freeze instruction, set by the capture script before the app boots. */
type FreezeRequest = { clip?: number; pct?: number };

declare global {
  interface Window {
    __ICARL_FREEZE__?: FreezeRequest;
  }
}

/**
 * A single playback clock for one workbench. All derived geometry reads from this elapsed time,
 * so two panels of the same page can never drift apart.
 *
 * Reduced motion keeps every key state reachable: the reader advances clip by clip manually and
 * each clip is rendered at its completed state instead of being skipped.
 */
export function useAnimationTimeline({
  clips,
  reducedMotion,
  autoPlay = true,
}: {
  clips: readonly AnimationClip[];
  reducedMotion: boolean;
  autoPlay?: boolean;
}): { state: TimelineState; controls: TimelineControls } {
  /**
   * The freeze request is resolved once, while the initial state is computed, so a frozen
   * checkpoint can never be advanced by a frame that lands before an effect runs.
   */
  const freeze = useRef(readFreezeRequest()).current;
  const initialClip = freeze ? Math.max(0, Math.min(clips.length - 1, freeze.clip ?? 0)) : 0;
  /**
   * Reduced motion renders whole clips, so the very first render is already at the end of its clip.
   * Initialising here (not only in an effect) avoids one frame of a half-played first clip.
   */
  const initialElapsed = freeze
    ? clips[initialClip].durationMs * Math.max(0, Math.min(0.999, freeze.pct ?? 0))
    : reducedMotion
      ? totalMs(clips[initialClip])
      : 0;

  const [clipIndex, setClipIndex] = useState(initialClip);
  const [elapsedMs, setElapsedMs] = useState(initialElapsed);
  const [status, setStatus] = useState<TimelineStatus>(
    reducedMotion || freeze ? "paused" : autoPlay ? "playing" : "paused",
  );
  const elapsedRef = useRef(initialElapsed);
  /**
   * Every control call bumps the generation, and an in-flight animation frame only writes while
   * its generation is still current. Without this, a frame scheduled before a replay could land
   * after it and overwrite the reset, which makes replay look broken.
   */
  const generationRef = useRef(0);
  /**
   * Timestamp of the frame that owns the current `playing` run. Using it to compute the elapsed
   * time makes the clock absolute instead of incremental, so a re-render mid-run cannot skip or
   * repeat any milliseconds.
   */
  const runStartRef = useRef<number | null>(null);
  /**
   * Bumped whenever a control asks for a fresh run. Replaying a clip that is already "playing" does
   * not change `status`, so the animation effect needs this to be re-established from time 0.
   */
  const [runNonce, setRunNonce] = useState(0);
  const clip = clips[Math.min(clipIndex, clips.length - 1)];
  const clipTotal = totalMs(clip);

  const advanceClip = useCallback(
    (delta: number) => {
      generationRef.current += 1;
      runStartRef.current = null;
      setClipIndex((current) => {
        const next = Math.max(0, Math.min(clips.length - 1, current + delta));
        // Reduced motion jumps between completed clips; every other mode starts at time 0.
        // Setting the time here (not in an effect) keeps the two state updates in one commit,
        // so a whole clip can never be observed at a partial time.
        const target = reducedMotion && next !== current ? totalMs(clips[next]) : 0;
        elapsedRef.current = target;
        setElapsedMs(target);
        return next;
      });
    },
    [clips, reducedMotion],
  );

  useEffect(() => {
    if (status !== "playing") {
      runStartRef.current = null;
      return;
    }
    const generation = generationRef.current;
    let frame = 0;
    const tick = (now: number) => {
      if (generationRef.current !== generation) return;
      if (runStartRef.current === null) runStartRef.current = now - elapsedRef.current;
      const start = runStartRef.current;
      const next = now - start;
      if (next >= clipTotal) {
        elapsedRef.current = clipTotal;
        setElapsedMs(clipTotal);
        if (clipIndex < clips.length - 1) {
          generationRef.current += 1;
          runStartRef.current = null;
          setClipIndex(clipIndex + 1);
          elapsedRef.current = 0;
          setElapsedMs(0);
          frame = requestAnimationFrame(tick);
        } else {
          setStatus("finished");
        }
        return;
      }
      elapsedRef.current = next;
      setElapsedMs(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status, clipIndex, clipTotal, clips.length, runNonce]);

  // Reduced motion holds each clip at its completed state so the reader controls the pace.
  // Asking for the end of the clip is idempotent, so re-running it is always safe.
  useEffect(() => {
    if (!reducedMotion || freeze) return;
    elapsedRef.current = clipTotal;
    setElapsedMs(clipTotal);
    setStatus("paused");
  }, [reducedMotion, freeze, clipTotal]);

  useEffect(() => {
    if (clipIndex > clips.length - 1) setClipIndex(Math.max(0, clips.length - 1));
  }, [clipIndex, clips.length]);

  const play = useCallback(() => {
    generationRef.current += 1;
    runStartRef.current = null;
    if (elapsedRef.current >= clipTotal && clipIndex >= clips.length - 1) {
      elapsedRef.current = 0;
      setElapsedMs(0);
    }
    setRunNonce((value) => value + 1);
    setStatus("playing");
  }, [clipIndex, clipTotal, clips.length]);

  const pause = useCallback(() => {
    generationRef.current += 1;
    runStartRef.current = null;
    setStatus("paused");
  }, []);

  const toggle = useCallback(() => {
    if (reducedMotion) {
      if (clipIndex < clips.length - 1) advanceClip(1);
      return;
    }
    generationRef.current += 1;
    runStartRef.current = null;
    setStatus((current) => {
      if (current === "playing") return "paused";
      if (clipIndex >= clips.length - 1 && elapsedRef.current >= clipTotal) {
        elapsedRef.current = 0;
        setElapsedMs(0);
      }
      return "playing";
    });
  }, [advanceClip, clipIndex, clipTotal, clips.length, reducedMotion]);

  const replayClip = useCallback(() => {
    generationRef.current += 1;
    runStartRef.current = null;
    elapsedRef.current = 0;
    setElapsedMs(0);
    setRunNonce((value) => value + 1);
    setStatus(reducedMotion ? "paused" : "playing");
  }, [reducedMotion]);

  const stepBack = useCallback(() => {
    generationRef.current += 1;
    runStartRef.current = null;
    if (clipIndex === 0) {
      elapsedRef.current = 0;
      setElapsedMs(0);
      setStatus("paused");
      return;
    }
    const previous = clipIndex - 1;
    // Reduced motion renders whole clips, so landing on the previous one must not show time 0.
    const target = reducedMotion ? totalMs(clips[previous]) : 0;
    setClipIndex(previous);
    elapsedRef.current = target;
    setElapsedMs(target);
    setStatus("paused");
  }, [clipIndex, clips, reducedMotion]);

  const stepForward = useCallback(() => {
    generationRef.current += 1;
    runStartRef.current = null;
    if (clipIndex >= clips.length - 1) {
      elapsedRef.current = 0;
      setElapsedMs(0);
      setStatus(reducedMotion ? "paused" : "playing");
      return;
    }
    const next = clipIndex + 1;
    const target = reducedMotion ? totalMs(clips[next]) : 0;
    setClipIndex(next);
    elapsedRef.current = target;
    setElapsedMs(target);
    setStatus("paused");
  }, [clipIndex, clips, reducedMotion]);

  const goToClip = useCallback(
    (index: number, options?: { autoPlay?: boolean }) => {
      generationRef.current += 1;
      runStartRef.current = null;
      const next = Math.max(0, Math.min(clips.length - 1, index));
      const target = reducedMotion ? totalMs(clips[next]) : 0;
      setClipIndex(next);
      elapsedRef.current = target;
      setElapsedMs(target);
      setStatus(options?.autoPlay === false || reducedMotion ? "paused" : "playing");
    },
    [clips, reducedMotion],
  );

  const state = useMemo<TimelineState>(() => {
    const progress = elapsedMs >= clip.durationMs ? 1 : Math.min(1, elapsedMs / clip.durationMs);
    return {
      clipIndex,
      clip,
      progress,
      elapsedMs,
      status,
      isHolding: elapsedMs >= clip.durationMs,
      atStart: clipIndex === 0 && elapsedMs <= 0,
      atEnd: clipIndex >= clips.length - 1 && elapsedMs >= clipTotal,
      hasPrevious: clipIndex > 0,
      hasNext: clipIndex < clips.length - 1,
      totalClips: clips.length,
    };
  }, [clip, clipIndex, clipTotal, elapsedMs, status, clips.length]);

  return { state, controls: { play, pause, toggle, replayClip, stepBack, stepForward, goToClip } };
}

/** Picks the narrative line that explains what is happening right now. */
export function activeNarrationIndex(lines: readonly string[], progress: number): number {
  if (lines.length <= 1) return 0;
  const index = Math.ceil(Math.min(progress, 0.999) * lines.length) - 1;
  return Math.max(0, Math.min(lines.length - 1, index));
}

/** Visual-QA freeze instruction, set by the capture script before the app boots. */
export function readFreezeRequest(): { clip?: number; pct?: number } | null {
  if (typeof window === "undefined") return null;
  const request = window.__ICARL_FREEZE__;
  return request && typeof request === "object" ? request : null;
}
