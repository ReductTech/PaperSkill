import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RenderForensics } from './RenderForensics';

const props = () => ({
  stepId: 'step-4',
  modules: [],
  onInteract: vi.fn(),
  onStateChange: vi.fn(),
  onComplete: vi.fn(),
});

describe('RenderForensics', () => {
  it('reveals the keyboard-accessible repair hotspot after comparison progress crosses the threshold', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<RenderForensics {...callbacks} />);

    const slider = screen.getByRole('slider', { name: '结构与原图对比进度' });
    fireEvent.change(slider, { target: { value: '72' } });
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-compare', 'compare-p50');
    expect(callbacks.onInteract).toHaveBeenCalledWith('render-verify');
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'render-verify', state: 'compare-p50' });

    const repair = screen.getByRole('button', { name: '修复合并单元格错位' });
    expect(repair).toBeVisible();
    await user.click(repair);

    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'render-verify', state: 'repaired' });
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-repaired', 'true');
    expect(screen.getByTestId('render-source')).toHaveTextContent('colspan="2"');
    expect(screen.getByTestId('render-diff')).toHaveTextContent('已同步');
  });

  it('reports every stable comparison bucket and restores each deep-link state', () => {
    const callbacks = props();
    const { rerender, unmount } = render(<RenderForensics {...callbacks} />);
    const slider = screen.getByRole('slider', { name: '结构与原图对比进度' });

    fireEvent.change(slider, { target: { value: '50' } });
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-compare', 'compare-p50');
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'render-verify', state: 'compare-p50' });
    fireEvent.change(slider, { target: { value: '0' } });
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-compare', 'compare-p0');
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'render-verify', state: 'compare-p0' });
    fireEvent.change(slider, { target: { value: '100' } });
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-compare', 'compare-p100');
    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'render-verify', state: 'compare-p100' });

    rerender(<RenderForensics {...props()} restoredModuleState={{ moduleId: 'render-verify', state: 'compare-p0' }} />);
    expect(screen.getByRole('slider', { name: '结构与原图对比进度' })).toHaveValue('0');
    rerender(<RenderForensics {...props()} restoredModuleState={{ moduleId: 'render-verify', state: 'compare-p50' }} />);
    expect(screen.getByRole('slider', { name: '结构与原图对比进度' })).toHaveValue('50');
    rerender(<RenderForensics {...props()} restoredModuleState={{ moduleId: 'render-verify', state: 'compare-p100' }} />);
    expect(screen.getByRole('slider', { name: '结构与原图对比进度' })).toHaveValue('100');
    rerender(<RenderForensics {...props()} restoredModuleState={{ moduleId: 'render-verify', state: 'repaired' }} />);
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-repaired', 'true');
    expect(screen.getByRole('slider', { name: '结构与原图对比进度' })).toHaveValue('100');
    unmount();
  });

  it('returns a repaired scene to the unrepaired evidence represented by the next emitted comparison state', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    const { rerender } = render(<RenderForensics {...callbacks} />);
    const slider = screen.getByRole('slider', { name: '结构与原图对比进度' });

    fireEvent.change(slider, { target: { value: '72' } });
    await user.click(screen.getByRole('button', { name: '修复合并单元格错位' }));
    fireEvent.change(slider, { target: { value: '50' } });

    expect(callbacks.onStateChange).toHaveBeenCalledWith({ moduleId: 'render-verify', state: 'compare-p50' });
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-compare', 'compare-p50');
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-repaired', 'false');
    expect(screen.getByTestId('render-source')).toHaveTextContent('<td>总计</td><td></td>');
    expect(screen.getByTestId('render-diff')).toHaveTextContent('演示错误');

    rerender(<RenderForensics {...props()} restoredModuleState={{ moduleId: 'render-verify', state: 'compare-p50' }} />);
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-compare', 'compare-p50');
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-repaired', 'false');
    expect(screen.getByTestId('render-source')).toHaveTextContent('<td>总计</td><td></td>');
    expect(screen.getByTestId('render-diff')).toHaveTextContent('演示错误');
  });
});
