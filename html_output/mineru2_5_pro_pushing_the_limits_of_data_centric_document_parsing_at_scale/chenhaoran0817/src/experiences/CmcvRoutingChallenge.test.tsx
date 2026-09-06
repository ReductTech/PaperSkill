import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GlossaryProvider } from '../components/Glossary';
import labelingCss from '../styles/experience-labeling.css?raw';
import { CmcvRoutingChallenge } from './CmcvRoutingChallenge';

const props = () => ({
  stepId: 'step-3',
  modules: [],
  onInteract: vi.fn(),
  onStateChange: vi.fn(),
  onComplete: vi.fn(),
});

describe('CmcvRoutingChallenge', () => {
  it('shows the missing-GT evidence relation before asking the learner to route it', () => {
    const { container } = render(<CmcvRoutingChallenge {...props()} />, { wrapper: GlossaryProvider });

    const inputCard = container.querySelector('.cmcv-evidence-strip__input');
    expect(inputCard?.querySelector('.cmcv-pdf-scan')).toHaveAttribute('role', 'img');
    expect(inputCard?.querySelector('.viewer-trigger, .paper-media')).toBeNull();
    expect(screen.getByText('真实 PDF 输入')).toBeVisible();
    expect(screen.getByLabelText('GT：不可用')).toHaveAttribute('data-empty', 'true');
    expect(screen.getByText('目标输出 C')).toBeVisible();
    expect(screen.getByText('外部模型 A')).toBeVisible();
    expect(screen.getByText('外部模型 B')).toBeVisible();
    expect(screen.getByLabelText('A = B')).toBeVisible();
    expect(screen.getByLabelText('C ≠ 外部共识')).toBeVisible();
    expect(screen.queryByTestId('cmcv-outcome')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="gt"] .source-tag')).toBeNull();
  });

  it('reveals one correct Medium outcome with a non-GT external-consensus pseudo-label', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    const { container } = render(<CmcvRoutingChallenge {...callbacks} />, { wrapper: GlossaryProvider });

    const choices = screen.getByRole('group', { name: '预测样本难度' });
    const buttons = within(choices).getAllByRole('button');
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => expect(button).toHaveAttribute('aria-pressed', 'false'));
    await user.click(within(choices).getByRole('button', { name: 'Medium' }));

    expect(screen.getAllByTestId('cmcv-outcome')).toHaveLength(1);
    const outcome = screen.getByTestId('cmcv-outcome');
    expect(outcome).toHaveTextContent('路由：Medium');
    expect(outcome).toHaveTextContent('标签来源：外部共识伪标签（非 GT）');
    expect(outcome).toHaveTextContent('训练去向：采用外部共识进入监督训练池');
    expect(container).not.toHaveTextContent('可靠外部答案');
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'cmcv-router', state: 'medium' });
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'cmcv-trust', state: 'consensus:correct' });
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
  });

  it('reveals the same correct relation after a wrong prediction and completes only once', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<CmcvRoutingChallenge {...callbacks} />, { wrapper: GlossaryProvider });

    await user.click(screen.getByRole('button', { name: 'Easy' }));
    expect(screen.getByTestId('cmcv-outcome')).toHaveTextContent('路由：Medium');
    expect(screen.getByText('共识不等于真值')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Hard' }));
    expect(screen.getAllByTestId('cmcv-outcome')).toHaveLength(1);
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
  });

  it('restores both contracts atomically without callbacks and ignores invalid state', () => {
    const callbacks = props();
    const { rerender } = render(
      <CmcvRoutingChallenge {...callbacks} restoredModuleState={{ moduleId: 'cmcv-router', state: 'hard' }} />,
      { wrapper: GlossaryProvider },
    );
    expect(screen.getByRole('button', { name: 'Hard' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('cmcv-outcome')).toHaveTextContent('路由：Medium');

    rerender(<CmcvRoutingChallenge {...callbacks} restoredModuleState={{ moduleId: 'cmcv-trust', state: 'consensus:correct' }} />);
    expect(screen.getByRole('button', { name: 'Medium' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('共识不等于真值')).toBeVisible();

    rerender(<CmcvRoutingChallenge {...callbacks} restoredModuleState={{ moduleId: 'cmcv-router', state: 'invalid' }} />);
    expect(screen.getByRole('button', { name: 'Medium' })).toHaveAttribute('aria-pressed', 'true');
    expect(callbacks.onInteract).not.toHaveBeenCalled();
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
    expect(callbacks.onComplete).not.toHaveBeenCalled();
  });

  it('keeps glossary triggers outside the mutually exclusive controls', async () => {
    const user = userEvent.setup();
    const { container } = render(<CmcvRoutingChallenge {...props()} />, { wrapper: GlossaryProvider });

    expect(container.querySelector('button button, button a, a button, a a')).toBeNull();
    await user.click(screen.getByRole('button', { name: '解释术语：Medium 样本' }));
    expect(screen.getByRole('heading', { name: 'Medium 样本' })).toBeVisible();
  });

  it('keeps the complete causal relation visible and within the desktop chapter budget', () => {
    const { container } = render(<CmcvRoutingChallenge {...props()} />, { wrapper: GlossaryProvider });

    expect(container.querySelector('.cmcv-routing__header')).toBeNull();
    expect(container.querySelector('.cmcv-routing__source')).toBeNull();
    expect(screen.getByText('目标输出 C')).toBeVisible();
    expect(screen.getByLabelText('C ≠ 外部共识')).toBeVisible();
    expect(screen.getByRole('group', { name: '预测样本难度' })).toBeVisible();
    expect(screen.getByText('来源与事实边界')).toBeVisible();
    expect(labelingCss).toMatch(/\.cmcv-evidence-strip[^}]*block-size:\s*116px/s);
    expect(labelingCss).toMatch(/\.cmcv-routing__outcome[^}]*min-block-size:\s*64px/s);
    expect(labelingCss).not.toMatch(/\.cmcv-output-card--target\s*\{[^}]*display:\s*none/s);
    expect(labelingCss).not.toMatch(/\.cmcv-relation-mark--neq\s*\{[^}]*display:\s*none/s);
  });
});
