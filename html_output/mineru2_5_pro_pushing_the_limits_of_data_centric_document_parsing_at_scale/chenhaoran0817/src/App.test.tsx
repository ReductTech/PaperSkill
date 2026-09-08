import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { chapterExperienceRegistry } from './experiences/registry';
import { widgetRegistry } from './modules/registry';
import tokensCss from './styles/tokens.css?raw';
import paperCss from './styles/paper.css?raw';
import moduleMotionACss from './styles/module-motion-a.css?raw';
import moduleMotionBCss from './styles/module-motion-b.css?raw';
import paperFiguresCss from './styles/paper-figures.css?raw';
import experienceFoundationCss from './styles/experience-foundation.css?raw';
import experienceDataCss from './styles/experience-data.css?raw';
import elfInspiredCss from './styles/elf-inspired.css?raw';
import chapterFlowCss from './styles/chapter-flow.css?raw';
import researchOverviewCss from './styles/research-overview.css?raw';
import chapterUnlockCss from './styles/chapter-unlock.css?raw';
import furtherLearningCss from './styles/further-learning.css?raw';
import experienceLabelingCss from './styles/experience-labeling.css?raw';
import experienceTrainingCss from './styles/experience-training.css?raw';

const PROGRESS_KEY = 'mineru2.5-pro.tutorial-progress.v2';
const ALL_CHAPTER_IDS = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6'];
const COMPONENT_CSS = [
  moduleMotionACss,
  moduleMotionBCss,
  paperFiguresCss,
  experienceFoundationCss,
  experienceDataCss,
  elfInspiredCss,
  chapterFlowCss,
  researchOverviewCss,
  chapterUnlockCss,
  furtherLearningCss,
  experienceLabelingCss,
  experienceTrainingCss,
];

function mediaMatchesWidth(query: string, width: number) {
  if (/prefers-reduced-motion/i.test(query)) return false;
  const maximums = [...query.matchAll(/max-width:\s*(\d+)px/gi)].map((match) => Number(match[1]));
  const minimums = [...query.matchAll(/min-width:\s*(\d+)px/gi)].map((match) => Number(match[1]));
  return maximums.every((maximum) => width <= maximum)
    && minimums.every((minimum) => width >= minimum);
}

function flattenCssForWidth(css: string, width: number) {
  const parser = document.createElement('style');
  parser.textContent = css;
  document.head.append(parser);

  const flattenRules = (rules: CSSRuleList): string[] => Array.from(rules).flatMap((rule) => {
    if (rule.type === CSSRule.STYLE_RULE) return [rule.cssText];
    if (rule.type === CSSRule.MEDIA_RULE) {
      const mediaRule = rule as CSSMediaRule;
      return mediaMatchesWidth(mediaRule.conditionText, width)
        ? flattenRules(mediaRule.cssRules)
        : [];
    }
    return [];
  });

  const result = parser.sheet ? flattenRules(parser.sheet.cssRules).join('\n') : '';
  parser.remove();
  return result;
}

