import { afterEach, describe, expect, it } from 'vitest';
import postcss, { type Rule } from 'postcss';
import chapterUnlockCss from './chapter-unlock.css?raw';
import experienceDataCss from './experience-data.css?raw';
import experienceFoundationCss from './experience-foundation.css?raw';
import paperCss from './paper.css?raw';
import elfInspiredCss from './elf-inspired.css?raw';

// App imports ProgressiveChapter before main.tsx imports the shared styles.
const RUNTIME_CSS = [chapterUnlockCss, paperCss, experienceFoundationCss, experienceDataCss, elfInspiredCss];

function mediaMatchesViewport(query: string, width: number, height: number) {
  const minimumWidths = [...query.matchAll(/min-width:\s*(\d+)px/gi)].map((match) => Number(match[1]));
  const maximumWidths = [...query.matchAll(/max-width:\s*(\d+)px/gi)].map((match) => Number(match[1]));
  const minimumHeights = [...query.matchAll(/min-height:\s*(\d+)px/gi)].map((match) => Number(match[1]));
  const maximumHeights = [...query.matchAll(/max-height:\s*(\d+)px/gi)].map((match) => Number(match[1]));
  return minimumWidths.every((value) => width >= value)
    && maximumWidths.every((value) => width <= value)
    && minimumHeights.every((value) => height >= value)
    && maximumHeights.every((value) => height <= value);
}

function flattenForViewport(css: string, width: number, height: number) {
  const source = document.createElement('style');
  source.textContent = css;
  document.head.append(source);

  const flattenRules = (rules: CSSRuleList): string[] => Array.from(rules).flatMap((rule) => {
    if (rule.type === CSSRule.STYLE_RULE) return [rule.cssText];
    if (rule.type === CSSRule.MEDIA_RULE) {
      const media = rule as CSSMediaRule;
      return mediaMatchesViewport(media.conditionText, width, height) ? flattenRules(media.cssRules) : [];
    }
    return [];
  });

  const flattened = source.sheet ? flattenRules(source.sheet.cssRules).join('\n') : '';
  source.remove();
  return flattened;
}

function fixtureAt(width: number, height: number) {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const frameDocument = frame.contentDocument;
  const frameWindow = frame.contentWindow;
  if (!frameDocument || !frameWindow) throw new Error('Unable to create CSS fixture');

  const style = frameDocument.createElement('style');
  style.textContent = [
    `html, body { inline-size: ${width}px; margin: 0; }`,
    ...RUNTIME_CSS.map((css) => flattenForViewport(css, width, height)),
  ].join('\n');
  frameDocument.head.append(style);
  frameDocument.body.innerHTML = `
    <div class="tutorial-layout">
      <section class="process-step progressive-chapter">
        <div class="chapter-unlock-reveal">
          <header class="step-heading"><div class="step-number">01</div><h2>Large chapter fixture</h2></header>
          <p class="chapter-problem">A real populated experience follows this chapter heading.</p>
          <section class="chapter-experience">
            <section class="data-counterfactual">
              <header class="data-counterfactual__header"><div><span>Teaching experiment</span><h3>Equal-budget data counterfactual</h3></div></header>
              <div class="data-counterfactual__budget"><span>Fixed 1.2B architecture</span><i></i><span>One budget</span></div>
              <div class="data-counterfactual__comparison">
                <article class="counterfactual-lane"><div><b>Ordinary pages</b><span>Long-tail layout gaps remain visible.</span></div><p>Large populated evidence block with controls and output.</p></article>
                <article class="counterfactual-lane"><div><b>Curated pages</b><span>Hard pages add layout and table coverage.</span></div><p>Large populated evidence block with controls and output.</p></article>
              </div>
              <div class="data-counterfactual__gaps"><span>tables</span><span>formulas</span><span>dense layouts</span></div>
              <div class="data-counterfactual__actions"><button type="button">Continue ordinary page</button><button type="button">Fill long-tail page</button></div>
              <div class="data-counterfactual__result"><output>+2.71</output><p>Repeated realistic experiment copy keeps this fixture materially larger than the former empty placeholder.</p></div>
            </section>
          </section>
          <details class="evidence-panel" open><summary>Evidence</summary><div class="evidence-list"><article class="evidence-item"><p>Scrollable evidence body.</p></article><article class="evidence-item"><p>Second evidence item.</p></article><article class="evidence-item"><p>Third evidence item.</p></article></div></details>
        </div>
        <footer class="chapter-unlock-footer"></footer>
      </section>
    </div>`;

  return {
    frame,
    document: frameDocument,
    window: frameWindow,
    step: frameDocument.querySelector<HTMLElement>('.process-step')!,
    reveal: frameDocument.querySelector<HTMLElement>('.chapter-unlock-reveal')!,
    tutorial: frameDocument.querySelector<HTMLElement>('.tutorial-layout')!,
    experience: frameDocument.querySelector<HTMLElement>('.chapter-experience')!,
    evidenceBody: frameDocument.querySelector<HTMLElement>('.evidence-list')!,
  };
}

