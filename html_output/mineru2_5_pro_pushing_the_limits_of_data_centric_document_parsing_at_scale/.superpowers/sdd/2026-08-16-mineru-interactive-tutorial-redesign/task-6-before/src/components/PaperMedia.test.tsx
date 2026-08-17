import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaperMedia } from './PaperMedia';

describe('PaperMedia', () => {
  it('renders a local crop and preserves its label when the image fails', () => {
    render(<PaperMedia assetId="omni-layout" cropId="doubleColumn" label="论文原图节选" />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', expect.stringContaining('real-case-layout-diversity.png'));
    expect(screen.getByText('论文原图节选')).toBeVisible();

    fireEvent.error(image);

    expect(screen.getByRole('status')).toHaveTextContent('图片暂时无法显示');
    expect(screen.getByText('论文原图节选')).toBeVisible();
    expect(screen.getByRole('link', { name: /来源/ })).toBeVisible();
  });

  it('opens a portal dialog and restores focus to its full-view trigger after Escape', () => {
    render(<PaperMedia assetId="omni-layout" cropId="doubleColumn" label="论文原图节选" />);

    const trigger = screen.getByRole('button', { name: /查看完整图片/ });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog')).toBeVisible();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
