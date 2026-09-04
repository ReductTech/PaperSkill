import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlossaryButton, GlossaryProvider } from '../components/Glossary';
import { DataCounterfactual } from './DataCounterfactual';

const props = () => ({
  stepId: 'step-1',
  modules: [],
  onInteract: vi.fn(),
  onStateChange: vi.fn(),
  onComplete: vi.fn(),
});

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

function setReducedMotion(matches: boolean) {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function enterViewport(root: HTMLElement) {
  act(() => intersectionCallback?.([
    { isIntersecting: true, target: root } as unknown as IntersectionObserverEntry,
  ], {} as IntersectionObserver));
}

describe('DataCounterfactual', () => {
  beforeEach(() => {
    intersectionCallback = undefined;
    vi.stubGlobal('IntersectionObserver', ControlledIntersectionObserver);
    setReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setReducedMotion(false);
  });

  it('waits for first visibility, then drives the lanes and gaps through a six-second causal preview without persistence', async () => {
    vi.useFakeTimers();
    const callbacks = props();
    render(<DataCounterfactual {...callbacks} />);
    const root = screen.getByLabelText('等预算数据反事实');

    await act(() => vi.advanceTimersByTimeAsync(6000));
    expect(root).toHaveAttribute('data-preview', 'waiting');
    expect(root.querySelector('.counterfactual-lane--ordinary')).toHaveAttribute('data-active', 'false');

    enterViewport(root);
    expect(root).toHaveAttribute('data-preview', 'ordinary-arriving');
    expect(root.querySelector('.counterfactual-lane--ordinary')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('复杂公式')).toHaveAttribute('data-covered', 'false');

    await act(() => vi.advanceTimersByTimeAsync(2500));
    expect(root).toHaveAttribute('data-preview', 'tail-formula');
    expect(root.querySelector('.counterfactual-lane--tail')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('复杂公式')).toHaveAttribute('data-covered', 'true');
    expect(screen.getByText('复杂表格')).toHaveAttribute('data-covered', 'false');

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(root).toHaveAttribute('data-preview', 'tail-table');
    expect(screen.getByText('复杂表格')).toHaveAttribute('data-covered', 'true');
    expect(screen.getByText('多栏版式')).toHaveAttribute('data-covered', 'false');

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(root).toHaveAttribute('data-preview', 'tail-multicolumn');
    expect(screen.getByText('多栏版式')).toHaveAttribute('data-covered', 'true');

    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(root).toHaveAttribute('data-preview', 'complete');

    expect(screen.getByText('固定 1.2B')).toBeVisible();
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
    expect(callbacks.onComplete).not.toHaveBeenCalled();
  });

  it('moves directly to the stable final preview frame when reduced motion becomes visible', () => {
    setReducedMotion(true);
    const callbacks = props();
    render(<DataCounterfactual {...callbacks} />);
    const root = screen.getByLabelText('等预算数据反事实');

    expect(root).toHaveAttribute('data-preview', 'waiting');
    enterViewport(root);
    expect(root).toHaveAttribute('data-preview', 'complete');
    expect(screen.getByText('复杂公式')).toHaveAttribute('data-covered', 'true');
    expect(screen.getByText('复杂表格')).toHaveAttribute('data-covered', 'true');
    expect(screen.getByText('多栏版式')).toHaveAttribute('data-covered', 'true');
    expect(screen.getByText('自动对照仅建立直觉；只有你的选择会保存状态。')).toBeVisible();
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
  });

  it('lets a learner take over immediately and prevents the automatic preview from resuming', () => {
    vi.useFakeTimers();
    const callbacks = props();
    render(<DataCounterfactual {...callbacks} />);
    const root = screen.getByLabelText('等预算数据反事实');
    enterViewport(root);
    act(() => vi.advanceTimersByTime(2500));

    fireEvent.click(screen.getByRole('button', { name: '继续普通页' }));
    expect(root).toHaveAttribute('data-preview', 'user-ordinary');
    act(() => vi.advanceTimersByTime(10_000));
    expect(root).toHaveAttribute('data-preview', 'user-ordinary');
    expect(screen.getByText('复杂公式')).toHaveAttribute('data-covered', 'false');
    expect(callbacks.onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '补长尾页' }));
    expect(root).toHaveAttribute('data-preview', 'user-tail');
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
  });

  it('pauses the visible preview at its current phase when the global glossary opens and does not force resume on close', () => {
    vi.useFakeTimers();
    const callbacks = props();
    render(
      <GlossaryProvider>
        <GlossaryButton>页头术语表</GlossaryButton>
        <DataCounterfactual {...callbacks} />
      </GlossaryProvider>,
    );
    const root = screen.getByLabelText('等预算数据反事实');
    enterViewport(root);
    act(() => vi.advanceTimersByTime(1000));
    expect(root).toHaveAttribute('data-preview', 'ordinary-arriving');

    fireEvent.click(screen.getByRole('button', { name: '页头术语表' }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(root).toHaveAttribute('data-preview', 'ordinary-arriving');

    fireEvent.click(screen.getByRole('button', { name: '页头术语表' }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(root).toHaveAttribute('data-preview', 'ordinary-arriving');
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
  });

  it('records and completes only after the learner chooses the long-tail counterfactual', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<DataCounterfactual {...callbacks} />);

    await user.click(screen.getByRole('button', { name: '补长尾页' }));

    expect(screen.getByText('复杂公式')).toHaveAttribute('data-covered', 'true');
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'data-bias', state: 'tail' });
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText('+2.71')).toHaveAccessibleDescription(/完整流程/);
  });
});