function mobileCascadeFixture(cssSources: readonly string[]) {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const frameDocument = frame.contentDocument;
  const frameWindow = frame.contentWindow;
  if (!frameDocument || !frameWindow) throw new Error('Unable to create isolated CSS document');

  const style = frameDocument.createElement('style');
  style.textContent = cssSources.map((css) => flattenCssForWidth(css, 420)).join('\n');
  frameDocument.head.append(style);
  frameDocument.body.innerHTML = `
    <div id="root"><div class="app">
      <header class="site-header"><a class="brand" href="#top">Brand</a></header>
      <main>
        <section class="data-counterfactual"><p class="data-counterfactual__hint" data-copy="data">Data copy</p></section>
        <section class="ddas-microscope"><p class="ddas-microscope__state" data-copy="ddas">DDAS copy</p></section>
        <section class="cmcv-routing"><article class="cmcv-lane"><p data-copy="cmcv">CMCV copy</p></article></section>
        <section class="render-forensics"><p class="render-forensics__hotspot-help" data-copy="render">Render copy</p></section>
        <section class="training-timeline"><header class="training-timeline__header"><p data-copy="training">Training copy</p></header></section>
        <section class="mgam-puzzle"><div class="mgam-puzzle__reference"><p data-copy="mgam">MGAM copy</p></div></section>
        <section class="research-overview"><article class="research-overview__problem-card"><div></div><div><p data-copy="research">Research copy</p></div></article></section>
        <section class="further-learning"><article class="further-video-card"><p class="further-video-card__boundary" data-copy="further">Further copy</p></article></section>
        <button type="button">Button</button><summary>Summary</summary><input type="range" />
      </main>
      <footer class="site-footer"><a data-footer-paper href="https://example.com/paper">阅读原论文</a></footer>
    </div></div>`;

  return { frame, document: frameDocument, window: frameWindow };
}

