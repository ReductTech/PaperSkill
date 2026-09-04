import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GlossaryProvider } from '../components/Glossary';
import { CmcvRoutingChallenge } from './CmcvRoutingChallenge';

const props = () => ({
  stepId: 'step-3',
  modules: [],
  onInteract: vi.fn(),
  onStateChange: vi.fn(),
  onComplete: vi.fn(),
});

describe('CmcvRoutingChallenge', () => {
  it('routes the Medium sample and automatically unfolds its consensus boundary after one attempt', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<CmcvRoutingChallenge {...callbacks} />, { wrapper: GlossaryProvider });

    expect(screen.queryByText('共识不等于真值')).not.toBeInTheDocument();
    expect(screen.getByLabelText('教学示意：合成分流与反馈')).toBeVisible();
    await user.click(screen.getByRole('button', { name: '送入 Medium' }));

    expect(screen.getByText('两个外部模型一致')).toBeVisible();
    expect(screen.getByText('可靠外部答案')).toBeVisible();
    expect(within(screen.getByTestId('cmcv-lane-medium')).getByText('训练去向：送入待审训练池')).toBeVisible();
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'cmcv-router', state: 'medium' });
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'cmcv-trust', state: 'consensus:correct' });
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText('共识不等于真值')).toBeVisible();
    expect(screen.queryByRole('button', { name: '揭示共识边界' })).not.toBeInTheDocument();
  });

  it('offers native drag and drop with the same Medium route contract', () => {
    const callbacks = props();
    render(<CmcvRoutingChallenge {...callbacks} />, { wrapper: GlossaryProvider });
    const token = screen.getByTestId('cmcv-sample-token');
    const lane = screen.getByTestId('cmcv-lane-medium');

    expect(token).toHaveAttribute('draggable', 'true');
    fireEvent.dragStart(token, { dataTransfer: { setData: vi.fn(), effectAllowed: '' } });
    fireEvent.drop(lane, { dataTransfer: { getData: vi.fn() } });

    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'cmcv-router', state: 'medium' });
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
  });

  it('explains the precise pairwise mismatch and still unfolds the consensus lesson after an incorrect route', async () => {
    const user = userEvent.setup();
    render(<CmcvRoutingChallenge {...props()} />, { wrapper: GlossaryProvider });

    await user.click(screen.getByRole('button', { name: '送入 Easy' }));

    expect(screen.getByText(/目标输出与外部 A、外部 B 都不同/)).toBeVisible();
    expect(screen.getByText('共识不等于真值')).toBeVisible();
  });

  it('reconstructs the Medium route, token, outcome, and boundary from the consensus deep link', () => {
    render(<CmcvRoutingChallenge {...props()} restoredModuleState={{ moduleId: 'cmcv-trust', state: 'consensus:correct' }} />, { wrapper: GlossaryProvider });

    expect(screen.getByTestId('cmcv-lane-medium')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('cmcv-sample-token')).toHaveClass('cmcv-token--medium');
    expect(screen.getByText('可靠外部答案')).toBeVisible();
    expect(within(screen.getByTestId('cmcv-lane-medium')).getByText('训练去向：送入待审训练池')).toBeVisible();
    expect(screen.getByText('共识不等于真值')).toBeVisible();
  });

  it('opens the Medium routing definition beside the three learner choices', async () => {
    const user = userEvent.setup();
    render(<CmcvRoutingChallenge {...props()} />, { wrapper: GlossaryProvider });

    await user.click(screen.getByRole('button', { name: '解释术语：Medium 样本' }));

    expect(screen.getByRole('heading', { name: 'Medium 样本' })).toBeVisible();
    expect(screen.getByText(/两个外部模型彼此一致，但目标模型与它们明显不同/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: '关闭术语讲解' }));
  });
});
