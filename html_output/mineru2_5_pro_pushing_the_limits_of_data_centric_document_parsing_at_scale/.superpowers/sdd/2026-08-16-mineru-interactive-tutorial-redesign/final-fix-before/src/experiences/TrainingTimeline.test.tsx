import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TrainingTimeline } from './TrainingTimeline';

const props = () => ({
  stepId: 'step-5',
  modules: [],
  onInteract: vi.fn(),
  onStateChange: vi.fn(),
  onComplete: vi.fn(),
});

describe('TrainingTimeline', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('plays and pauses the 24-second narrative, then scrubs into the Stage 3 rollout frame', () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16) as unknown as number);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => clearTimeout(id));
    const callbacks = props();
    render(<TrainingTimeline {...callbacks} />);

    expect(screen.getByText('65.5M')).toBeVisible();
    expect(screen.queryByTestId('rollout-field')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '播放训练过程' }));
    expect(screen.getByRole('button', { name: '暂停训练过程' })).toBeVisible();
    act(() => vi.advanceTimersByTime(8100));
    expect(screen.getByText('3.9M')).toBeVisible();
    expect(screen.getByText('其中 192K Hard')).toBeVisible();
    expect(screen.getByText('Replay')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '暂停训练过程' }));
    expect(screen.getByRole('button', { name: '播放训练过程' })).toBeVisible();
    fireEvent.change(screen.getByRole('slider', { name: '训练时间轴' }), { target: { value: '75' } });
    expect(screen.getAllByTestId('rollout-dot')).toHaveLength(16);
    expect(callbacks.onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '表格指标' }));
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'grpo-lab', state: 'metric-teds' });
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '重播' }));
    expect(screen.getByText('65.5M')).toBeVisible();
    expect(screen.getByRole('button', { name: '暂停训练过程' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '暂停训练过程' }));
  });

  it('maps each task to its paper-supported reward and reorders stable candidate rows', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<TrainingTimeline {...callbacks} restoredModuleState={{ moduleId: 'stage-training', state: 'stage-3' }} />);
    const ranking = screen.getByTestId('candidate-ranking');

    await user.click(screen.getByRole('button', { name: '文本指标' }));
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'grpo-lab', state: 'metric-edit-distance' });
    expect(within(ranking).getAllByRole('listitem')[0]).toHaveAttribute('data-candidate-id', 'candidate-b');

    await user.click(screen.getByRole('button', { name: '公式指标' }));
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'grpo-lab', state: 'metric-cdm' });

    await user.click(screen.getByRole('button', { name: '表格指标' }));
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'grpo-lab', state: 'metric-teds' });

    await user.click(screen.getByRole('button', { name: '版面指标' }));
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'grpo-lab', state: 'metric-iou' });
    expect(within(ranking).getAllByRole('listitem')[0]).toHaveAttribute('data-candidate-id', 'candidate-d');
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not auto-play when reduced motion is requested and keeps manual stage controls available', () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    const callbacks = props();
    render(<TrainingTimeline {...callbacks} />);

    expect(screen.getByRole('button', { name: '播放训练过程' })).toBeDisabled();
    expect(screen.getByText(/减少动态效果/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '下一阶段' }));
    expect(screen.getByText('3.9M')).toBeVisible();
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'stage-training', state: 'stage-2' });
  });
});
