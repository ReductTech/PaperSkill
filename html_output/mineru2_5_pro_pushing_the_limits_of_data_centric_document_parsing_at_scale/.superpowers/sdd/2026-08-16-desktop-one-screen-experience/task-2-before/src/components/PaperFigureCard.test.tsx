import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaperFigureCard } from './PaperFigureCard';

describe('PaperFigureCard', () => {
  it('preserves viewer context, boundary, source link, and an image-error fallback', () => {
    render(<PaperFigureCard
      src="images/figure.png"
      alt="Figure alternative text"
      figure="Figure 2"
      title="Figure title"
      intro="Viewer introduction"
      sourceHref="https://example.com/paper#figure-2"
      width={200}
      height={100}
      provenance="paper-redraw"
    />);

    fireEvent.click(screen.getByRole('button', { name: /Figure 2/ }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(within(dialog).getByText('Viewer introduction')).toBeVisible();
    expect(within(dialog).getAllByText(/基于论文重绘/).length).toBeGreaterThan(0);
    expect(within(dialog).getByRole('link', { name: /在论文中核对 Figure 2/ })).toHaveAttribute('href', 'https://example.com/paper#figure-2');

    fireEvent.error(within(dialog).getByRole('img'));
    expect(within(dialog).getByRole('status')).toHaveTextContent('图片暂时无法显示');
  });
});
