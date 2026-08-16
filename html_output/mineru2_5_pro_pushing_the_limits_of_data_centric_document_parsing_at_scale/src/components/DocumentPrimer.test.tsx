import { fireEvent, render, screen, within } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GlossaryProvider } from './Glossary';
import { DocumentPrimer } from './DocumentPrimer';
import paperCss from '../styles/paper.css?raw';

function renderPrimer(element: React.ReactElement) {
  return render(<GlossaryProvider>{element}</GlossaryProvider>);
}

describe('DocumentPrimer', () => {
  it('shows one complete Figure S3 with three sibling region controls and one live explanation', () => {
    const { container } = renderPrimer(<DocumentPrimer />);
    const comparison = screen.getByRole('region', { name: '真实 PDF 与结构化输出对照' });
    const media = comparison.querySelectorAll('.paper-media[data-asset-id="omni-output"]');

    expect(media).toHaveLength(1);
    expect(media[0]).not.toHaveAttribute('data-crop-id');
    expect(media[0]).toHaveAttribute('data-variant', 'stage');
    expect(within(comparison).getByRole('img', { name: /原始 PDF 与两种结构化输出的对照页面/ })).toBeVisible();

    const original = within(comparison).getByRole('button', { name: '查看原始 PDF 区域' });
    const outputA = within(comparison).getByRole('button', { name: '查看输出 A 区域' });
    const outputB = within(comparison).getByRole('button', { name: '查看输出 B 区域' });
    expect(original.closest('.paper-media')).toBeNull();
    expect(outputA.closest('.paper-media')).toBeNull();
    expect(outputB.closest('.paper-media')).toBeNull();
    const canvas = media[0].closest('.primer-figure-canvas');
    const overlay = original.closest('.primer-figure-hotspots');
    expect(canvas).not.toBeNull();
    expect(media[0].parentElement).toBe(canvas);
    expect(overlay?.parentElement).toBe(canvas);
    expect(outputA.closest('.primer-figure-hotspots')).toBe(overlay);
    expect(outputB.closest('.primer-figure-hotspots')).toBe(overlay);

    const canvasRule = /\.primer-figure-canvas\s*\{([^}]*)\}/.exec(paperCss)?.[1] ?? '';
    const hotspotRule = /\.primer-figure-hotspots\s*\{([^}]*)\}/.exec(paperCss)?.[1] ?? '';
    expect(canvasRule).toMatch(/position:\s*relative/);
    expect(canvasRule).toMatch(/inline-size:\s*min\(100%,\s*697px\)/);
    expect(canvasRule).toMatch(/justify-self:\s*center/);
    expect(hotspotRule).toMatch(/inset:\s*0/);

    const live = within(comparison).getByRole('status');
    fireEvent.click(outputA);
    expect(live).toHaveTextContent(/输出 A.*结构化结果/);
    fireEvent.click(outputB);
    expect(live).toHaveTextContent(/输出 B.*结构化结果/);

    expect(within(comparison).getAllByRole('link', { name: /来源：OmniDocBench/ })).toHaveLength(1);
    expect(container.querySelectorAll('.primer-source-boundary')).toHaveLength(1);
    expect(screen.queryByText('真实 PDF 原页')).not.toBeInTheDocument();
    expect(screen.queryByText('结构化输出 A')).not.toBeInTheDocument();
    expect(screen.queryByText('结构化输出 B')).not.toBeInTheDocument();
  });

  it('keeps the parsing-region interaction and restores a guided region without persisting automatically', () => {
    const onInteract = vi.fn();
    const onStateChange = vi.fn();
    const { container, rerender } = renderPrimer(
      <DocumentPrimer guidedState="formula" onInteract={onInteract} onStateChange={onStateChange} />,
    );

    expect(container.querySelector('[data-module-id="document-primer"]')).toHaveAttribute('data-region', 'formula');
    const tableRegion = screen.getByText('Method').closest('button');
    if (!tableRegion) throw new Error('Table region button missing');
    fireEvent.click(tableRegion);
    expect(container.querySelector('[data-module-id="document-primer"]')).toHaveAttribute('data-region', 'table');
    expect(onInteract).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith('table');

    rerender(<GlossaryProvider><DocumentPrimer guidedState="layout" onInteract={onInteract} onStateChange={onStateChange} /></GlossaryProvider>);
    expect(container.querySelector('[data-module-id="document-primer"]')).toHaveAttribute('data-region', 'layout');
  });
});
