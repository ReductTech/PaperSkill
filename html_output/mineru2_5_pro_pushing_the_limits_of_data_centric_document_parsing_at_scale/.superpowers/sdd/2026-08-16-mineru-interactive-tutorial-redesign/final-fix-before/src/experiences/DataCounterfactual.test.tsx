import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataCounterfactual } from './DataCounterfactual';

const props = () => ({
  stepId: 'step-1',
  modules: [],
  onInteract: vi.fn(),
  onStateChange: vi.fn(),
  onComplete: vi.fn(),
});

describe('DataCounterfactual', () => {
  it('does not persist or complete during the six-second automatic intuition preview', async () => {
    vi.useFakeTimers();
    const callbacks = props();
    render(<DataCounterfactual {...callbacks} />);

    await vi.advanceTimersByTimeAsync(6000);

    expect(screen.getByText('固定 1.2B')).toBeVisible();
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
    expect(callbacks.onComplete).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('shows the static comparison immediately when reduced motion is requested', () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    const callbacks = props();
    render(<DataCounterfactual {...callbacks} />);

    expect(screen.getByText('自动对照仅建立直觉；只有你的选择会保存状态。')).toBeVisible();
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
