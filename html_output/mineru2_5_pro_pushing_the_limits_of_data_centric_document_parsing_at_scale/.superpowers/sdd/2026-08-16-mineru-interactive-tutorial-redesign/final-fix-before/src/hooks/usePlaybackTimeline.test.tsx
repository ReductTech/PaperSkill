import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePlaybackTimeline } from './usePlaybackTimeline';

describe('usePlaybackTimeline', () => {
  afterEach(() => {
    delete (document as unknown as { hidden?: boolean }).hidden;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('advances through beats, seeks by progress, and pauses when visibility changes', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
    const timeline = renderHook(() => usePlaybackTimeline({ durationMs: 24000, beatMs: [0, 8000, 16000, 24000] }));

    act(() => timeline.result.current.play());
    act(() => vi.advanceTimersByTime(8100));
    expect(timeline.result.current.activeBeat).toBe(1);

    act(() => timeline.result.current.seek(0.75));
    expect(timeline.result.current.currentMs).toBe(18000);

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(timeline.result.current.playing).toBe(false);
  });

  it('keeps playing for a visible visibilitychange and pauses only after the document becomes hidden', () => {
    const timeline = renderHook(() => usePlaybackTimeline({ durationMs: 24000, beatMs: [0, 8000, 16000, 24000] }));

    act(() => timeline.result.current.play());
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(timeline.result.current.playing).toBe(true);

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(timeline.result.current.playing).toBe(false);
  });
});
