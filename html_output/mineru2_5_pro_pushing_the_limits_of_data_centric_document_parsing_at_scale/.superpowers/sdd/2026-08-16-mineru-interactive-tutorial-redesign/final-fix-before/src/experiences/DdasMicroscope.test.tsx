import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DdasMicroscope } from './DdasMicroscope';

const props = () => ({
  stepId: 'step-2',
  modules: [],
  onInteract: vi.fn(),
  onStateChange: vi.fn(),
  onComplete: vi.fn(),
});

describe('DdasMicroscope', () => {
  it('reports random, cluster, and DDAS page choices, and restores each page-level deep-link state', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    const { rerender } = render(<DdasMicroscope {...callbacks} />);

    await user.click(screen.getByRole('button', { name: '查看随机候选' }));
    await user.click(screen.getByRole('button', { name: '观察版式簇' }));
    await user.click(screen.getByRole('button', { name: '观察长尾版式簇' }));

    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'page-ddas', state: 'random' });
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'page-ddas', state: 'cluster' });
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'page-ddas', state: 'ddas' });

    rerender(<DdasMicroscope {...props()} restoredModuleState={{ moduleId: 'page-ddas', state: 'random' }} />);
    expect(screen.getByTestId('figure-3-canvas')).toHaveAttribute('data-page-state', 'random');
    rerender(<DdasMicroscope {...props()} restoredModuleState={{ moduleId: 'page-ddas', state: 'cluster' }} />);
    expect(screen.getByTestId('figure-3-canvas')).toHaveAttribute('data-page-state', 'cluster');
    rerender(<DdasMicroscope {...props()} restoredModuleState={{ moduleId: 'page-ddas', state: 'ddas' }} />);
    expect(screen.getByTestId('figure-3-canvas')).toHaveAttribute('data-page-state', 'ddas');
  });

  it('keeps page and element Figure 3 views reversible through shared pointer, keyboard, and mobile-ready controls', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<DdasMicroscope {...callbacks} />);

    await user.click(screen.getByRole('button', { name: '观察长尾版式簇' }));
    await user.click(screen.getByRole('button', { name: '放大公式区域' }));
    expect(screen.getByTestId('figure-3-canvas')).toHaveAttribute('data-view', 'element');
    await user.click(screen.getByRole('button', { name: '返回页面级' }));
    expect(screen.getByTestId('figure-3-canvas')).toHaveAttribute('data-view', 'page');

    const textButton = screen.getByRole('button', { name: '查看文本元素' });
    textButton.focus();
    await user.keyboard('{Enter}');
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'element-ddas', state: 'text' });
    await user.click(screen.getByRole('button', { name: '返回页面级' }));
    await user.click(screen.getByRole('button', { name: '查看表格元素' }));
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'element-ddas', state: 'table' });
    await user.click(screen.getByRole('button', { name: '返回页面级' }));

    expect(screen.getByRole('group', { name: '显微镜操作' })).toHaveTextContent('查看文本元素');
    expect(screen.getByRole('group', { name: '显微镜操作' })).toHaveTextContent('查看表格元素');
  });

  it('keeps the disclosed ViT-base fact to one occurrence in the main microscope view', () => {
    render(<DdasMicroscope {...props()} />);
    expect(screen.getAllByText(/512 维 ViT-base/)).toHaveLength(1);
  });

  it('lets a learner enter page DDAS and then inspect a formula element on the same Figure 3 canvas', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<DdasMicroscope {...callbacks} />);

    await user.click(screen.getByRole('button', { name: '观察长尾版式簇' }));
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'page-ddas', state: 'ddas' });

    await user.click(screen.getByRole('button', { name: '放大公式区域' }));
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'element-ddas', state: 'formula' });
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId('figure-3-canvas')).toHaveLength(1);
  });

  it('moves its normalized lens by pointer and keyboard, and Enter opens the focused page', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<DdasMicroscope {...callbacks} />);
    const canvas = screen.getByTestId('figure-3-canvas');
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 200, height: 100 }),
    });

    fireEvent.pointerMove(canvas, { clientX: 150, clientY: 25 });
    expect(canvas).toHaveAttribute('data-lens-x', '75');
    expect(canvas).toHaveAttribute('data-lens-y', '25');
    canvas.focus();
    await user.keyboard('{ArrowLeft}{ArrowDown}{Enter}');

    expect(canvas).toHaveAttribute('data-lens-x', '70');
    expect(canvas).toHaveAttribute('data-lens-y', '30');
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'page-ddas', state: 'ddas' });
  });
});
