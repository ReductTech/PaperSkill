import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MgamMatchingPuzzle } from './MgamMatchingPuzzle';

const props = () => ({
  stepId: 'step-6',
  modules: [],
  onInteract: vi.fn(),
  onStateChange: vi.fn(),
  onComplete: vi.fn(),
});

describe('MgamMatchingPuzzle', () => {
  it('keeps held-out GT fixed while prediction-only merges recompute the matching', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<MgamMatchingPuzzle {...callbacks} />);

    expect(screen.getByText('HELD-OUT TEST')).toBeVisible();
    expect(screen.getByText('TEST-296')).toBeVisible();
    expect(screen.getByTestId('mgam-ground-truth')).toHaveAttribute('data-immutable', 'true');
    expect(screen.getByText(/真实 Markdown 对比不是原始 MGAM 示例/)).toBeVisible();

    await user.click(screen.getByRole('button', { name: '合并预测块 1 和 2' }));
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'mgam-lab', state: 'partition-2' });
    expect(screen.getByTestId('mgam-ground-truth')).toHaveTextContent('Invoice total');
    expect(screen.getByTestId('mgam-matching-lines')).toHaveAttribute('data-partition', '2');
    expect(callbacks.onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '合并预测块 2 和 3' }));
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'mgam-lab', state: 'partition-1' });
    expect(screen.getByText('合理匹配')).toBeVisible();
    expect(screen.getByText('94.08')).toBeVisible();
    expect(screen.getByText('92.01')).toBeVisible();
    expect(screen.getByText('+2.07')).toBeVisible();
    expect(screen.getByText(/分段报告.*2.72.*端点.*2.71/)).toBeVisible();
    expect(screen.queryByText('92.48')).not.toBeInTheDocument();
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
  });

  it('labels each waterfall step with the reported rounded segment gain', () => {
    const callbacks = props();
    render(<MgamMatchingPuzzle {...callbacks} restoredModuleState={{ moduleId: 'mgam-lab', state: 'partition-1' }} />);

    expect(screen.getByTestId('waterfall-stage-1')).toHaveTextContent('+1.31');
    expect(screen.getByTestId('waterfall-stage-2')).toHaveTextContent('+0.96');
    expect(screen.getByTestId('waterfall-stage-3')).toHaveTextContent('+0.45');
    expect(screen.getByText(/分段报告.*2.72.*端点.*2.71/)).toBeVisible();
  });

  it('keeps the appendix comparator discrepancy folded and reports its evidence state', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<MgamMatchingPuzzle {...callbacks} restoredModuleState={{ moduleId: 'mgam-lab', state: 'partition-1' }} />);

    const evidence = screen.getByText('证据口径与边界').closest('details');
    expect(evidence).not.toHaveAttribute('open');
    expect(screen.queryByText(/附录 Table 8.*92.48.*1.60/)).not.toBeInTheDocument();

    await user.click(screen.getByText('证据口径与边界'));
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'results-boundary', state: 'evidence-open' });
    expect(screen.getByText(/附录 Table 8.*92.48.*1.60/)).toBeVisible();
  });

  it('reconstructs the completed puzzle when a results-boundary deep link is restored', () => {
    const callbacks = props();
    render(<MgamMatchingPuzzle {...callbacks} restoredModuleState={{ moduleId: 'results-boundary', state: 'evidence-open' }} />);

    expect(screen.getByText('合理匹配')).toBeVisible();
    expect(screen.getByText(/附录 Table 8.*92.48.*1.60/)).toBeVisible();
  });

  it('synchronizes every later restored state without clearing local state for an undefined prop', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    const { rerender } = render(<MgamMatchingPuzzle {...callbacks} />);

    await user.click(screen.getByRole('button', { name: '合并预测块 1 和 2' }));
    rerender(<MgamMatchingPuzzle {...callbacks} restoredModuleState={undefined} />);
    expect(screen.getByTestId('mgam-matching-lines')).toHaveAttribute('data-partition', '2');

    rerender(<MgamMatchingPuzzle {...callbacks} restoredModuleState={{ moduleId: 'mgam-lab', state: 'partition-3' }} />);
    expect(screen.getByTestId('mgam-matching-lines')).toHaveAttribute('data-partition', '3');
    rerender(<MgamMatchingPuzzle {...callbacks} restoredModuleState={{ moduleId: 'mgam-lab', state: 'partition-2' }} />);
    expect(screen.getByTestId('mgam-matching-lines')).toHaveAttribute('data-partition', '2');
    rerender(<MgamMatchingPuzzle {...callbacks} restoredModuleState={{ moduleId: 'mgam-lab', state: 'partition-1' }} />);
    expect(screen.getByText('合理匹配')).toBeVisible();

    rerender(<MgamMatchingPuzzle {...callbacks} restoredModuleState={{ moduleId: 'results-boundary', state: 'evidence-open' }} />);
    expect(screen.getByText(/附录 Table 8.*92.48.*1.60/)).toBeVisible();
    rerender(<MgamMatchingPuzzle {...callbacks} restoredModuleState={{ moduleId: 'results-boundary', state: 'evidence-closed' }} />);
    expect(screen.queryByText(/附录 Table 8.*92.48.*1.60/)).not.toBeInTheDocument();
    rerender(<MgamMatchingPuzzle {...callbacks} restoredModuleState={{ moduleId: 'mgam-lab', state: 'partition-2' }} />);
    expect(screen.queryByText('合理匹配')).not.toBeInTheDocument();
    expect(screen.getByTestId('mgam-matching-lines')).toHaveAttribute('data-partition', '2');
  });

  it('preserves the three prediction token and matching-line DOM nodes through convergence', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    const { container } = render(<MgamMatchingPuzzle {...callbacks} />);
    const tokens = [...container.querySelectorAll('.mgam-puzzle__blocks strong')];
    const lines = [...container.querySelectorAll('.mgam-puzzle__lines i')];

    expect(tokens).toHaveLength(3);
    expect(lines).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: '合并预测块 1 和 2' }));
    expect([...container.querySelectorAll('.mgam-puzzle__blocks strong')]).toEqual(tokens);
    expect([...container.querySelectorAll('.mgam-puzzle__lines i')]).toEqual(lines);
    await user.click(screen.getByRole('button', { name: '合并预测块 2 和 3' }));
    expect([...container.querySelectorAll('.mgam-puzzle__blocks strong')]).toEqual(tokens);
    expect([...container.querySelectorAll('.mgam-puzzle__lines i')]).toEqual(lines);
  });
});
