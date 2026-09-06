import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GlossaryProvider } from '../components/Glossary';
import { getMediaAsset } from '../data/media';
import experienceDataCss from '../styles/experience-data.css?raw';
import experienceFoundationCss from '../styles/experience-foundation.css?raw';
import { DdasMicroscope } from './DdasMicroscope';

const props = () => ({ stepId: 'step-2', modules: [], onInteract: vi.fn(), onStateChange: vi.fn(), onComplete: vi.fn() });
function renderMicroscope(overrides = {}) {
  const callbacks = { ...props(), ...overrides };
  const result = render(<DdasMicroscope {...callbacks} />, { wrapper: GlossaryProvider });
  return { ...result, callbacks };
}
const root = () => screen.getByRole('region', { name: 'DDAS 采样显微镜' });
function declarations(css: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'gs'))];
  return matches[matches.length - 1]?.[1] ?? '';
}
function lastProperty(css: string, selector: string, property: string) {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let value = '';
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const match of css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'gs'))) {
    const declaration = new RegExp(`${escapedProperty}:\\s*([^;]+)`).exec(match[1]);
    if (declaration) value = declaration[1].trim();
  }
  return value;
}

describe('DdasMicroscope', () => {
  it('offers exactly six focusable candidate buttons without nested interactive controls', () => {
    const { container } = renderMicroscope();
    const candidates = screen.getAllByTestId('ddas-candidate');
    expect(candidates).toHaveLength(6);
    candidates.forEach((candidate) => expect(candidate.tagName).toBe('BUTTON'));
    expect(container.querySelector('button button, button a')).toBeNull();
  });

  it('snaps pointer motion to the nearest candidate and synchronizes visible magnifier content without callbacks', () => {
    const { callbacks } = renderMicroscope();
    const board = screen.getByTestId('ddas-candidate-board');
    Object.defineProperty(board, 'getBoundingClientRect', {
      value: () => ({ left: 100, top: 50, width: 400, height: 200, right: 500, bottom: 250, x: 100, y: 50, toJSON: () => ({}) }),
    });
    fireEvent.pointerMove(board, { clientX: 444, clientY: 194 });
    expect(root()).toHaveAttribute('data-active-candidate', 'complex-layout');
    expect(screen.getByRole('status')).toHaveTextContent('复杂版式');
    const magnifier = screen.getByTestId('ddas-magnifier');
    expect(magnifier).toHaveAttribute('data-candidate-id', 'complex-layout');
    expect(within(magnifier.querySelector('.ddas-magnifier__visual') as HTMLElement).getByRole('img')).toHaveAttribute('src', expect.stringContaining('real-case-layout-diversity.png'));
    expect(callbacks.onInteract).not.toHaveBeenCalled();
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
    expect(callbacks.onComplete).not.toHaveBeenCalled();
  });

  it('moves focus and magnifier directionally, then native Enter opens the focused page', async () => {
    const user = userEvent.setup();
    const { callbacks } = renderMicroscope();
    screen.getByRole('button', { name: /候选页：普通单栏 A/ }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: /候选页：普通单栏 B/ })).toHaveFocus();
    expect(screen.getByTestId('ddas-magnifier')).toHaveAttribute('data-candidate-id', 'repeat-b');
    await user.keyboard('{ArrowRight}{Enter}');
    expect(root()).toHaveAttribute('data-view', 'page');
    expect(root()).toHaveAttribute('data-selected-candidate', 'double-column');
    expect(callbacks.onComplete).not.toHaveBeenCalled();
  });

  it('changes structural sampling evidence across random, cluster, and DDAS modes', async () => {
    const user = userEvent.setup();
    const { callbacks } = renderMicroscope();
    await user.click(screen.getByRole('button', { name: '随机抽样' }));
    expect(root()).toHaveAttribute('data-page-state', 'random');
    expect(screen.getAllByTestId('random-repeat-marker').map((marker) => marker.textContent)).toEqual(['×3', '×2']);
    expect(screen.queryByTestId('cluster-region')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '仅按版式聚类' }));
    const regions = screen.getAllByTestId('cluster-region');
    expect(regions.map((region) => region.getAttribute('data-cluster'))).toEqual(['高频单栏', '多栏版式', '结构元素', '复杂版式']);
    const membershipBounds = {
      高频单栏: (x: number, y: number) => x <= 44.5 && y < 50,
      多栏版式: (x: number, y: number) => x > 44.5 && y < 50,
      结构元素: (x: number, y: number) => x <= 44.5 && y >= 50,
      复杂版式: (x: number, y: number) => x > 44.5 && y >= 50,
    };
    screen.getAllByTestId('ddas-candidate').forEach((candidate) => {
      const x = Number(candidate.style.left.replace('%', ''));
      const y = Number(candidate.style.top.replace('%', ''));
      const cluster = candidate.getAttribute('data-cluster') as keyof typeof membershipBounds;
      expect(membershipBounds[cluster](x, y), `${candidate.getAttribute('data-candidate-id')} must be inside ${cluster}`).toBe(true);
    });
    expect(screen.queryByTestId('random-repeat-marker')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '启用页级 DDAS' }));
    expect(screen.getAllByTestId('ddas-retained')).toHaveLength(3);
    expect(screen.getAllByTestId('ddas-downweighted')).toHaveLength(2);
    expect(callbacks.onStateChange).toHaveBeenNthCalledWith(1, { moduleId: 'page-ddas', state: 'random' });
    expect(callbacks.onStateChange).toHaveBeenNthCalledWith(2, { moduleId: 'page-ddas', state: 'cluster' });
    expect(callbacks.onStateChange).toHaveBeenNthCalledWith(3, { moduleId: 'page-ddas', state: 'ddas' });
    expect(callbacks.onComplete).not.toHaveBeenCalled();
  });

  it('opens a candidate page with three hotspots and returns focus to that candidate', async () => {
    const user = userEvent.setup();
    const { callbacks } = renderMicroscope();
    await user.click(screen.getByRole('button', { name: /候选页：公式与表格/ }));
    expect(root()).toHaveAttribute('data-view', 'page');
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
    expect(screen.getAllByTestId('element-hotspot')).toHaveLength(3);
    expect(screen.getByRole('group', { name: '选择页面元素' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: '返回版式簇' }));
    expect(root()).toHaveAttribute('data-view', 'candidates');
    expect(screen.getByRole('button', { name: /候选页：公式与表格/ })).toHaveFocus();
  });

  it('shows distinct text, formula, and table evidence while container Enter cannot leave element view', async () => {
    const user = userEvent.setup();
    const { callbacks } = renderMicroscope();
    await user.click(screen.getByRole('button', { name: /候选页：公式与表格/ }));
    const expected = [
      ['查看文本元素', 'omni-layout/tripleColumn', 'text'],
      ['放大公式区域', 'omni-table/formula', 'formula'],
      ['查看表格元素', 'omni-table/mergedCellTable', 'table'],
    ] as const;
    for (const [buttonName, evidenceKey, hotspot] of expected) {
      await user.click(screen.getByRole('button', { name: buttonName }));
      expect(screen.getByTestId('ddas-element-evidence')).toHaveAttribute('data-evidence-key', evidenceKey);
      expect(screen.getByRole('button', { name: `检查${hotspot === 'text' ? '文本' : hotspot === 'formula' ? '公式' : '表格'}区域` })).toHaveAttribute('data-active', 'true');
    }
    fireEvent.keyDown(screen.getByTestId('ddas-page-stage'), { key: 'Enter' });
    expect(root()).toHaveAttribute('data-view', 'element');
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
  });

  it('restores valid page and element states atomically while ignoring invalid restoration', () => {
    const callbacks = props();
    const { rerender } = render(<DdasMicroscope {...callbacks} restoredModuleState={{ moduleId: 'page-ddas', state: 'random' }} />, { wrapper: GlossaryProvider });
    expect(root()).toHaveAttribute('data-view', 'candidates');
    expect(root()).toHaveAttribute('data-page-state', 'random');
    expect(root()).toHaveAttribute('data-active-candidate', 'repeat-a');
    rerender(<DdasMicroscope {...callbacks} restoredModuleState={{ moduleId: 'element-ddas', state: 'formula' }} />);
    expect(root()).toHaveAttribute('data-view', 'element');
    expect(root()).toHaveAttribute('data-page-state', 'ddas');
    expect(root()).toHaveAttribute('data-selected-candidate', 'formula-table');
    expect(screen.getByTestId('ddas-element-evidence')).toHaveAttribute('data-evidence-key', 'omni-table/formula');
    expect(screen.getByText('正在放大：公式')).toBeVisible();
    rerender(<DdasMicroscope {...callbacks} restoredModuleState={{ moduleId: 'element-ddas', state: 'unknown' }} />);
    expect(root()).toHaveAttribute('data-view', 'element');
    expect(callbacks.onInteract).not.toHaveBeenCalled();
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
    expect(callbacks.onComplete).not.toHaveBeenCalled();
  });

  it('does not complete for focus, pointer, sampling, or page-open; first element choice completes once', async () => {
    const user = userEvent.setup();
    const { callbacks } = renderMicroscope();
    const board = screen.getByTestId('ddas-candidate-board');
    Object.defineProperty(board, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0, width: 100, height: 100 }) });
    fireEvent.pointerMove(board, { clientX: 54, clientY: 22 });
    screen.getByRole('button', { name: /候选页：双栏论文/ }).focus();
    await user.click(screen.getByRole('button', { name: '启用页级 DDAS' }));
    await user.click(screen.getByRole('button', { name: /候选页：双栏论文/ }));
    expect(callbacks.onComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '查看文本元素' }));
    await user.click(screen.getByRole('button', { name: '放大公式区域' }));
    expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
  });

  it('keys restoration by semantic state when an App-like parent recreates equivalent objects', async () => {
    const user = userEvent.setup();
    function AppLikeParent() {
      const [semanticState, setSemanticState] = useState<{ moduleId: string; state: string }>();
      const [, setParentRender] = useState(0);
      const restored = semanticState ? { moduleId: semanticState.moduleId, state: semanticState.state } : undefined;
      return <>
        <button type="button" onClick={() => setParentRender((count) => count + 1)}>触发父组件重渲染</button>
        <button type="button" onClick={() => setSemanticState({ moduleId: 'element-ddas', state: 'table' })}>外部切换表格深链</button>
        <DdasMicroscope
          {...props()}
          restoredModuleState={restored}
          onInteract={() => setParentRender((count) => count + 1)}
          onStateChange={(change) => setSemanticState({ moduleId: change.moduleId, state: change.state })}
        />
      </>;
    }
    render(<AppLikeParent />, { wrapper: GlossaryProvider });
    await user.click(screen.getByRole('button', { name: '随机抽样' }));
    await user.click(screen.getByRole('button', { name: /候选页：复杂版式/ }));
    expect(root()).toHaveAttribute('data-view', 'page');
    expect(root()).toHaveAttribute('data-selected-candidate', 'complex-layout');
    await user.click(screen.getByRole('button', { name: '放大公式区域' }));
    expect(root()).toHaveAttribute('data-view', 'element');
    expect(root()).toHaveAttribute('data-selected-candidate', 'complex-layout');
    await user.click(screen.getByRole('button', { name: '返回所选页面' }));
    await user.click(screen.getByRole('button', { name: '触发父组件重渲染' }));
    expect(root()).toHaveAttribute('data-view', 'page');
    expect(root()).toHaveAttribute('data-selected-candidate', 'complex-layout');
    await user.click(screen.getByRole('button', { name: '外部切换表格深链' }));
    expect(root()).toHaveAttribute('data-view', 'element');
    expect(root()).toHaveAttribute('data-selected-candidate', 'formula-table');
    expect(screen.getByTestId('ddas-element-evidence')).toHaveAttribute('data-evidence-key', 'omni-table/mergedCellTable');
  });

  it('moves page and element controls into the single conditional toolbar', async () => {
    const user = userEvent.setup();
    const { container } = renderMicroscope();
    const toolbar = container.querySelector('.ddas-toolbar');
    expect(toolbar).not.toBeNull();
    expect(toolbar?.querySelectorAll('.ddas-mode-switch button')).toHaveLength(3);
    expect(toolbar?.querySelector('.ddas-toolbar__facts')).not.toBeNull();

    await user.click(screen.getAllByTestId('ddas-candidate')[4]);
    expect(root()).toHaveAttribute('data-view', 'page');
    expect(toolbar?.querySelector('.ddas-mode-switch')).toBeNull();
    expect(toolbar?.querySelector('.ddas-toolbar__facts')).toBeNull();
    expect(toolbar?.querySelectorAll('.ddas-page-toolbar button')).toHaveLength(4);
    expect(container.querySelector('.ddas-element-panel .ddas-element-controls')).toBeNull();
    expect(container.querySelector('.ddas-element-panel .ddas-navigation')).toBeNull();

    await user.click(within(toolbar as HTMLElement).getAllByRole('button')[1]);
    expect(root()).toHaveAttribute('data-view', 'element');
    expect(toolbar?.querySelectorAll('.ddas-page-toolbar button')).toHaveLength(5);
  });

  it('keeps production borders and text stacks with an expanded natural-flow stage', () => {
    const { container } = renderMicroscope();
    const rail = screen.getByTestId('ddas-figure-rail');
    expect(rail.closest('.ddas-microscope__stage')).not.toBeNull();
    expect(within(rail).getByText('论文原图节选')).toBeVisible();
    expect(within(rail).getByRole('button', { name: /查看局部图片/ })).toBeVisible();
    expect(container.querySelector('.ddas-microscope__header')).toBeNull();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: '解释术语：ViT' })).toHaveLength(1);
    expect(screen.getByText(/512 维/)).toBeVisible();
    expect(experienceDataCss).toMatch(/\.ddas-candidate\s*\{[^}]*min-height:\s*44px/s);
    const stage = /\.ddas-microscope__stage\s*\{[^}]*block-size:\s*clamp\((\d+)px,\s*[^,]+,\s*(\d+)px\)/s.exec(experienceDataCss);
    expect(Number(stage?.[1])).toBeGreaterThanOrEqual(280);
    expect(Number(stage?.[2])).toBeLessThanOrEqual(340);
    expect(experienceDataCss.match(/\.ddas-microscope\s*\{[^}]*\}/s)?.[0]).not.toMatch(/overflow:\s*(?:hidden|clip)/);
  });

  it('reserves a non-overlapping prompt row above Figure 3 in page and element views', () => {
    const { container } = renderMicroscope();
    fireEvent.click(screen.getAllByTestId('ddas-candidate')[4]);
    const panelRows = lastProperty(experienceDataCss, '.ddas-element-panel', 'grid-template-rows');
    const firstRow = Number(/minmax\((\d+)px/.exec(panelRows)?.[1]);
    const promptCopyHeight = (18 * 1.7) + (16 * 1.7) + (16 * 1.15) + 4 + 8;
    expect(firstRow).toBeGreaterThanOrEqual(110);
    expect(firstRow).toBeGreaterThanOrEqual(promptCopyHeight);
    expect(container.querySelector('.ddas-element-panel .ddas-element-controls')).toBeNull();
    expect(container.querySelector('.ddas-element-panel .ddas-navigation')).toBeNull();
  });

  it('keeps the higher-specificity toolbar glossary targets at 44px', () => {
    renderMicroscope();
    const glossaryTarget = Number(/(\d+)px/.exec(lastProperty(experienceDataCss, '.ddas-toolbar__facts .glossary-term', 'min-height'))?.[1]);
    expect(glossaryTarget).toBeGreaterThanOrEqual(44);
    screen.getAllByRole('button', { name: /ViT|DDAS/ }).forEach((button) => expect(button).toBeVisible());
  });

  it('shows Figure 3 crops full-width with the trigger pill corner-anchored instead of covering the image', () => {
    renderMicroscope();
    // The rail is a single full-width column; the old fixed 200px image column
    // squeezed the page-level crop into a 45px strip hidden behind the 44px
    // trigger pill, so the rail rendered as a broken black bar.
    const railDecl = declarations(experienceDataCss, '.ddas-figure-rail');
    expect(railDecl).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(railDecl).not.toMatch(/height:\s*74px/);
    expect(declarations(experienceDataCss, '.ddas-figure-rail .paper-media, .ddas-figure-rail .paper-media__canvas')).toMatch(/width:\s*100%/);
    // The crop keeps its natural aspect; no vertical max-height squeeze.
    expect(lastProperty(experienceDataCss, '.ddas-figure-rail .paper-crop', 'max-height')).not.toMatch(/\dpx/);
    // Both crops stay well above a 44px row at a narrow 300px rail width.
    const asset = getMediaAsset('mineru-ddas');
    const cropHeightAt = (cropId: 'pageLevel' | 'elementLevel', railWidth: number) => {
      const crop = asset.crops?.[cropId];
      if (!crop || !asset.width || !asset.height) throw new Error(`Missing ${cropId}`);
      return railWidth / ((asset.width * crop.width / 100) / (asset.height * crop.height / 100));
    };
    expect(cropHeightAt('pageLevel', 300)).toBeGreaterThanOrEqual(60);
    expect(cropHeightAt('elementLevel', 300)).toBeGreaterThanOrEqual(100);
    // Caption sits on its own row so it can never be clipped by the image box.
    // (Match the base rule only — later overrides in the file just flip flex-direction.)
    const baseCaption = /(?:^|\})\s*\.ddas-figure-rail p\s*\{([^}]*)\}/s.exec(experienceDataCss)?.[1] ?? '';
    expect(baseCaption).toMatch(/display:\s*flex/);
    expect(Number(/min-height:\s*(\d+)px/.exec(declarations(experienceFoundationCss, '.viewer-trigger > span'))?.[1])).toBeGreaterThanOrEqual(44);
    // Chapter button paints like `.ddas-microscope button { background:#fff }`
    // out-specify the bare .viewer-trigger; the .paper-media re-assertion keeps
    // the full-crop overlay transparent (incl. hover) so the image stays visible.
    const triggerOverride = declarations(experienceFoundationCss, '.paper-media .viewer-trigger, .paper-media .viewer-trigger:hover');
    expect(triggerOverride).toMatch(/background:\s*transparent/);
    expect(triggerOverride).toMatch(/border:\s*0/);
    expect(declarations(experienceDataCss, '.ddas-microscope__stage')).toMatch(/overflow:\s*visible/);
    expect(declarations(experienceDataCss, '.ddas-element-evidence, .ddas-page-prompt')).not.toMatch(/overflow:\s*(?:hidden|clip)/);
  });

  it('lets formula and table evidence open the crop viewer instead of a dead 68px thumbnail', async () => {
    const user = userEvent.setup();
    renderMicroscope();
    await user.click(screen.getByRole('button', { name: /候选页：公式与表格/ }));
    await user.click(screen.getByRole('button', { name: '放大公式区域' }));
    const evidence = screen.getByTestId('ddas-element-evidence');
    expect(within(evidence).getByRole('button', { name: /查看局部图片/ })).toBeVisible();
    const evidenceDecl = declarations(experienceDataCss, '.ddas-element-evidence');
    const columnWidth = Number(/grid-template-columns:\s*minmax\((\d+)px/.exec(evidenceDecl)?.[1]);
    expect(columnWidth).toBeGreaterThanOrEqual(110);
    expect(lastProperty(experienceDataCss, '.ddas-element-evidence .paper-crop', 'max-height')).not.toMatch(/^(60|62|68)px/);
  });

  it('keeps all causal teaching copy at 16px or larger while metadata may remain compact', () => {
    const selectors = [
      '.ddas-magnifier > p',
      '.ddas-element-evidence p',
      '.ddas-page-prompt p',
      '.ddas-page-toolbar button',
      '.ddas-figure-rail p',
      '.ddas-boundary summary',
      '.ddas-boundary__body',
    ];
    selectors.forEach((selector) => {
      expect(Number(/(\d+)px/.exec(lastProperty(experienceDataCss, selector, 'font-size'))?.[1]), `${selector} must declare readable teaching text`).toBeGreaterThanOrEqual(16);
    });
  });

  it('contains the complete 105 by 136 ordinary-page magnifier on mobile instead of clipping it into 72px', () => {
    const mobile = /@media \(max-width:\s*760px\)\s*\{([\s\S]*)\}\s*$/.exec(experienceDataCss)?.[1] ?? '';
    expect(mobile).toMatch(/\.ddas-magnifier\s*\{[^}]*grid-template-columns:\s*minmax\(105px,/s);
    expect(mobile).toMatch(/\.ddas-magnifier__visual\s*\{[^}]*overflow:\s*visible/s);
    expect(mobile).toMatch(/\.ddas-magnifier__visual \.ddas-ordinary-page\s*\{[^}]*aspect-ratio:\s*105\s*\/\s*136/s);
    expect(mobile).not.toMatch(/grid-template-columns:\s*72px/);
    expect(declarations(experienceDataCss, '.ddas-magnifier__visual .ddas-ordinary-page')).toMatch(/height:\s*auto/);
    expect(declarations(experienceDataCss, '.ddas-magnifier__visual .ddas-ordinary-page')).toMatch(/aspect-ratio:\s*105\s*\/\s*136/);
  });
});
