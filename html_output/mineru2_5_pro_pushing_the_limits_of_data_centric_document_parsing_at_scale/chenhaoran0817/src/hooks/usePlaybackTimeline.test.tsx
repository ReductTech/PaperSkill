import { act, fireEvent, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GlossaryButton, GlossaryProvider } from '../components/Glossary';
import { usePlaybackTimeline } from './usePlaybackTimeline';

function GlossaryHarness({ children }: { children: ReactNode }) {
  return <GlossaryProvider><GlossaryButton>页头术语表</GlossaryButton>{children}</GlossaryProvider>;
}

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

  it('saves elapsed progress when the provider glossary opens and does not auto-resume after close', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
    const timeline = renderHook(
      () => usePlaybackTimeline({ durationMs: 24000, beatMs: [0, 8000, 16000, 24000] }),
      { wrapper: GlossaryHarness },
    );

    try {
      act(() => timeline.result.current.play());
      act(() => vi.advanceTimersByTime(1100));
      expect(timeline.result.current.currentMs).toBeGreaterThan(0);

      fireEvent.click(screen.getByRole('button', { name: '页头术语表' }));
      const pausedAt = timeline.result.current.currentMs;
      act(() => vi.advanceTimersByTime(5000));
      expect(timeline.result.current.playing).toBe(false);
      expect(timeline.result.current.currentMs).toBe(pausedAt);

      fireEvent.click(screen.getByRole('button', { name: '页头术语表' }));
      act(() => vi.advanceTimersByTime(5000));
      expect(timeline.result.current.playing).toBe(false);
      expect(timeline.result.current.currentMs).toBe(pausedAt);
    } finally {
      act(() => timeline.result.current.pause());
    }
  });
});
