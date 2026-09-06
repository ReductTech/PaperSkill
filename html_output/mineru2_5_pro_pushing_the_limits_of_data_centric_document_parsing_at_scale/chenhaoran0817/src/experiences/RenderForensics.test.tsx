import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import labelingCss from '../styles/experience-labeling.css?raw';
import { RenderForensics } from './RenderForensics';

const props = () => ({
  stepId: 'step-4',
  modules: [],
  onInteract: vi.fn(),
  onStateChange: vi.fn(),
  onComplete: vi.fn(),
});

describe('RenderForensics', () => {
  it('renders two self-built spec table layers with no paper imagery', () => {
    const { container } = render(<RenderForensics {...props()} />);
    const bench = screen.getByTestId('render-forensics-bench');
    const children = Array.from(bench.children);

    expect(children).toHaveLength(2);
    expect(children[0]).toHaveClass('render-forensics__canvas');
    expect(children[1]).toHaveClass('render-forensics__sidecar');
    expect(container.querySelector('.paper-media')).toBeNull();

    const truth = screen.getByTestId('rf-truth-table');
    expect(truth).toHaveAttribute('data-variant', 'truth');
    expect(within(truth).getByText('A 组')).toHaveAttribute('rowspan', '2');
    expect(within(truth).getByText('汇总')).toHaveAttribute('colspan', '2');

    const rendered = screen.getByTestId('rf-render-table');
    expect(rendered).toHaveAttribute('data-variant', 'broken');
    expect(within(rendered).getByText('跨行断裂')).toBeVisible();
    expect(within(rendered).getByText('合并丢失')).toBeVisible();
    expect(rendered.querySelector('.rf-empty')).not.toBeNull();

    expect(screen.getByText('原表 · 教学重绘')).toBeVisible();
    expect(screen.getByText('渲染输出 · 教学示意')).toBeVisible();
    expect(screen.getByText(/拖动对比：合并单元格在渲染中如何断裂错位/)).toBeVisible();
    expect(within(children[1] as HTMLElement).getByRole('slider', { name: '结构与原表对比进度' })).toBeVisible();
    expect(within(children[1] as HTMLElement).getByTestId('render-source')).toBeVisible();
    expect(within(children[1] as HTMLElement).getByTestId('render-diff')).toBeVisible();
    expect(screen.getByText('来源与事实边界')).toBeVisible();
    expect(screen.queryByRole('link', { name: /裁图来源/ })).toBeNull();
  });

  it('declares bounded desktop and mobile canvas contracts', () => {
    expect(labelingCss).toMatch(/\.render-forensics__bench\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*780px\)\s+minmax\(280px,\s*320px\)/s);
    expect(labelingCss).toMatch(/\.render-forensics__canvas\s*\{[^}]*min-block-size:\s*380px/s);
    expect(labelingCss).not.toMatch(/render-forensics__canvas \.paper-media/);
    expect(labelingCss).toMatch(/\.render-forensics__layer--rendered[^}]*clip-path:\s*inset\(/s);
    expect(labelingCss).toMatch(/\.render-forensics__split[^}]*--compare-ratio/s);
    expect(labelingCss).toMatch(/\.render-forensics__code\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
    expect(labelingCss).toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*?\.render-forensics__bench\s*\{[^}]*grid-template-columns:\s*1fr/s);
    expect(labelingCss).toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*?\.render-forensics__canvas\s*\{[^}]*min-block-size:\s*300px/s);
  });

  it('emits stable compare buckets, clears repair on change, and completes repair once', async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<RenderForensics {...callbacks} />);
    const slider = screen.getByRole('slider', { name: '结构与原表对比进度' });

    fireEvent.change(slider, { target: { value: '49' } });
    expect(callbacks.onStateChange).toHaveBeenLastCalledWith({ moduleId: 'render-verify', state: 'compare-p0' });
    fireEvent.change(slider, { target: { value: '50' } });
    expect(callbacks.onStateChange).toHaveBeenLastCalledWith({ moduleId: 'render-verify', state: 'compare-p50' });
    fireEvent.change(slider, { target: { value: '100' } });
    expect(callbacks.onStateChange).toHaveBeenLastCalledWith({ moduleId: 'render-verify', state: 'compare-p100' });

    const repair = screen.getByRole('button', { name: '应用局部结构修复' });
    expect(repair.closest('.render-forensics__sidecar')).not.toBeNull();
    await user.click(repair);
    await user.click(repair);
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('rf-render-table')).toHaveAttribute('data-variant', 'repaired');
    expect(screen.getByTestId('render-source')).toHaveTextContent('<td colspan="2">汇总</td>');
    expect(screen.getByTestId('render-diff')).toHaveTextContent('教学演示已应用');

    fireEvent.change(slider, { target: { value: '50' } });
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-repaired', 'false');
    expect(screen.getByTestId('rf-render-table')).toHaveAttribute('data-variant', 'broken');
    expect(screen.getByTestId('render-source')).toHaveTextContent('<td>汇总</td><td></td>');
  });

  it('restores valid deep-link states without callbacks and keeps invalid restore inert', () => {
    const callbacks = props();
    const { rerender } = render(<RenderForensics {...callbacks} restoredModuleState={{ moduleId: 'render-verify', state: 'compare-p50' }} />);
    expect(screen.getByRole('slider', { name: '结构与原表对比进度' })).toHaveValue('50');
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-compare', 'compare-p50');

    rerender(<RenderForensics {...callbacks} restoredModuleState={{ moduleId: 'render-verify', state: 'repaired' }} />);
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-repaired', 'true');
    rerender(<RenderForensics {...callbacks} restoredModuleState={{ moduleId: 'render-verify', state: 'bogus' }} />);
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-repaired', 'true');
    expect(callbacks.onInteract).not.toHaveBeenCalled();
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
    expect(callbacks.onComplete).not.toHaveBeenCalled();
  });

  it('starts at the fully revealed comparison frame when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    const callbacks = props();
    render(<RenderForensics {...callbacks} />);

    expect(screen.getByRole('slider', { name: '结构与原表对比进度' })).toHaveValue('100');
    expect(screen.getByTestId('render-forensics-canvas')).toHaveAttribute('data-compare', 'compare-p100');
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('states the evidence boundary without inventing repair or training claims', () => {
    render(<RenderForensics {...props()} />);
    const boundary = screen.getByText(/全部为自制教学构造/);
    expect(boundary).toHaveTextContent('不对应任何论文页面或真实模型输出');
    expect(boundary).not.toHaveTextContent(/修复率|训练样本|Hard 子集/);
  });
});