function resolvedTutorialWidth(declaration: string, viewportWidth: number) {
  const cap = Number(declaration.match(/min\((\d+)px/i)?.[1]);
  const gutter = Number(declaration.match(/100%\s*-\s*(\d+)px/i)?.[1]);
  if (!Number.isFinite(cap) || !Number.isFinite(gutter)) throw new Error(`Unexpected tutorial width: ${declaration}`);
  return Math.min(cap, viewportWidth - gutter);
}

function finalRuntimeProperty(selector: string, property: string, width: number, height: number) {
  let value = '';
  for (const css of RUNTIME_CSS) {
    const stylesheet = postcss.parse(css);
    stylesheet.walkRules((rule: Rule) => {
      let parent = rule.parent as {
        type: string;
        name?: string;
        params?: string;
        parent?: unknown;
      } | undefined;
      while (parent) {
        if (parent.type === 'atrule' && parent.name === 'media'
          && !mediaMatchesViewport(parent.params ?? '', width, height)) return;
        parent = parent.parent as typeof parent;
      }
      if (!rule.selectors.some((item) => item.trim() === selector)) return;
      rule.walkDecls(property, (declaration) => {
        value = declaration.value.trim();
      });
    });
  }
  return value;
}

afterEach(() => {
  document.querySelectorAll('iframe').forEach((frame) => frame.remove());
});

describe('natural-flow chapter shell', () => {
  it('lets desktop chapters flow at natural height with no internal scroll regions', () => {
    const fixture = fixtureAt(1366, 768);

    expect(fixture.window.getComputedStyle(fixture.step).display).not.toBe('grid');
    expect(fixture.window.getComputedStyle(fixture.step).blockSize).not.toBe('calc(100svh - var(--header-height))');
    expect(fixture.window.getComputedStyle(fixture.step).overflowY).not.toMatch(/auto|scroll/);
    expect(fixture.window.getComputedStyle(fixture.reveal).overflowY).not.toMatch(/auto|scroll/);
    expect(fixture.window.getComputedStyle(fixture.evidenceBody).overflowY).not.toMatch(/auto|scroll/);
    // No scroll declaration survives anywhere in the chapter shell cascade.
    expect(finalRuntimeProperty('.chapter-unlock-reveal', 'overflow', 1366, 768)).toBe('');
    expect(finalRuntimeProperty('.chapter-unlock-reveal', 'overflow-y', 1366, 768)).toBe('');
    expect(finalRuntimeProperty('.evidence-list', 'overflow-y', 1366, 768)).toBe('');
    expect(fixture.experience.textContent).toContain('Equal-budget data counterfactual');
    expect(resolvedTutorialWidth(finalRuntimeProperty('.tutorial-layout', 'width', 1366, 768), 1366)).toBe(1120);
  });

  it.each([
    ['narrow', 1023, 800],
    ['short', 1280, 699],
    ['phone', 420, 800],
  ])('keeps the same natural flow on %s screens', (_label, width, height) => {
    const fixture = fixtureAt(width, height);

    expect(fixture.window.getComputedStyle(fixture.step).display).not.toBe('grid');
    expect(fixture.window.getComputedStyle(fixture.step).blockSize).not.toBe('calc(100svh - var(--header-height))');
    expect(fixture.window.getComputedStyle(fixture.reveal).overflowY).not.toMatch(/auto|scroll/);
    expect(finalRuntimeProperty('.chapter-unlock-reveal', 'overflow', width, height)).toBe('');
  });

  it('replaces mobile scroll rails with wrap-around grids that need no swiping', () => {
    const mobileCss = RUNTIME_CSS.map((css) => flattenForViewport(css, 420, 800)).join('\n');

    expect(mobileCss).not.toMatch(/scroll-snap-type/);
    expect(finalRuntimeProperty('.data-counterfactual__slots', 'overflow-x', 420, 800)).not.toBe('auto');
    expect(finalRuntimeProperty('.data-counterfactual__slots', 'grid-template-columns', 420, 800)).toContain('repeat(3');
    expect(finalRuntimeProperty('.primer-source-compare', 'overflow-x', 420, 800)).not.toBe('auto');
  });
});
