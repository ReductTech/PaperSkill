import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getMediaAsset } from '../data/media';
import experienceDataCss from '../styles/experience-data.css?raw';
import experienceFoundationCss from '../styles/experience-foundation.css?raw';
import { PaperMedia } from './PaperMedia';

function declarations(css: string, selector: string) {
  const pattern = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`);
  return pattern.exec(css)?.[1] ?? '';
}

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

  it('renders a compact accessible thumbnail without a viewer when viewer is disabled', () => {
    const { container } = render(
      <PaperMedia
        assetId="omni-table"
        cropId="formula"
        label="论文原图节选"
        caption="真实公式页"
        variant="thumbnail"
        viewer={false}
      />,
    );

    const media = container.querySelector('.paper-media');
    expect(media).toHaveAttribute('data-asset-id', 'omni-table');
    expect(media).toHaveAttribute('data-crop-id', 'formula');
    expect(media).toHaveAttribute('data-variant', 'thumbnail');
    expect(screen.getByRole('img', { name: /公式嵌入表格.*真实公式页/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: /查看.*图片/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('fits the landscape merged-cell crop inside a centered crop-aspect thumbnail canvas', () => {
    const asset = getMediaAsset('omni-table');
    const crop = asset.crops?.mergedCellTable;
    if (!crop || !asset.width || !asset.height) throw new Error('Missing crop geometry');
    const cropAspect = (asset.width * crop.width / 100) / (asset.height * crop.height / 100);
    const frame = { width: 174, height: 192 };
    const fittedWidth = Math.min(frame.width, frame.height * cropAspect);
    const fittedHeight = fittedWidth / cropAspect;

    expect(fittedWidth).toBeLessThanOrEqual(frame.width);
    expect(fittedHeight).toBeLessThanOrEqual(frame.height);
    expect(fittedWidth / fittedHeight).toBeCloseTo(cropAspect, 5);

    const canvasRule = declarations(experienceFoundationCss, '.paper-media--thumbnail .paper-media__canvas');
    const cropRule = declarations(experienceFoundationCss, '.paper-media--thumbnail .paper-crop');
    expect(canvasRule).toMatch(/container-type:\s*size/);
    expect(canvasRule).toMatch(/place-items:\s*center/);
    expect(cropRule).toMatch(/100cqi/);
    expect(cropRule).toMatch(/100cqb/);
    expect(cropRule).toMatch(/aspect-ratio:\s*var\(--paper-crop-aspect/);
    // 预算槽位已改用自制长尾页，不再承载 paper-media 覆写。
    expect(declarations(experienceDataCss, '.budget-slot .paper-media, .budget-slot .paper-media__canvas')).toBe('');
    expect(declarations(experienceDataCss, '.budget-slot .paper-crop')).toBe('');
  });

  it('uses a neutral thumbnail fallback that does not promise component-level source chrome', () => {
    render(<PaperMedia assetId="omni-table" cropId="formula" variant="thumbnail" viewer={false} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('status')).not.toHaveTextContent('来源链接仍然保留');
    expect(screen.getByRole('status')).toHaveTextContent('请继续阅读页面中的文字说明');
  });

  it('opens a crop first, switches to the whole image and back, then restores focus after Escape', () => {
    render(
      <PaperMedia
        assetId="omni-table"
        cropId="mergedCellTable"
        label="论文原图节选"
        caption="真实复杂表格页"
        viewer="crop"
      />,
    );

    const trigger = screen.getByRole('button', { name: /查看局部图片：真实复杂表格页/ });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('论文原图节选 · 局部')).toBeVisible();
    expect(within(dialog).getByRole('img', { name: /局部：合并单元格表格/ })).toBeVisible();
    fireEvent.click(within(dialog).getByRole('button', { name: '查看整图' }));
    expect(within(dialog).getByRole('img', { name: /^OmniDocBench 论文中的旋转、公式与合并单元格表格示例$/ })).toBeVisible();
    fireEvent.click(within(dialog).getByRole('button', { name: /返回局部：合并单元格表格/ }));
    expect(within(dialog).getByRole('img', { name: /局部：合并单元格表格/ })).toBeVisible();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
