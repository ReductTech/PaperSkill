import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "../accessibility/useReducedMotion";

export type TimelineClip = { id: string; durationMs: number; holdMs?: number };
export type TimelineStatus = "playing" | "paused" | "finished" | "empty" | "invalid";
export type TimelineClock = {
  request: (callback: FrameRequestCallback) => number;
  cancel: (handle: number) => void;
};

export type TimelineState = {
  clipIndex: number;
  clipId: string | null;
  clip: TimelineClip | null;
  progress: number;
  elapsedMs: number;
  isHolding: boolean;
  status: TimelineStatus;
  atStart: boolean;
  atEnd: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  totalClips: number;
  errors: string[];
};

export type TimelineControls = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  replayClip: () => void;
  stepBack: () => void;
  stepForward: () => void;
  goToClip: (index: number, options?: { autoPlay?: boolean; progress?: number }) => void;
};

type Snapshot = { clipIndex: number; elapsedMs: number; status: TimelineStatus };
const boundedIndex = (index: number, length: number) => Number.isFinite(index) ? Math.max(0, Math.min(length - 1, Math.floor(index))) : 0;

const browserClock: TimelineClock = {
  request: (callback) => window.requestAnimationFrame(callback),
  cancel: (handle) => window.cancelAnimationFrame(handle),
};

export const timelineClipTotal = (clip: TimelineClip) => clip.durationMs + (clip.holdMs ?? 0);

export function validateTimelineClips(clips: readonly TimelineClip[]) {
  const errors: string[] = [];
  const ids = new Set<string>();
  clips.forEach((clip, index) => {
    if (!clip.id.trim()) errors.push(`Clip ${index + 1} needs a stable id.`);
    if (ids.has(clip.id)) errors.push(`Clip id '${clip.id}' is duplicated.`);
    ids.add(clip.id);
    if (!Number.isFinite(clip.durationMs) || clip.durationMs <= 0) errors.push(`Clip '${clip.id}' needs durationMs > 0.`);
    if (clip.holdMs !== undefined && (!Number.isFinite(clip.holdMs) || clip.holdMs < 0)) errors.push(`Clip '${clip.id}' needs holdMs >= 0.`);
  });
  return errors;
}

