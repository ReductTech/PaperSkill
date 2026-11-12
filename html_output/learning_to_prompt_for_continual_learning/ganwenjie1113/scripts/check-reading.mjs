// Development regression check; uses the repository's independent browser-QA install.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkP4, checkP5 } from './check-prompt-scenes.mjs';

const source = fileURLToPath(new URL('..', import.meta.url));
const repo = path.resolve(source, '../../../..');
const require = createRequire(path.join(repo, 'tools/visual-qa/package.json'));
const { chromium } = require('playwright');
const output = path.resolve(process.argv[2] || path.join(repo, '.visual-qa/l2p-reading-review'));
const mobileOnly = process.argv.includes('--mobile');
const dist = path.join(source, 'dist');
const route = '/papers/l2p/qa-preview/';
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!pathname.startsWith(route)) throw Error('Unknown route');
    const file = path.resolve(dist, decodeURIComponent(pathname.slice(route.length)) || 'index.html');
    if (!file.startsWith(dist + path.sep)) throw Error('Outside build');
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(file)];
    res.setHeader('Content-Type', type || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}${route}`;
const browser = await chromium.launch({ headless: true, ...(process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE } : {}) });
const report = { baseUrl, browser: browser.version(), results: [] };
try {
  await mkdir(output, { recursive: true });
  for (const width of mobileOnly ? [390] : [1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : width === 1440 ? 900 : 1080 }, deviceScaleFactor: 1, ...(width === 390 ? { isMobile: true, hasTouch: true } : {}) });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (let index = 1; index <= (mobileOnly ? 3 : 9); index++) {
      await page.goto(`${baseUrl}?page=p${index}`);
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => {
        const root = document.querySelector('.lesson-copy');
        // A future paragraph using the old Kit class must also inherit the contract.
        const probe = document.createElement('p');
        probe.className = 'rk-prose'; probe.textContent = '正文样式回归探针'; root.append(probe);
        const rows = [...root.querySelectorAll(':scope > p:not(.lesson-lead):not(.rk-note), .explain-section > p')].map(p => {
          const style = getComputedStyle(p), parent = getComputedStyle(p.parentElement);
          return { text: p.textContent.slice(0, 40), width: p.getBoundingClientRect().width, expected: p.parentElement.clientWidth - parseFloat(parent.paddingLeft) - parseFloat(parent.paddingRight), font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) };
        });
        probe.remove();
        const rawSubscripts = [];
        if (Number(root.dataset.lessonPage.slice(1)) <= 3) {
          for (const p of root.querySelectorAll(':scope > p, .explain-section > p')) {
            const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('math') && /[₀-₉ᵢⱼₖₑᵣ]/u.test(walker.currentNode.textContent)) rawSubscripts.push(walker.currentNode.textContent);
          }
        }
        return { rows, rawSubscripts, width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, invalidSubscripts: [...root.querySelectorAll('msub')].filter(node => node.children.length !== 2).length };
      });
      for (const row of metrics.rows) {
        assert(Math.abs(row.width - row.expected) < 2, `P${index}: narrowed prose ${JSON.stringify(row)}`);
        assert.equal(row.font, 17, `P${index}: body font differs`);
        assert(Math.abs(row.line - 30.6) < .1, `P${index}: body leading differs`);
      }
      assert.equal(metrics.documentWidth, width, `P${index}: page overflow`);
      assert.deepEqual(metrics.rawSubscripts, [], `P${index}: unformatted inline variable`);
      assert.equal(metrics.invalidSubscripts, 0, `P${index}: invalid MathML subscript`);
      if (index === 3) {
        metrics.equationAxes = await page.locator('.block-equations math').evaluateAll(nodes => nodes.map(node => {
          const equalSign = [...node.children].find(child => child.tagName.toLowerCase() === 'mo' && child.textContent === '=').getBoundingClientRect();
          return equalSign.top + equalSign.height / 2;
        }));
        if (width > 760) assert(Math.abs(metrics.equationAxes[0] - metrics.equationAxes[1]) <= 1, 'Pre-LN equations have different mathematical baselines');
        const boxes = await page.locator('.attention-rule > div').evaluateAll(nodes => nodes.map(node => {
          const box = node.getBoundingClientRect();
          const formula = node.querySelector('math').getBoundingClientRect();
          return { left: box.left, right: box.right, formulaRight: formula.right };
        }));
        for (let i = 0; i < boxes.length; i++) {
          assert(boxes[i].formulaRight <= boxes[i].right, 'Attention formula exceeds its card');
          if (i && width > 760) assert(boxes[i].left > boxes[i - 1].right, 'Attention stages overlap');
        }
      }
      if (index === 1 && width === 1440) {
        const term = page.locator('[data-term-id="task-id"]').first();
        await term.hover();
        const hover = page.locator('.rk-term-popover');
        await hover.waitFor({ state: 'visible' });
        const hoverText = await hover.innerText();
        assert.match(hoverText, /Task identity/);
        assert.match(hoverText, /标识一个样本或测试输入属于哪项任务/);
        assert.match(hoverText, /任务 ID 与任务边界不同/);
        await hover.getByRole('button', { name: '查看完整解释' }).click();
        const hub = page.locator('.reference-dialog');
        await hub.waitFor({ state: 'visible' });
        assert.match(await hub.innerText(), /沿学习顺序选择主题/);
        assert.equal(await hub.locator('.reference-terms [data-reference-term]').count(), 10, 'P1 Hub must expose its ten linked concepts');
        assert.match(await hub.locator('[data-reference-detail]').innerText(), /任务身份|任务边界/);
        assert.equal(await hub.locator('.reference-explanation li').count(), 2, 'P1 task-ID detail must explain both identity states');
        await hub.locator('[data-reference-term="class-incremental"]').click();
        assert.match(await hub.locator('[data-reference-detail]').innerText(), /全部已见类别|全部类别/);
        assert.equal(await hub.locator('.related-terms button').count(), 4, 'P1 class-incremental concept should link its protocol contrasts');
        await page.screenshot({ path: path.join(output, 'P1-1440-reference-hub.png') });
        await page.keyboard.press('Escape');
        report.referenceResults ??= [];
        report.referenceResults.push({ page: 1, hover: 'PASS', hubTerms: 10, detailNavigation: 'PASS' });
      }
      if (index === 2 && width === 1440) {
        await page.locator('[data-term-id="vit"]').first().hover();
        const hover = page.locator('.rk-term-popover');
        await hover.waitFor({ state: 'visible' });
        assert.match(await hover.innerText(), /Vision Transformer/);
        assert.match(await hover.innerText(), /图像切成一组 Patch/);
        await hover.getByRole('button', { name: '查看完整解释' }).click();
        const hub = page.locator('.reference-dialog');
        await hub.waitFor({ state: 'visible' });
        assert.equal(await hub.locator('.reference-terms [data-reference-term]').count(), 13, 'P2 Hub must expose its thirteen linked concepts');
        for (const id of ['image-patch', 'flattening', 'linear-projection', 'position-embedding', 'cls-token', 'token-shape', 'encoder-block', 'classification-head']) {
          assert.equal(await hub.locator(`[data-reference-term="${id}"]`).count(), 1, `P2 Hub must link ${id}`);
        }
        await hub.locator('[data-reference-term="token-shape"]').click();
        const detail = await hub.locator('[data-reference-detail]').innerText();
        assert.match(detail, /197 行/);
        assert.match(detail, /768 列/);
        assert.match(detail, /图像分辨率、Patch 尺寸或骨干宽度/);
        assert.equal(await hub.locator('.reference-explanation li').count(), 3);
        await page.screenshot({ path: path.join(output, 'P2-1440-reference-hub.png') });
        await page.keyboard.press('Escape');
        report.referenceResults ??= [];
        report.referenceResults.push({ page: 2, hover: 'PASS', hubTerms: 13, detailNavigation: 'PASS' });
      }
      if (index === 3 && width === 1440) {
        const query = page.locator('[data-term-id="query"]').first();
        const key = page.locator('[data-term-id="key"]').first();
        const value = page.locator('[data-term-id="value"]').first();
        const roleColors = await Promise.all([query, key, value].map(term => term.evaluate(node => getComputedStyle(node).color)));
        assert.equal(new Set(roleColors).size, 3, `P3 Q/K/V semantic colors must remain distinct: ${roleColors.join(', ')}`);
        await key.hover();
        const hover = page.locator('.rk-term-popover');
        await hover.waitFor({ state: 'visible' });
        assert.match(await hover.innerText(), /Key · K/);
        assert.match(await hover.innerText(), /L2P Prompt Pool 的检索 Key/);
        await hover.getByRole('button', { name: '查看完整解释' }).click();
        const hub = page.locator('.reference-dialog');
        await hub.waitFor({ state: 'visible' });
        assert.equal(await hub.locator('.reference-terms [data-reference-term]').count(), 15, 'P3 Hub must expose its fifteen linked concepts');
        for (const id of ['pre-ln', 'layer-normalization', 'attention', 'query', 'key', 'value', 'softmax', 'attention-weight', 'weighted-sum', 'multi-head-attention', 'concatenation', 'output-projection', 'residual-connection', 'ffn', 'forward-pass']) {
          assert.equal(await hub.locator(`[data-reference-term="${id}"]`).count(), 1, `P3 Hub must link ${id}`);
        }
        await hub.locator('[data-reference-term="pre-ln"]').click();
        const preLnText = await hub.locator('[data-reference-detail]').innerText();
        assert.match(preLnText, /先归一化/);
        assert.match(preLnText, /加回原表示/);
        assert.match(preLnText, /Post-LN/);
        await hub.locator('[data-reference-term="forward-pass"]').click();
        const forwardText = await hub.locator('[data-reference-detail]').innerText();
        assert.match(forwardText, /固定当前网络参数/);
        assert.match(forwardText, /反向传播与优化步骤/);
        await page.screenshot({ path: path.join(output, 'P3-1440-reference-hub.png') });
        await page.keyboard.press('Escape');
        report.referenceResults ??= [];
        report.referenceResults.push({ page: 3, hover: 'PASS', hubTerms: 15, detailNavigation: 'PASS', roleColors });
      }
      if (index === 3 && width === 390) {
        await page.locator('[data-term-id="softmax"]').first().tap();
        const hover = page.locator('.rk-term-popover');
        await hover.waitFor({ state: 'visible' });
        const popover = await hover.boundingBox();
        assert(popover && popover.x >= 0 && popover.x + popover.width <= width, 'P3 mobile hover must remain within the viewport');
        await hover.getByRole('button', { name: '查看完整解释' }).tap();
        const hub = page.locator('.reference-dialog');
        await hub.waitFor({ state: 'visible' });
        const hubBox = await hub.boundingBox();
        assert.equal(hubBox?.width, width, 'P3 mobile reference panel should use the viewport width');
        assert.equal(await hub.locator('.reference-terms [data-reference-term]').count(), 15);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, 'P3 mobile ReferenceHub must not create horizontal page overflow');
        await page.screenshot({ path: path.join(output, 'P3-390-reference-hub.png') });
        await page.keyboard.press('Escape');
        report.referenceResults ??= [];
        report.referenceResults.push({ page: 3, viewport: width, hoverBounds: 'PASS', hubWidth: 'PASS', hubTerms: 15 });
      }
      await page.screenshot({ path: path.join(output, `P${index}-${width}-opening.png`) });
      await page.screenshot({ path: path.join(output, `P${index}-${width}-full.png`), fullPage: true });
      if (index === 3) {
        for (const [name, locator] of [['block-formulas', page.locator('.block-equations')], ['core-terms', page.locator('.lesson-copy > .lesson-prose').first()]]) {
          await locator.evaluate(node => window.scrollTo(0, node.getBoundingClientRect().top + scrollY - document.querySelector(".site-header").getBoundingClientRect().height - 20));
          await locator.screenshot({ path: path.join(output, `P3-${width}-${name}.png`) });
        }
      }
      if (index === 1) {
        await page.locator('.task-rail button').nth(1).click();
        assert.match(await page.locator('.scene-readout').innerText(), /猫/);
        await page.locator('.playback-controls input').press('End');
        await page.locator('.playback-controls button').last().click();
        assert.equal(await page.locator('.playback-controls input').inputValue(), '0');
      } else if (index === 2) {
        await page.locator('#patch-index').press('End');
        assert.match(await page.locator('.patch-control label').innerText(), /196.*14.*14/);
        assert.equal(await page.locator('[data-token-index="195"]').count(), 1);
        await page.locator('.patch-motion .motion-stops button').last().click();
      } else if (index === 3) {
        assert.match(await page.locator('.attention-calculation').innerText(), /0.856, 1.436/);
        await page.locator('.attention-controls input').check();
        assert.match(await page.locator('.attention-calculation').innerText(), /1.472, 2.279/);
        await page.locator('.target-picker button').nth(2).click();
        await page.locator('.head-animation .motion-stops button').last().click();
      }
      if (index === 4) await checkP4(page, output, width);
      if (index === 5) await checkP5(page, output, width);
      if (index <= 3) {
        const selector = index === 1 ? '.interference-fishbone' : index === 2 ? '.pixel-feature-compare' : '.qkv-branch';
        await page.locator(selector).evaluate(node => window.scrollTo(0, node.getBoundingClientRect().top + scrollY - document.querySelector(".site-header").getBoundingClientRect().height - 20));
        await page.locator(selector).screenshot({ path: path.join(output, `P${index}-${width}-reading-design.png`) });
        await page.screenshot({ path: path.join(output, `P${index}-${width}-interaction.png`), fullPage: true });
      }
      report.results.push({ page: index, ...metrics, status: 'PASS' });
    }
    if (!mobileOnly) {
      await page.goto(`${baseUrl}?page=p3`);
      for (const chapter of ["p4", "p5", "p6"]) {
        await page.getByRole('button', { name: /^下一页/ }).click();
        assert.equal(await page.locator('.lesson-copy').getAttribute('data-lesson-page'), chapter);
      }
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(`PASS: ${mobileOnly ? 'P1–P3 mobile reading and interactions' : 'P1–P9 desktop reading, P1–P3 interactions, P4/P5 geometry, data and playback'}. Report: ${path.join(output, 'reading-report.json')}`);
} finally {
  await writeFile(path.join(output, 'reading-report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
