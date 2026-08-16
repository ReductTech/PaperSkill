import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GlossaryProvider } from '../components/Glossary';
import trainingCss from '../styles/experience-training.css?raw';
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
    render(<TrainingTimeline {...callbacks} />, { wrapper: GlossaryProvider });

    expect(screen.getByText('65.5M')).toBeVisible();
    expect(screen.queryByTestId('rollout-field')).not.toBeInTheDocument();
    expect(screen.getByTestId('model-stage-diagram')).toHaveAttribute('data-stage', '1');

    fireEvent.click(screen.getByRole('button', { name: '播放训练过程' }));
    expect(screen.getByRole('button', { name: '暂停训练过程' })).toBeVisible();
    act(() => vi.advanceTimersByTime(8100));
    expect(screen.getByText('3.9M')).toBeVisible();
    expect(screen.getByText('其中 192K Hard')).toBeVisible();
    expect(screen.getByText('Replay')).toBeVisible();
    expect(screen.getByTestId('model-stage-diagram')).toHaveAttribute('data-stage', '2');

    fireEvent.click(screen.getByRole('button', { name: '暂停训练过程' }));
    expect(screen.getByRole('button', { name: '播放训练过程' })).toBeVisible();
    fireEvent.change(screen.getByRole('slider', { name: '训练时间轴' }), { target: { value: '75' } });
    expect(screen.getAllByTestId('rollout-dot')).toHaveLength(16);
    expect(screen.getByTestId('model-stage-diagram')).toHaveAttribute('data-stage', '3');
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
    render(<TrainingTimeline {...callbacks} restoredModuleState={{ moduleId: 'stage-training', state: 'stage-3' }} />, { wrapper: GlossaryProvider });
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
    render(<TrainingTimeline {...callbacks} />, { wrapper: GlossaryProvider });

    expect(screen.getByRole('button', { name: '播放训练过程' })).toBeDisabled();
    expect(screen.getByText(/减少动态效果/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '下一阶段' }));
    expect(screen.getByText('3.9M')).toBeVisible();
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'stage-training', state: 'stage-2' });
  });

  it('replaces the paper crop with a self-built diagram that evolves per stage', () => {
    const { container } = render(<TrainingTimeline {...props()} />, { wrapper: GlossaryProvider });
    const section = container.querySelector('.training-timeline') as HTMLElement;

    expect(section.querySelector('.paper-media')).toBeNull();
    const diagram = screen.getByTestId('model-stage-diagram');
    expect(diagram).toHaveAttribute('data-stage', '1');
    expect(screen.getByRole('img', { name: /自制教学示意：第 1 阶段/ })).toBe(diagram);
    expect(diagram.querySelectorAll('.tt-layer')).toHaveLength(4);
    expect(diagram.querySelector('.tt-s1')).not.toBeNull();
    expect(diagram.querySelector('.tt-s2 .tt-replay')).not.toBeNull();
    expect(diagram.querySelectorAll('.tt-s3 .tt-rollout-dot')).toHaveLength(4);
    expect(screen.getByText('教学示意 · 随阶段演化')).toBeVisible();
  });

  it('declares stage-driven diagram rules with a reduced-motion fallback', () => {
    expect(trainingCss).not.toMatch(/training-timeline__paper/);
    expect(trainingCss).toMatch(/\.tt-model-diagram\[data-stage="1"\] \.tt-s1,\s*\.tt-model-diagram\[data-stage="2"\] \.tt-s2,\s*\.tt-model-diagram\[data-stage="3"\] \.tt-s3\s*\{[^}]*opacity:\s*1/s);
    expect(trainingCss).toMatch(/\.tt-model-diagram\[data-stage="3"\] \.tt-layer\s*\{[^}]*fill:\s*#7fd6a8/s);
    expect(trainingCss).toMatch(/\.tt-model-diagram\[data-stage="2"\] \.tt-layer--3\s*\{[^}]*fill:\s*#79b7ea/s);
    expect(trainingCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.tt-flow-hl,\s*\.tt-replay,\s*\.tt-grad\s*\{[^}]*animation:\s*none/s);
  });

  it('opens the reward and metric definitions at the Stage 3 ranking point of use', async () => {
    const user = userEvent.setup();
    render(<TrainingTimeline {...props()} restoredModuleState={{ moduleId: 'stage-training', state: 'stage-3' }} />, { wrapper: GlossaryProvider });

    expect(screen.getByRole('button', { name: '解释术语：Rollout' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: '解释术语：任务奖励' }));
    expect(screen.getByRole('heading', { name: '任务奖励' })).toBeVisible();
    expect(screen.getByText(/与具体任务相匹配的评分函数/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: '关闭术语讲解' }));

    await user.click(screen.getByRole('button', { name: '解释术语：编辑距离' }));
    expect(screen.getByRole('heading', { name: '编辑距离' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: '关闭术语讲解' }));
  });
});
