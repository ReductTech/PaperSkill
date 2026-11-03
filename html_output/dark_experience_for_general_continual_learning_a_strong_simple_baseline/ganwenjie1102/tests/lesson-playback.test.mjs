import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { LESSON_DURATIONS } from '../src/modules/lesson-motion.ts';
import { RESERVOIR_CLIPS } from '../src/modules/reservoir-model.ts';

const require = createRequire(new URL('../../../../../reusable-kit/demo/package.json', import.meta.url));
const { chromium } = require('playwright');
const output = resolve(process.env.DER_REVIEW_DIR || '.visual-qa/lesson-playback');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage(), errors = [], results = [];
page.on('pageerror', error => errors.push(error.message));
page.on('requestfailed', request => errors.push(request.url()));
const base = process.env.DER_PREVIEW_URL || 'http://127.0.0.1:5199/der-review/';
try {
  for (const name of ['reservoir', 'der-step', 'augmentation', 'der-plus']) {
    await page.goto(base + '?focus=' + name);
    await page.evaluate(() => document.fonts.ready);
    const scene = page.locator('[data-scene=' + name + ']');
    await scene.locator('[data-replay]').click();
    const started = Date.now(), seen = new Set(), captured = new Set(), samples = [];
    const count = name === 'reservoir' ? RESERVOIR_CLIPS.length : LESSON_DURATIONS[name].length;
    while (Date.now() - started < 45000) {
      const value = await scene.evaluate(el => ({
        clip: +el.dataset.clip, progress: +el.dataset.progress, status: el.dataset.status,
        focus: el.querySelector('.lesson-cue [aria-current=step]')?.textContent,
      }));
      assert.ok(value.focus, 'Every real playback frame has one readable observation target');
      seen.add(value.clip);
      samples.push({ wallMs: Date.now() - started, ...value });
      if (value.progress > .5 && value.progress < .84 && !captured.has(value.clip)) {
        captured.add(value.clip);
        if (name !== 'reservoir' || value.clip >= 2) {
          await scene.locator('.teaching-canvas').screenshot({ path: resolve(output, name + '-' + value.clip + '.png') });
        }
      }
      if (value.status === 'finished') break;
      await page.waitForTimeout(120);
    }
    assert.equal(samples.at(-1).status, 'finished');
    assert.equal(seen.size, count, 'Real playback visits every semantic step');
    results.push({ name, elapsedMs: Date.now() - started, seen: [...seen], samples });
    console.log('LESSON_REAL_PLAYBACK_PASS ' + name + ' steps=' + seen.size + ' elapsedMs=' + results.at(-1).elapsedMs);
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, 'playback.json'), JSON.stringify({ browser: browser.version(), timing: 'real wall clock; no mocked time', errors, results }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