export function useAnimationTimeline({
  clips,
  autoPlay = false,
  reducedMotion: reducedMotionOverride,
  clock = browserClock,
  initialState,
}: {
  clips: readonly TimelineClip[];
  autoPlay?: boolean;
  reducedMotion?: boolean;
  clock?: TimelineClock;
  initialState?: { clipIndex?: number; elapsedMs?: number; status?: "playing" | "paused" };
}): { state: TimelineState; controls: TimelineControls } {
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = reducedMotionOverride ?? systemReducedMotion;
  const errors = useMemo(() => validateTimelineClips(clips), [clips]);
  const usable = clips.length > 0 && errors.length === 0;
  const initialIndex = usable ? boundedIndex(initialState?.clipIndex ?? 0, clips.length) : 0;
  const initialClip = usable ? clips[initialIndex] : null;
  const initialElapsed = initialClip
    ? reducedMotion
      ? timelineClipTotal(initialClip)
      : Math.max(0, Math.min(timelineClipTotal(initialClip), Number.isFinite(initialState?.elapsedMs) ? initialState!.elapsedMs! : 0))
    : 0;
  const [snapshot, setSnapshot] = useState<Snapshot>({
    clipIndex: initialIndex,
    elapsedMs: initialElapsed,
    status: !clips.length ? "empty" : errors.length ? "invalid" : reducedMotion ? "paused" : initialState?.status ?? (autoPlay ? "playing" : "paused"),
  });
  const elapsedRef = useRef(initialElapsed);
  const generationRef = useRef(0);
  const runStartRef = useRef<number | null>(null);
  const previousClipsRef = useRef(clips);
  // Restart an already-playing clip even when its index/status do not change.
  const [runNonce, setRunNonce] = useState(0);

  const safeIndex = usable ? Math.max(0, Math.min(clips.length - 1, snapshot.clipIndex)) : 0;
  const clip = usable ? clips[safeIndex] : null;
  const clipTotal = clip ? timelineClipTotal(clip) : 0;

  const stopCurrentRun = useCallback(() => {
    generationRef.current += 1;
    runStartRef.current = null;
  }, []);

  useEffect(() => {
    const previous = previousClipsRef.current;
    // Reconcile a replaced clip list only. RAF may advance elapsedRef before a
    // previous render's passive effects flush; that is ordinary playback, not
    // a config change, and must never pause the clock.
    if (previous === clips) return;
    previousClipsRef.current = clips;
    if (!clips.length || errors.length) {
      stopCurrentRun();
      elapsedRef.current = 0;
      const status = clips.length ? "invalid" : "empty";
      setSnapshot((current) => current.clipIndex === 0 && current.elapsedMs === 0 && current.status === status
        ? current
        : { clipIndex: 0, elapsedMs: 0, status });
      return;
    }
    const previousId = previous[Math.min(snapshot.clipIndex, Math.max(0, previous.length - 1))]?.id;
    const nextIndex = Math.max(0, previousId ? clips.findIndex((candidate) => candidate.id === previousId) : 0);
    const boundedIndex = nextIndex < clips.length ? nextIndex : 0;
    const target = reducedMotion ? timelineClipTotal(clips[boundedIndex]) : Math.min(elapsedRef.current, timelineClipTotal(clips[boundedIndex]));
    if (boundedIndex !== snapshot.clipIndex || target !== snapshot.elapsedMs || snapshot.status === "empty" || snapshot.status === "invalid") {
      stopCurrentRun();
      elapsedRef.current = target;
      setSnapshot({ clipIndex: boundedIndex, elapsedMs: target, status: reducedMotion ? "paused" : "paused" });
    }
  }, [clips, errors.length, reducedMotion, snapshot.clipIndex, snapshot.elapsedMs, snapshot.status, stopCurrentRun]);

  useEffect(() => {
    if (!usable || !clip || !reducedMotion) return;
    stopCurrentRun();
    const target = timelineClipTotal(clip);
    elapsedRef.current = target;
    setSnapshot((current) => current.elapsedMs === target && current.status === "paused" ? current : { ...current, elapsedMs: target, status: "paused" });
  }, [clip, reducedMotion, stopCurrentRun, usable]);

  useEffect(() => {
    if (!usable || !clip || reducedMotion || snapshot.status !== "playing") return;
    const generation = generationRef.current;
    let handle = 0;
    const tick: FrameRequestCallback = (now) => {
      if (generation !== generationRef.current) return;
      if (runStartRef.current === null) runStartRef.current = now - elapsedRef.current;
      const next = Math.max(0, now - runStartRef.current);
      if (next >= clipTotal) {
        elapsedRef.current = clipTotal;
        if (safeIndex < clips.length - 1) {
          runStartRef.current = null;
          elapsedRef.current = 0;
          setSnapshot({ clipIndex: safeIndex + 1, elapsedMs: 0, status: "playing" });
        } else {
          setSnapshot({ clipIndex: safeIndex, elapsedMs: clipTotal, status: "finished" });
        }
        return;
      }
      elapsedRef.current = next;
      setSnapshot({ clipIndex: safeIndex, elapsedMs: next, status: "playing" });
      handle = clock.request(tick);
    };
    handle = clock.request(tick);
    return () => clock.cancel(handle);
  }, [clock, clip, clipTotal, clips.length, reducedMotion, runNonce, safeIndex, snapshot.status, usable]);

  const setClip = useCallback((index: number, status: TimelineStatus, progress = 0) => {
    if (!usable) return;
    stopCurrentRun();
    const next = boundedIndex(index, clips.length);
    const elapsedMs = reducedMotion ? timelineClipTotal(clips[next]) : Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0)) * clips[next].durationMs;
    elapsedRef.current = elapsedMs;
    setRunNonce(value => value + 1);
    setSnapshot({ clipIndex: next, elapsedMs, status: reducedMotion ? "paused" : status });
  }, [clips, reducedMotion, stopCurrentRun, usable]);

  const play = useCallback(() => {
    if (!usable || reducedMotion) return;
    stopCurrentRun();
    let elapsedMs = elapsedRef.current;
    if (safeIndex === clips.length - 1 && elapsedMs >= clipTotal) elapsedMs = 0;
    elapsedRef.current = elapsedMs;
    setRunNonce(value => value + 1);
    setSnapshot({ clipIndex: safeIndex, elapsedMs, status: "playing" });
  }, [clipTotal, clips.length, reducedMotion, safeIndex, stopCurrentRun, usable]);

  const pause = useCallback(() => {
    if (!usable) return;
    stopCurrentRun();
    setSnapshot((current) => ({ ...current, status: "paused" }));
  }, [stopCurrentRun, usable]);

  const toggle = useCallback(() => {
    if (!usable) return;
    if (reducedMotion) {
      if (safeIndex < clips.length - 1) setClip(safeIndex + 1, "paused");
      return;
    }
    if (snapshot.status === "playing") pause(); else play();
  }, [clips.length, pause, play, reducedMotion, safeIndex, setClip, snapshot.status, usable]);

  const replayClip = useCallback(() => {
    if (!usable) return;
    setClip(safeIndex, "playing");
  }, [safeIndex, setClip, usable]);

  const stepBack = useCallback(() => setClip(Math.max(0, safeIndex - 1), "paused"), [safeIndex, setClip]);
  const stepForward = useCallback(() => {
    if (!usable) return;
    if (safeIndex >= clips.length - 1) {
      stopCurrentRun();
      const elapsedMs = clipTotal;
      elapsedRef.current = elapsedMs;
      setSnapshot({ clipIndex: safeIndex, elapsedMs, status: reducedMotion ? "paused" : "finished" });
      return;
    }
    setClip(safeIndex + 1, "paused");
  }, [clipTotal, clips.length, reducedMotion, safeIndex, setClip, stopCurrentRun, usable]);

  const goToClip = useCallback((index: number, options?: { autoPlay?: boolean; progress?: number }) => {
    setClip(index, options?.autoPlay ? "playing" : "paused", options?.progress);
  }, [setClip]);

  const state = useMemo<TimelineState>(() => {
    if (!usable || !clip) return {
      clipIndex: 0, clipId: null, clip: null, progress: 0, elapsedMs: 0, isHolding: false,
      status: clips.length ? "invalid" : "empty", atStart: true, atEnd: true,
      hasPrevious: false, hasNext: false, totalClips: clips.length, errors,
    };
    const elapsedMs = Math.max(0, Math.min(snapshot.elapsedMs, clipTotal));
    return {
      clipIndex: safeIndex,
      clipId: clip.id,
      clip,
      progress: Math.max(0, Math.min(1, elapsedMs / clip.durationMs)),
      elapsedMs,
      isHolding: elapsedMs >= clip.durationMs && elapsedMs < clipTotal,
      status: snapshot.status,
      atStart: safeIndex === 0 && elapsedMs === 0,
      atEnd: safeIndex === clips.length - 1 && elapsedMs >= clipTotal,
      hasPrevious: safeIndex > 0,
      hasNext: safeIndex < clips.length - 1,
      totalClips: clips.length,
      errors,
    };
  }, [clip, clipTotal, clips.length, errors, safeIndex, snapshot.elapsedMs, snapshot.status, usable]);

  return { state, controls: { play, pause, toggle, replayClip, stepBack, stepForward, goToClip } };
}
