import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaperMedia } from './PaperMedia';

describe('PaperMedia', () => {
  it('renders a local crop and preserves its label when the image fails', () => {
    render(<PaperMedia assetId="omni-layout" cropId="doubleColumn" label="论文原图节选" caption="真实双栏页" />);

    const image = screen.getByRole('img', { name: /双栏论文.*真实双栏页/ });
    expect(image).toHaveAttribute('src', expect.stringContaining('real-case-layout-diversity.png'));
    expect(screen.getByText('论文原图节选')).toBeVisible();

    fireEvent.error(image);

    expect(screen.getByRole('status')).toHaveTextContent('图片暂时无法显示');
    expect(screen.getByText('论文原图节选')).toBeVisible();
    expect(screen.getByRole('link', { name: /来源/ })).toBeVisible();
  });

  it('opens a portal dialog and restores focus to its full-view trigger after Escape', () => {
    render(<PaperMedia assetId="omni-layout" cropId="doubleColumn" label="论文原图节选" caption="真实双栏页" />);

    const trigger = screen.getByRole('button', { name: /查看完整图片：真实双栏页.*双栏论文/ });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(within(dialog).getByText('该论文页提供了双栏、三栏和复杂版式的真实文档解析任务示例。')).toBeVisible();
    expect(within(dialog).getByText(/不能将 OmniDocBench 原图解读为 MinerU2\.5-Pro 的性能证据/)).toBeVisible();
    expect(within(dialog).getByText(/不是 MinerU2\.5-Pro 训练样本/)).toBeVisible();
    expect(within(dialog).getByText(/不能默认视为 OmniDocBench v1\.6 的296页Hard子集/)).toBeVisible();
    expect(within(dialog).getByRole('link', { name: /在论文中核对 Figure S7/ })).toHaveAttribute(
      'href',
      'https://arxiv.org/pdf/2412.07626#page=19',
    );
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
