import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlossaryButton, GlossaryProvider } from './Glossary';
import { ResearchProblemOverview } from './ResearchProblemOverview';

let intersectionCallback: IntersectionObserverCallback | undefined;

class ControlledIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
  }

  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn((): IntersectionObserverEntry[] => []);
  unobserve = vi.fn();
}

describe('ResearchProblemOverview', () => {
  beforeEach(() => {
    intersectionCallback = undefined;
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', ControlledIntersectionObserver);
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false } as MediaQueryList);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('pauses its saved causal-chain step when the header glossary opens and stays paused after close', () => {
    render(
      <GlossaryProvider>
        <GlossaryButton>页头术语表</GlossaryButton>
        <ResearchProblemOverview />
      </GlossaryProvider>,
    );
    const overview = screen.getByLabelText('论文问题与贡献因果链').closest('section');
    expect(overview).not.toBeNull();

    act(() => intersectionCallback?.([
      { isIntersecting: true, target: overview as Element } as unknown as IntersectionObserverEntry,
    ], {} as IntersectionObserver));
    act(() => vi.advanceTimersByTime(1550));
    expect(screen.getByText('02 / 04')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '页头术语表' }));
    act(() => vi.advanceTimersByTime(6200));
    expect(screen.getByText('02 / 04')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '页头术语表' }));
    act(() => vi.advanceTimersByTime(6200));
    expect(screen.getByText('02 / 04')).toBeVisible();
  });
});