function splitSelectorList(selectorText: string) {
  const selectors: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  for (let index = 0; index < selectorText.length; index += 1) {
    const char = selectorText[index];
    if (quote) {
      if (char === quote && selectorText[index - 1] !== '\\') quote = '';
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '(' || char === '[') depth += 1;
    if (char === ')' || char === ']') depth -= 1;
    if (char === ',' && depth === 0) {
      selectors.push(selectorText.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(selectorText.slice(start).trim());
  return selectors.filter(Boolean);
}

function selectorSpecificity(selector: string): number {
  let source = selector;
  let functionalSpecificity = 0;
  const functionalPattern = /:(is|not|has|where)\(/i;
  let functionalMatch = functionalPattern.exec(source);
  while (functionalMatch) {
    const open = (functionalMatch.index ?? 0) + functionalMatch[0].length - 1;
    let close = open + 1;
    let depth = 1;
    for (; close < source.length && depth > 0; close += 1) {
      if (source[close] === '(') depth += 1;
      if (source[close] === ')') depth -= 1;
    }
    const argumentsText = source.slice(open + 1, close - 1);
    if (functionalMatch[1].toLowerCase() !== 'where') {
      functionalSpecificity += Math.max(
        0,
        ...splitSelectorList(argumentsText).map(selectorSpecificity),
      );
    }
    source = `${source.slice(0, functionalMatch.index)} ${source.slice(close)}`;
    functionalMatch = functionalPattern.exec(source);
  }

  source = source.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');
  const ids = source.match(/#[\w-]+/g)?.length ?? 0;
  const classes = source.match(/\.[\w-]+/g)?.length ?? 0;
  const attributes = source.match(/\[[^\]]+\]/g)?.length ?? 0;
  const pseudoElements = source.match(/::[\w-]+/g)?.length ?? 0;
  const withoutPseudoElements = source.replace(/::[\w-]+/g, ' ');
  const pseudoClasses = withoutPseudoElements.match(/:(?!:)[\w-]+(?:\([^)]*\))?/g)?.length ?? 0;
  const typeSource = withoutPseudoElements
    .replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?/g, ' ');
  const types = [...typeSource.matchAll(/(?:^|[\s>+~])([a-z][\w-]*)/gi)].length;
  return functionalSpecificity + ids * 1_000_000 + (classes + attributes + pseudoClasses) * 1_000 + types + pseudoElements;
}

function cascadedProperty(element: Element, property: string, styleSheet: CSSStyleSheet) {
  let winner: { important: boolean; specificity: number; order: number; value: string } | undefined;
  let order = 0;
  for (const rule of Array.from(styleSheet.cssRules)) {
    if (rule.type !== CSSRule.STYLE_RULE) continue;
    const styleRule = rule as CSSStyleRule;
    const value = styleRule.style.getPropertyValue(property);
    if (!value) continue;
    const matchingSpecificities = splitSelectorList(styleRule.selectorText)
      .filter((selector) => element.matches(selector))
      .map(selectorSpecificity);
    if (!matchingSpecificities.length) continue;
    const candidate = {
      important: styleRule.style.getPropertyPriority(property) === 'important',
      specificity: Math.max(...matchingSpecificities),
      order: order += 1,
      value: value.trim(),
    };
    if (!winner
      || Number(candidate.important) > Number(winner.important)
      || (candidate.important === winner.important && candidate.specificity > winner.specificity)
      || (candidate.important === winner.important && candidate.specificity === winner.specificity && candidate.order > winner.order)) {
      winner = candidate;
    }
  }
  return winner?.value ?? '';
}

function revealedChapters(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('.progressive-chapter'))
    .filter((section) => !section.hidden)
    .map((section) => section.id);
}

/** Deep links reveal the whole prefix — the fast way to open every chapter. */
function renderFullyRevealed() {
  window.history.replaceState(null, '', '/#step-6');
  return render(<App />);
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => {
  window.localStorage.clear();
});

describe('App chapter integration', () => {
  it('starts with the intro flow and a start loader; all chapters begin hidden', () => {
    const { container } = render(<App />);

    expect(revealedChapters(container)).toEqual([]);
    expect(container.querySelectorAll('.progressive-chapter')).toHaveLength(6);
    expect(screen.getByText('导入结束 · 开始探索')).toBeVisible();
    expect(screen.getByRole('button', { name: /为什么数据会成为瓶颈/ })).toBeVisible();
    expect(container.querySelector('.page-tail')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看原始 PDF 区域' })).toBeVisible();
    expect(screen.getByLabelText('已完成 0 章，共 6 章')).toBeVisible();
  });

  it('reveals one chapter per loader click and gates the page tail on the last reveal', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    expect(revealedChapters(container)).toEqual([]);
    expect(screen.getByText('导入结束 · 开始探索')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /为什么数据会成为瓶颈/ }));
    expect(revealedChapters(container)).toEqual(['step-1']);
    expect(screen.getByText('本章结束 · 继续探索')).toBeInTheDocument();
    expect(screen.queryByText('导入结束 · 开始探索')).not.toBeInTheDocument();

    for (const question of ['如何挑对数据', '没有 GT，怎么判断样本难度', 'Hard 样本怎样得到可信标注', '分层数据怎样教给模型']) {
      await user.click(screen.getByRole('button', { name: new RegExp(question) }));
    }
    expect(revealedChapters(container)).toEqual(['step-1', 'step-2', 'step-3', 'step-4', 'step-5']);
    expect(container.querySelector('.page-tail')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /怎样公平证明方法有效/ }));
    expect(revealedChapters(container)).toEqual(ALL_CHAPTER_IDS);
    expect(screen.getAllByTestId('chapter-experience')).toHaveLength(6);
    expect(container.querySelectorAll('.chap-loader-btn')).toHaveLength(0);
    expect(container.querySelector('.page-tail')).toBeInTheDocument();
    expect(screen.getByLabelText('已完成 0 章，共 6 章')).toBeVisible();
  });

  it('reveals the whole prefix at once for a chapter deep link', () => {
    window.history.replaceState(null, '', '/#step-4');
    const { container } = render(<App />);

    expect(revealedChapters(container)).toEqual(['step-1', 'step-2', 'step-3', 'step-4']);
    expect(screen.getByLabelText('Render then Verify 取证')).toBeVisible();
    expect(document.getElementById('step-5')).toHaveAttribute('hidden');
    expect(document.getElementById('step-6')).toHaveAttribute('hidden');
  });

  it('counts the intro sections as chapter-1 content: the hero start action reveals chapter 1', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    expect(revealedChapters(container)).toEqual([]);
    // The intro band is labelled as chapter 1's 导入 content.
    expect(screen.getByLabelText('第 1 章导入：论文问题与复杂页面')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /开始探索/ }));
    expect(window.location.hash).toBe('#research-problem');
    expect(revealedChapters(container)).toEqual(['step-1']);
    expect(screen.queryByText('导入结束 · 开始探索')).not.toBeInTheDocument();
  });

  it('reveals chapter 1 for intro-section deep links (#research-problem / #document-primer)', () => {
    window.history.replaceState(null, '', '/#document-primer');
    const { container } = render(<App />);

    expect(revealedChapters(container)).toEqual(['step-1']);
    expect(screen.getByRole('button', { name: '查看原始 PDF 区域' })).toBeVisible();
  });

  it('jumps to any chapter from the journey map without locking', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const map = screen.getByRole('navigation', { name: '学习路线图' });
    expect(within(map).getAllByRole('button')).toHaveLength(6);
    expect(within(map).getByRole('button', { name: '揭示并进入第 1 章：发现瓶颈' })).toBeInTheDocument();

    await user.click(within(map).getByRole('button', { name: '直接跳到第 4 章：修复标注' }));
    expect(revealedChapters(container)).toEqual(['step-1', 'step-2', 'step-3', 'step-4']);
    expect(within(map).getByRole('button', { name: '揭示并进入第 5 章：组织训练' })).toBeInTheDocument();
  });

  it('shows the full PaperSkill chapter anatomy after reveal', () => {
    const { container } = renderFullyRevealed();

    expect(screen.getAllByTestId('chapter-experience')).toHaveLength(6);
    expect(container.querySelectorAll('.chapter-intro')).toHaveLength(6);
    expect(container.querySelectorAll('.chap-bridge')).toHaveLength(6);
    expect(container.querySelectorAll('.analogy-card')).toHaveLength(6);
    expect(
      Array.from(container.querySelectorAll('.analogy-visual')).map((node) => node.getAttribute('data-visual')),
    ).toEqual(['grocery-budget', 'melon-picking', 'answer-checking', 'dish-tasting', 'exam-prep', 'puzzle-grading']);
    expect(container.querySelectorAll('.takeaways-grid')).toHaveLength(6);
    expect(container.querySelectorAll('.takeaway-card')).toHaveLength(18);
    expect(container.querySelectorAll('.checkpoint-card')).toHaveLength(6);
    expect(screen.getAllByText(/一分钟自检/)).toHaveLength(6);
    // The grading teaser belongs to chapter 6 only.
    expect(container.querySelectorAll('.grading-teaser')).toHaveLength(1);
    expect(document.getElementById('step-6')?.querySelector('.grading-teaser')).not.toBeNull();
    // No legacy experiment shells.
    expect(container.querySelector('.step-concept-visual')).not.toBeInTheDocument();
    expect(container.querySelector('.learning-lab')).not.toBeInTheDocument();
    expect(container.querySelector('.real-cases')).not.toBeInTheDocument();
    expect(container.querySelector('.paper-figure-card')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /补长尾页/ })).toBeVisible();
  });

  it('keeps one complete Figure S3 and three explainable regions inside the document primer', () => {
    const { container } = render(<App />);

    expect(container.querySelectorAll('.primer-source-compare .paper-media[data-asset-id="omni-output"]')).toHaveLength(1);
    expect(screen.getByRole('button', { name: '查看原始 PDF 区域' })).toBeVisible();
    expect(screen.getByRole('button', { name: '查看输出 A 区域' })).toBeVisible();
    expect(screen.getByRole('button', { name: '查看输出 B 区域' })).toBeVisible();
  });

  it('shows six-chapter completion rather than legacy experiment progress', () => {
    render(<App />);

    expect(screen.getByLabelText('已完成 0 章，共 6 章')).toBeVisible();
    expect(screen.queryByLabelText(/已操作 .*个实验/)).not.toBeInTheDocument();
    expect(screen.queryByText(/极速模式|独立视频模式/)).not.toBeInTheDocument();
  });

  it('revealing chapters never marks completion; only the main action does', async () => {
    const user = userEvent.setup();
    renderFullyRevealed();

    expect(screen.getByLabelText('已完成 0 章，共 6 章')).toBeVisible();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? '[]')).not.toContain('chapter:step-1');
    });

    await user.click(screen.getByRole('button', { name: '补长尾页' }));
    expect(screen.getByLabelText('已完成 1 章，共 6 章')).toBeVisible();
    expect(window.location.hash).toBe('#step-1/data-bias/tail');
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? '[]');
      expect(stored).toContain('chapter:step-1');
      expect(stored).toContain('data-bias');
    });
  });

  it('preserves the six chapter mappings and eleven explicit PaperSkill widget IDs', () => {
    expect(Object.keys(chapterExperienceRegistry)).toEqual(ALL_CHAPTER_IDS);
    expect(Object.keys(widgetRegistry)).toEqual([
      'architecture-lock',
      'data-bias',
      'page-ddas',
      'element-ddas',
      'cmcv-router',
      'cmcv-trust',
      'render-verify',
      'stage-training',
      'grpo-lab',
      'mgam-lab',
      'results-boundary',
    ]);
  });

  it('restores a secondary component state by componentId straight from the hash', async () => {
    window.history.replaceState(null, '', '/#step-2/element-ddas/formula');

    render(<App />);

    expect(await screen.findByText('正在放大：公式')).toBeVisible();
    expect(screen.getAllByTestId('chapter-experience')).toHaveLength(6);
  });

  it('does not restore a module when the hash step and module belong to different chapters', () => {
    window.history.replaceState(null, '', '/#step-1/element-ddas/formula');

    render(<App />);

    expect(screen.getByTestId('figure-3-canvas')).toHaveAttribute('data-view', 'cluster');
    expect(screen.queryByText('正在放大：公式')).not.toBeInTheDocument();
  });

  it('renders and scrolls to any chapter targeted by a hash without gating', () => {
    window.history.replaceState(null, '', '/#step-3/cmcv-router/medium');

    render(<App />);

    expect(screen.getAllByTestId('chapter-experience')).toHaveLength(6);
    expect(screen.getByLabelText('CMCV 样本分流挑战')).toBeVisible();
  });

  it('does not let a mismatched hash mutate an earlier experience', () => {
    window.history.replaceState(null, '', '/#step-3/data-bias/tail');

    render(<App />);

    expect(screen.getByRole('button', { name: '补长尾页' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not let a mismatched hash mutate the document primer', () => {
    window.history.replaceState(null, '', '/#step-3/document-primer/formula');

    const { container } = render(<App />);

    expect(container.querySelector('[data-module-id="document-primer"]')).toHaveAttribute('data-region', 'text');
  });

  it('restores the document primer when both hash step and module identify it', () => {
    window.history.replaceState(null, '', '/#document-primer/document-primer/formula');

    const { container } = render(<App />);

    expect(container.querySelector('[data-module-id="document-primer"]')).toHaveAttribute('data-region', 'formula');
  });

  it('gates the research tail on full reveal and keeps it outside chapter six', () => {
    const initial = render(<App />);
    expect(initial.container.querySelector('.page-tail')).not.toBeInTheDocument();
    initial.unmount();

    const { container: revealed } = renderFullyRevealed();
    const stepSix = revealed.querySelector('#step-6');
    const pageTail = revealed.querySelector('.page-tail');
    expect(pageTail).toBeInTheDocument();
    expect(pageTail?.previousElementSibling).toHaveClass('tutorial-layout');
    expect(stepSix?.querySelector('.research-lens')).not.toBeInTheDocument();
    expect(stepSix?.querySelector('.further-learning')).not.toBeInTheDocument();
    expect(pageTail?.querySelector('.research-lens')).toBeInTheDocument();
    expect(pageTail?.querySelector('.further-learning')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '等预算数据反事实' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'DDAS 采样显微镜' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'CMCV 样本分流挑战' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Render then Verify 取证' })).toBeVisible();
    expect(screen.getByRole('region', { name: '训练与 GRPO 播放器' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'MGAM 匹配拼图' })).toBeVisible();
    expect(revealed.querySelector(['.video', 'learning', 'task'].join('-'))).not.toBeInTheDocument();
    expect(revealed.querySelector('.video-learning-progress')).not.toBeInTheDocument();
    expect(revealed.querySelector('button button, button a, a button, a a')).toBeNull();
  });

  it('clears meaningful completion tokens when the learning path is reset', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(['data-bias', 'chapter:step-1']));

    render(<App />);

    const reset = screen.getByRole('button', { name: '重置学习进度' });
    expect(reset).toBeEnabled();
    await user.click(reset);

    expect(screen.getByLabelText('已完成 0 章，共 6 章')).toBeVisible();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? '[]')).toEqual([]);
    });
  });

  it('ignores a malformed percent-encoded hash', () => {
    window.history.replaceState(null, '', '/#%');

    expect(() => render(<App />)).not.toThrow();
    expect(screen.getAllByTestId('chapter-experience')).toHaveLength(6);
  });

  it('shows the OmniDocBench allowed claim and forbidden inference beside the primer crops', () => {
    render(<App />);

    expect(screen.getByText('该论文页展示了文档内容边界和结构化输出规范会影响评测与训练数据。')).toBeVisible();
    expect(screen.getByText(/不能将 OmniDocBench 原图解读为 MinerU2\.5-Pro 的性能证据/)).toBeVisible();
    expect(screen.getByText(/不能将截图或原图用作 296 页 Hard 训练隔离的独立证明/)).toBeVisible();
  });

  it('exposes the complete Figure S3 as one always-visible comparison region', () => {
    render(<App />);

    const comparison = screen.getByRole('region', {
      name: '真实 PDF 与结构化输出对照',
    });
    expect(comparison).not.toHaveAttribute('tabindex');
    expect(comparison.querySelectorAll('.paper-media')).toHaveLength(1);
    expect(comparison.querySelector('.paper-media')).not.toHaveAttribute('data-crop-id');
  });

  it('enforces the 420px reading and target-size contract regardless of component CSS load order', () => {
    const orders = [
      ['paper-first', [tokensCss, paperCss, ...COMPONENT_CSS]],
      ['paper-last', [tokensCss, ...COMPONENT_CSS, paperCss]],
    ] as const;

    for (const [orderName, cssSources] of orders) {
      const fixture = mobileCascadeFixture(cssSources);
      const fixtureSheet = fixture.document.querySelector('style')?.sheet;
      if (!fixtureSheet) throw new Error('Unable to parse flattened runtime CSS');
      const bodyCopy = fixture.document.querySelectorAll<HTMLElement>('[data-copy]');
      expect(bodyCopy).toHaveLength(8);
      for (const element of bodyCopy) {
        expect(
          Number.parseFloat(cascadedProperty(element, 'font-size', fixtureSheet)),
          `${orderName}: ${element.dataset.copy} body copy`,
        ).toBeGreaterThanOrEqual(16);
      }

      const controls = fixture.document.querySelectorAll<HTMLElement>('a[href], button, summary, input');
      for (const element of controls) {
        expect(
          Number.parseFloat(cascadedProperty(element, 'min-height', fixtureSheet)),
          `${orderName}: ${element.tagName.toLowerCase()} target`,
        ).toBeGreaterThanOrEqual(44);
      }
      expect(cascadedProperty(fixture.document.querySelector('.brand') as Element, 'display', fixtureSheet)).toBe('inline-flex');
      expect(cascadedProperty(fixture.document.querySelector('[data-footer-paper]') as Element, 'display', fixtureSheet)).toBe('inline-flex');
      fixture.frame.remove();
    }
  });
});
