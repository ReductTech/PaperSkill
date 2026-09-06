import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlossaryButton, GlossaryProvider } from '../components/Glossary';
import experienceDataCss from '../styles/experience-data.css?raw';
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

  it('keeps six stable slots and replaces fixed positions with self-built long-tail pages during preview without persistence', async () => {
    vi.useFakeTimers();
    const callbacks = props();
    render(<DataCounterfactual {...callbacks} />);
    const root = screen.getByLabelText('等预算数据反事实');
    const slots = screen.getAllByTestId('budget-slot');

    expect(slots).toHaveLength(6);
    expect(screen.getByRole('button', { name: '继续普通页' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '补长尾页' })).toHaveAttribute('aria-pressed', 'false');
    expect(root.querySelectorAll('.ordinary-page[aria-label*="教学示意"]')).toHaveLength(6);
    expect(root.querySelectorAll('.budget-slot .tail-page')).toHaveLength(0);
    expect(root.querySelectorAll('.budget-slot .paper-media')).toHaveLength(0);

    await act(() => vi.advanceTimersByTimeAsync(6000));
    expect(root).toHaveAttribute('data-preview', 'waiting');
    expect(screen.getAllByTestId('budget-slot')).toEqual(slots);

    enterViewport(root);
    expect(root).toHaveAttribute('data-preview', 'ordinary-arriving');
    expect(screen.getByText('复杂公式').closest('.gap-chip')).toHaveAttribute('data-covered', 'false');

    await act(() => vi.advanceTimersByTimeAsync(2500));
    expect(root).toHaveAttribute('data-preview', 'tail-formula');
    expect(slots[3].querySelector('.tail-page')).toHaveAttribute('data-page-kind', 'formula');
    expect(screen.getByText('复杂公式').closest('.gap-chip')).toHaveAttribute('data-covered', 'true');
    expect(screen.getByText('复杂表格').closest('.gap-chip')).toHaveAttribute('data-covered', 'false');

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(root).toHaveAttribute('data-preview', 'tail-table');
    expect(slots[4].querySelector('.tail-page')).toHaveAttribute('data-page-kind', 'table');
    expect(screen.getByText('复杂表格').closest('.gap-chip')).toHaveAttribute('data-covered', 'true');
    expect(screen.getByText('多栏版式').closest('.gap-chip')).toHaveAttribute('data-covered', 'false');

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(root).toHaveAttribute('data-preview', 'tail-multicolumn');
    expect(slots[5].querySelector('.tail-page')).toHaveAttribute('data-page-kind', 'multicolumn');
    expect(screen.getByText('多栏版式').closest('.gap-chip')).toHaveAttribute('data-covered', 'true');

    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(root).toHaveAttribute('data-preview', 'complete');

    expect(screen.getByText('固定 1.2B')).toBeVisible();
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
    expect(callbacks.onComplete).not.toHaveBeenCalled();
    expect(screen.getAllByTestId('budget-slot')).toEqual(slots);
  });

  it('moves directly to the stable final preview frame when reduced motion becomes visible', () => {
    setReducedMotion(true);
    const callbacks = props();
    render(<DataCounterfactual {...callbacks} />);
    const root = screen.getByLabelText('等预算数据反事实');

    expect(root).toHaveAttribute('data-preview', 'waiting');
    enterViewport(root);
    expect(root).toHaveAttribute('data-preview', 'complete');
    expect(screen.getByText('复杂公式').closest('.gap-chip')).toHaveAttribute('data-covered', 'true');
    expect(screen.getByText('复杂表格').closest('.gap-chip')).toHaveAttribute('data-covered', 'true');
    expect(screen.getByText('多栏版式').closest('.gap-chip')).toHaveAttribute('data-covered', 'true');
    expect(screen.getByText('自动对照仅建立直觉；只有你的选择会保存状态。')).toBeVisible();
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
    expect(callbacks.onComplete).not.toHaveBeenCalled();
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
    expect(screen.getByRole('button', { name: '继续普通页' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '补长尾页' })).toHaveAttribute('aria-pressed', 'false');
    act(() => vi.advanceTimersByTime(10_000));
    expect(root).toHaveAttribute('data-preview', 'user-ordinary');
    expect(screen.getByText('复杂公式').closest('.gap-chip')).toHaveAttribute('data-covered', 'false');
    expect(callbacks.onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '补长尾页' }));
    expect(root).toHaveAttribute('data-preview', 'user-tail');
    expect(screen.getByRole('button', { name: '继续普通页' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '补长尾页' })).toHaveAttribute('aria-pressed', 'true');
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
  });

  it('uses three self-built long-tail pages with one category source link and one boundary', async () => {
    const user = userEvent.setup();
    render(<DataCounterfactual {...props()} />);

    await user.click(screen.getByRole('button', { name: '补长尾页' }));

    expect(screen.getAllByTestId('budget-slot')).toHaveLength(6);
    expect(screen.getByRole('img', { name: /教学示意：复杂公式页/ })).toBeVisible();
    expect(screen.getByRole('img', { name: /教学示意：复杂表格页/ })).toBeVisible();
    expect(screen.getByRole('img', { name: /教学示意：多栏版式页/ })).toBeVisible();
    expect(screen.getAllByRole('link', { name: /版式类别参照：OmniDocBench/ })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /版式类别参照：OmniDocBench/ })).toHaveAttribute('href', 'https://arxiv.org/pdf/2412.07626');
    expect(screen.getAllByText(/三个长尾格是自制教学示意/)).toHaveLength(1);
  });

  it('maps the three gap labels to desktop columns four through six and keeps explicit mobile slot labels', () => {
    render(<DataCounterfactual {...props()} />);
    const chips = ['复杂公式', '复杂表格', '多栏版式'].map((label) => screen.getByText(label).closest('.gap-chip'));
    expect(chips[0]).toHaveAttribute('data-slot', '4');
    expect(chips[1]).toHaveAttribute('data-slot', '5');
    expect(chips[2]).toHaveAttribute('data-slot', '6');
    expect(chips[0]).toHaveTextContent('槽位 4');
    expect(chips[1]).toHaveTextContent('槽位 5');
    expect(chips[2]).toHaveTextContent('槽位 6');

    const gapsRule = /\.data-counterfactual__gaps\s*\{([^}]*)\}/.exec(experienceDataCss)?.[1] ?? '';
    expect(gapsRule).toMatch(/grid-template-columns:\s*repeat\(6/);
    for (const column of [4, 5, 6]) {
      const rule = new RegExp(`\\.gap-chip\\[data-slot="${column}"\\]\\s*\\{([^}]*)\\}`).exec(experienceDataCss)?.[1] ?? '';
      expect(rule).toMatch(new RegExp(`grid-column:\\s*${column}`));
    }
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

    expect(screen.getByText('复杂公式').closest('.gap-chip')).toHaveAttribute('data-covered', 'true');
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'data-bias', state: 'tail' });
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText('+2.71')).toHaveAccessibleDescription(/完整流程/);
  });
});
