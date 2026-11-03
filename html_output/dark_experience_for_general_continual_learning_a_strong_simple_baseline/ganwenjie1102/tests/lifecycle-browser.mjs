
/** Browser checks for the v2 lifecycle stage. The five keyframes group as 1 | 2 | 3–4 | 5–6 | 7–8. */
export async function lifecycleBrowserChecks({ page, base, check, shot }) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.goto(`${base}?review=1#review-lifecycle`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  const scene = page.locator("[data-scene=lifecycle]");
  const layout = await scene.evaluate(el=>{const stage=el.querySelector('.lifecycle-viewport').getBoundingClientRect(),bar=el.querySelector('.motion-transport').getBoundingClientRect();return {w:stage.width,h:stage.height,center:Math.abs(stage.x+stage.width/2-innerWidth/2),below:bar.top>=stage.bottom-1,side:!!el.querySelector('.lifecycle-sidebar')};});
  check(layout.w>=1000 && Math.abs(layout.w/layout.h-1.75)<.01 && layout.center<2, 'Normal D1 stage is centered and keeps the 1120/640 ratio');
  check(layout.below&&!layout.side,'Controls follow the stage without a sidebar');
  const tick = ms => page.clock.runFor(ms);
  const state = () => scene.evaluate(el => ({ clip: Number(el.dataset.clip), p: Number(el.dataset.progress), status: el.dataset.status }));
  const at = async (clip, p) => {
    for (let n = 0; n < 1600; n++) {
      const s = await state();
      if (s.clip === clip && s.p >= p) return;
      await tick(50);
    }
    throw Error(`Lifecycle did not reach ${clip}:${p}`);
  };
  const geometry = async () => {
    const result = await scene.locator("svg").evaluate(svg => {
      const root = svg.getBoundingClientRect();
      const alpha = el => { let a = 1; for (let n = el; n && n !== svg.parentElement; n = n.parentElement) a *= Number(getComputedStyle(n).opacity); return a; };
      const labels = [...svg.querySelectorAll("text")].filter(el => alpha(el) > 0.12).map(el => {
        const b = el.getBoundingClientRect();
        return { text: el.textContent.trim().slice(0, 18), x: b.x - root.x, y: b.y - root.y, w: b.width, h: b.height, copy: el.getAttribute("data-numeric-copy"), origin: el.getAttribute("data-square-result") };
      });
      const outside = labels.filter(b => b.x < -0.5 || b.y < -0.5 || b.x + b.w > root.width + 0.5 || b.y + b.h > root.height + 0.5);
      const pairs = [];
      for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
        const a = labels[i], b = labels[j];
        // A duplicate is born on its source digit before leaving; this overlap is intentional.
        if ((a.copy !== null && a.copy === b.origin) || (b.copy !== null && b.copy === a.origin)) continue;
        if (Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 2 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 2) pairs.push([a.text, b.text]);
      }
      const crossed = [];
      for (const path of svg.querySelectorAll(".lc-gradient,.lc-data-guide")) {
        if (alpha(path) <= 0.12) continue;
        const matrix = path.getScreenCTM(), len = path.getTotalLength();
        for (let n = 0; n <= 60; n++) {
          const p = path.getPointAtLength((len * n) / 60), q = new DOMPoint(p.x, p.y).matrixTransform(matrix);
          const label = labels.find(b => q.x - root.x > b.x - 1 && q.x - root.x < b.x + b.w + 1 && q.y - root.y > b.y - 1 && q.y - root.y < b.y + b.h + 1);
          if (label) { crossed.push(label.text); break; }
        }
      }
      const imageCrossings = [];
      for (const sample of svg.querySelectorAll("[data-sample-object]")) {
        if (alpha(sample) <= 0.12) continue;
        const b = sample.querySelector(":scope > rect").getBoundingClientRect();
        for (const a of labels) {
          if (Math.min(a.x + a.w, b.right - root.x) - Math.max(a.x, b.left - root.x) > 2 && Math.min(a.y + a.h, b.bottom - root.y) - Math.max(a.y, b.top - root.y) > 2) imageCrossings.push([sample.dataset.sampleObject, a.text]);
        }
      }
      return { outside, pairs, crossed, imageCrossings };
    });
    check(result.outside.length === 0, `Lifecycle labels remain inside canvas: ${JSON.stringify(result.outside)}`);
    check(result.pairs.length === 0, `Lifecycle labels do not overlap at ${JSON.stringify(await state())}: ${JSON.stringify(result.pairs)}`);
    check(result.crossed.length === 0, `Data/gradient corridors avoid labels at ${JSON.stringify(await state())}: ${JSON.stringify(result.crossed)}`);
    check(result.imageCrossings.length === 0, `Moving samples avoid labels at ${JSON.stringify(await state())}: ${JSON.stringify(result.imageCrossings)}`);
  };
  check((await state()).status === "paused" && (await state()).p === 0, "Lifecycle initially pauses at the first frame for reading");
  await scene.locator("[data-replay]").click();
  const inspectNetwork = async () => {
    const graph = await scene.locator("[data-current-model]").evaluate(el => ({
      edges: [...el.querySelectorAll("[data-network-edge]")].map(n => n.dataset.networkEdge),
      spans: [...el.querySelectorAll("[data-network-column]")].map(col => {
        const ys = [...col.querySelectorAll("circle")].map(n => Number(n.getAttribute("cy")));
        return Math.max(...ys) - Math.min(...ys);
      }),
    }));
    const expected = [3, 5].flatMap((n, layer) => Array.from({length:n}, (_, i) =>
      Array.from({length:layer === 0 ? 5 : 3}, (_, j) => `${layer}:${i}:${j}`)).flat());
    check(graph.edges.length === 30 && expected.every(e => graph.edges.includes(e)), "3→5→3 layers are fully connected, including the model thumbnail");
    check(Math.abs(graph.spans[0] - graph.spans[2]) < .01, "First and third neural columns have the same vertical span");
    check(Math.abs(graph.spans[0] / graph.spans[1] - 112 / 180) < .0001, "Outer columns retain the requested two-thirds spacing while the middle column stays unchanged");
  };
  await inspectNetwork();
  const copySamples = [], sumSamples = [];
  let currentRecord = null;
  let record = null;
  for (let clip = 0; clip < 9; clip++) for (const p of (clip === 6 ? [.1,.25,.4,.5,.6,.7,.75,.8,.85,.9,.95,1] : [.1,.25,.4,.5,.6,.7,.75,.9,1])) {
    await at(clip, p);
    await geometry();
    check(await scene.locator("[data-current-model]").count() === 1, "Exactly one trainable model");
    if (clip < 2) check(await scene.locator("[data-history-z]").count() === 0, "No frozen block before copying");
    if (clip === 2) {
      copySamples.push(await scene.locator("[data-copy-point='0']").getAttribute("x"));
      check(await scene.locator("[data-response-plot]").isVisible(), "Original output stays visible throughout copying");
      check(await scene.locator("[data-history-z]").getAttribute("data-history-z") === "2,1,0", "Frozen z is exact while copying");
    }
    if (clip === 3) check(await scene.getAttribute("data-memory-count") === "0", "Parameter update precedes memory write");
    if (clip >= 4 && p >= 0.9) {
      record ??= await scene.locator('[data-record-id="record:x1:i"]').elementHandle();
      check(await record.evaluate(el => el === document.querySelector('[data-scene=lifecycle] [data-record-id="record:x1:i"]')), "Record DOM identity is continuous");
      check(await scene.getAttribute("data-memory-count") === (clip === 8 && p >= .94 ? "2" : "1"), "Memory count changes only after each post-update write");
    }
    if (clip >= 5) check(await scene.getAttribute("data-replay-source") === "record:x1:i", "Replay reads the existing record");
    if (clip >= 5 && p >= .7) check(await scene.locator('[data-current-candidate]').getAttribute('data-history-z') === 'u1,u2,u3', "Current x2 snapshot is separate from the old-image replay logits");
    if (clip === 8 && p === 1) {
      check(await scene.locator('[data-in-memory=true]').count() === 2, "Both records occupy memory after the second post-update write");
      check(await scene.locator('[data-current-candidate]').getAttribute('data-candidate-source') === 'current:x2:before-update', "z2 retains the current input pre-update source");
      await shot('lifecycle-8-stored', '[data-scene=lifecycle] svg');
    }
    if (clip >= 5 && p >= .7) {
      currentRecord ??= await scene.locator('[data-current-candidate]').elementHandle();
      check(await currentRecord.evaluate(el => el === document.querySelector('[data-current-candidate]')), "Current candidate retains the same DOM identity through its final record morph");
    }
    if (clip === 6 && p >= .7) {
      sumSamples.push(await scene.locator('[data-numeric-copy="2"]').evaluate(el => [Number(el.getAttribute('x')), Number(el.getAttribute('y'))]));
      check((await scene.locator('[data-square-result]').allTextContents()).join(',') === '1,1,0', "Original squared contributions remain while extra digits travel to the formula");
    }
    if (clip === 6 && p === 1) check(await scene.locator("[data-comparison]").isVisible(), "Comparison composition opens in the same stage");
    if (clip === 5 && p === 1) {
      const inputs = await scene.locator('[data-sample-object="view:x2:j"], [data-sample-object="replay:x1:j"]').evaluateAll(els => els.map(el => {
        const b = el.querySelector(":scope > rect").getBoundingClientRect(); return {x:b.x, w:b.width, h:b.height};
      }));
      check(inputs.length === 2 && Math.abs(inputs[0].x-inputs[1].x) < .1 && Math.abs(inputs[0].w-inputs[1].w) < .1 && Math.abs(inputs[0].h-inputs[1].h) < .1, "Current and replay inputs are equal in size and aligned on the same column");
      const docks = await scene.locator('[data-input-socket] > rect').evaluateAll(els => els.map(el => Number(el.getAttribute('x')) + Number(el.getAttribute('width'))));
      check(docks.every(right => right < 430), "Both input docks are fully outside the network surface");
    }
    if (clip === 6 && p >= .7) await shot(`lifecycle-sum-${p}`, "[data-scene=lifecycle] svg");
    if ((clip === 0 && [.25,.4,.5,.6,.7,.75].includes(p)) || (clip === 5 && [.25,.5,.7,.75,1].includes(p))) await shot(`lifecycle-process-${clip}-${p}`, '[data-scene=lifecycle] svg');
    if ((clip === 1 && p === 1) || (clip === 3 && p === 1) || (clip === 5 && p === 1) || (clip === 2 && p === 0.5) || (clip === 4 && p === 0.75) || (clip === 5 && p === 0.5) || (clip === 6 && p === 0.75) || (clip === 7 && p === 1)) await shot(`lifecycle-${clip}-${p}`, "[data-scene=lifecycle] svg");
  }
  check(new Set(sumSamples.map(p => JSON.stringify(p))).size >= 3, "An additional contribution digit visibly travels through intermediate positions into the sum");
  check((await scene.locator('[data-loss-term]').allTextContents()).join(',') === '1,1,0', "The three travelling copies become the final formula terms");
  check(await scene.locator('.lc-contribution-link').count() === 0, "Contribution transfer uses copied numerals rather than standing arrows");
  await inspectNetwork();
  check(new Set(copySamples).size >= 6, "Copy squares move continuously through the inspected coordinates");
  await tick(2300);
  check((await state()).status === "finished", "A complete run finishes with its final result");
  check(await scene.getAttribute("data-update-count") === "2", "Exactly one update per shown training step");
  check(await scene.getAttribute("data-loss-sources") === "current-ce,historical-squared", "Two sources enter one later update");
  check(await scene.locator("[data-loss]").getAttribute("data-loss") === "2", "Live comparison has the computed squared loss");
  check(await scene.locator("[data-square-contribution]").count() === 2, "Zero-difference contributes a degenerate square instead of a value");
  await scene.locator("[data-replay]").click();
  await at(2, 0.5);
  await scene.locator("[data-play]").focus();
  await page.keyboard.press("Enter");
  const paused = await scene.locator("svg").innerHTML();
  await tick(800);
  check(await scene.locator("svg").innerHTML() === paused, "Pause freezes actual objects and labels");
  await scene.locator("[data-play]").click();
  const before = (await state()).p;
  await tick(120);
  check((await state()).p > before, "Continue resumes the same copy position");
  await scene.locator("select").selectOption("6");
  check((await state()).p === 0 && (await state()).status === "paused", "Stage selection pauses at the selected clip beginning");
  await scene.locator("[data-back]").click();
  check((await state()).clip === 5 && await scene.getAttribute("data-memory-count") === "1", "Back restores the stored record");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await tick(50);
  for (let clip = 0; clip < 9; clip++) {
    await scene.locator("select").selectOption(String(clip));
    check((await state()).p === 1 && (await state()).status === "paused", "Reduced motion has a complete, stable semantic result");
    await geometry();
  }
  check(await scene.locator('[data-record-id="record:x1:i"]').getAttribute("data-history-z") === "2,1,0", "Reduced motion retains the historical record");
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Lifecycle has no page horizontal overflow");
  const fontSizes = await scene.locator(".lifecycle-reading p").evaluateAll(nodes => nodes.map(el => parseFloat(getComputedStyle(el).fontSize)));
  check(fontSizes.length === 1 && fontSizes.every(size => size >= 14), "The single observation sentence retains readable type");
  await page.emulateMedia({ reducedMotion: "no-preference" }); await tick(50);
  await scene.locator('[role=combobox]').click();
  check(await scene.locator('[role=listbox]').isVisible(), "Custom stage menu opens");
  check(await scene.locator('[role=option]').count() === 9, "All nine stages are selectable");
  await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  check((await state()).clip === 1, "Arrow keys and Enter select a stage");
  await scene.locator('[role=combobox]').click(); await page.keyboard.press('Escape');
  check(await scene.locator('[role=listbox]').count() === 0, "Escape dismisses the stage menu");
  await scene.locator('[role=combobox]').click();
  await shot('lifecycle-stage-menu', '[data-scene=lifecycle] [role=listbox]');
  await page.keyboard.press('Home'); await page.keyboard.press('Enter');
  check((await state()).clip === 0 && (await state()).p === 0 && (await state()).status === 'paused', "Choosing stage one pauses at zero seconds instead of its completed frame");
  const readout = await scene.locator('[data-time-readout]').innerText();
  check(readout.startsWith('0.0 /'), "Stage one readout starts at 0.0 seconds");
  await scene.locator('[data-play]').click();
  await page.clock.resume();
}

/** Layout-only focus player checks; the accepted animation stays on the same clock. */
export async function lifecycleFocusBrowserChecks({ page, base, check, shot }) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${base}?review=1&focus=lifecycle#lifecycle-player`, { waitUntil: "networkidle" });
  const navScene = page.locator('[data-scene=lifecycle]');
  const navState = () => navScene.evaluate(el => ({ clip:Number(el.dataset.clip), p:Number(el.dataset.progress), status:el.dataset.status }));
  check((await navState()).status==='paused' && await navScene.locator('[data-back]').isDisabled(), 'Direct focus entry initially pauses at stage 01');
  await navScene.locator('[data-play]').click(); await page.waitForTimeout(100);
  check(await navScene.locator('[data-back]').isEnabled(), 'Previous is available while stage 01 is running');
  await navScene.locator('[data-back]').click();
  let nav = await navState();
  check(nav.clip===0 && nav.p===0 && nav.status==='paused', 'Previous first restarts and pauses the current stage at 0.0s');
  check(await navScene.locator('[data-back]').isDisabled(), 'Previous is disabled only at the paused first-stage start');
  check((await navScene.locator('[data-time-readout]').innerText()).startsWith('0.0 /'), 'Stage 01 start is 0.0s, never 7.2s');
  await navScene.locator('select').selectOption('1');
  check((await navScene.locator('[data-time-readout]').innerText()).startsWith('7.2 /'), 'The paused start of stage 02 is exactly 7.2s');
  check(await navScene.locator('[data-back]').isEnabled(), 'Previous is available at the paused 7.2s boundary');
  await navScene.locator('[data-back]').click();
  check((await navScene.locator('[data-time-readout]').innerText()).startsWith('0.0 /') && (await navState()).status==='paused', 'Previous from the paused 7.2s boundary reaches the paused 0.0s start');
  await navScene.locator('select').selectOption('2');
  nav = await navState();
  check(nav.clip===2 && nav.p===0 && nav.status==='paused', 'Stage selection uses a paused start, not the previous stage end');
  await navScene.locator('[data-play]').click(); await page.waitForTimeout(180);
  check((await navState()).p>0, 'The selected stage can play from its start');
  await navScene.locator('[data-back]').click(); nav = await navState();
  check(nav.clip===2 && nav.p===0 && nav.status==='paused', 'Previous during playback restarts this stage before moving back');
  await navScene.locator('[data-back]').click(); nav = await navState();
  check(nav.clip===1 && nav.p===0 && nav.status==='paused', 'Previous at a paused start moves to the previous paused start');
  await navScene.locator('[data-next]').click(); nav = await navState();
  check(nav.clip===2 && nav.p===0 && nav.status==='paused', 'Next also preserves stage-start navigation');
  await navScene.locator('[data-play]').click(); await page.waitForTimeout(100); await navScene.locator('[data-play]').click();
  check((await navState()).p>0 && (await navState()).status==='paused', 'A stage may also be paused midway');
  await navScene.locator('[data-back]').click(); nav = await navState();
  check(nav.clip===2 && nav.p===0 && nav.status==='paused', 'Previous from a paused middle also returns to the current start');
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${base}?review=1&focus=lifecycle#lifecycle-player`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const scene = page.locator('[data-scene=lifecycle]');
  check(await scene.getAttribute('aria-modal') === 'true', 'Focus player is an accessible modal workspace');
  for (let clip = 0; clip < 9; clip++) {
    await scene.locator('select').selectOption(String(clip));
    const layout = await scene.evaluate(el => {
      const controls = el.querySelector('.motion-transport'), stage = el.querySelector('.lifecycle-viewport'), svg = el.querySelector('svg');
      const frame = el.getBoundingClientRect(), drawing = stage.getBoundingClientRect(), rail = controls.getBoundingClientRect();
      const objects = ['[data-current-model]','[data-memory-band]','[data-response-plot]'].map(selector => {
        const b = el.querySelector(selector).getBoundingClientRect(); return {x:b.x,y:b.y,right:b.right,bottom:b.bottom};
      });
      const title = el.querySelector('.lc-model-title');
      return { frame:{x:frame.x,y:frame.y,w:frame.width,h:frame.height}, inner:[innerWidth,innerHeight],
        stage:{x:drawing.x,y:drawing.y,right:drawing.right,bottom:drawing.bottom},
        controls:{x:rail.x,y:rail.y,right:rail.right,bottom:rail.bottom,scroll:controls.scrollHeight,client:controls.clientHeight}, ratio:svg.getBoundingClientRect().width/svg.getBoundingClientRect().height, noSidebar:!el.querySelector(".lifecycle-sidebar"), objects,
        parameterFont:parseFloat(getComputedStyle(el.querySelector(".lc-theta-label")).fontSize) * Math.hypot(el.querySelector(".lc-theta-label").getScreenCTM().a,el.querySelector(".lc-theta-label").getScreenCTM().b),
        majorFont:parseFloat(getComputedStyle(title).fontSize) * Math.hypot(title.getScreenCTM().a,title.getScreenCTM().b),
        overflow:document.documentElement.scrollWidth>innerWidth+1, locked:document.body.style.overflow==='hidden',
      };
    });
    check(Math.abs(layout.frame.x)<1 && Math.abs(layout.frame.y)<1 && Math.abs(layout.frame.w-layout.inner[0])<1 && Math.abs(layout.frame.h-layout.inner[1])<1, 'Focus workspace fills the actual browser content viewport');
    check(layout.objects.every(b => b.x >= layout.stage.x-2 && b.right <= layout.stage.right+2 && b.y >= layout.stage.y-2 && b.bottom <= layout.stage.bottom+2), `Network, outputs and memory are simultaneously inside the stage at clip ${clip}`);
    check(layout.stage.right<=layout.inner[0]+1 && layout.stage.bottom<=layout.inner[1]+1 && layout.controls.bottom<=layout.inner[1]+1 && layout.controls.y>=layout.stage.bottom-1, 'Stage and horizontal controls fit one screen without overlap');
    check(layout.noSidebar && Math.abs(layout.ratio-1.75)<.01, 'Focus has no sidebar and preserves canvas ratio');
    check(layout.majorFont>=13, 'The complete diagram retains readable primary labels');
    check(layout.parameterFont>=16, 'The network parameter badge has a clearly readable enlarged label');
    check(await scene.locator('.lifecycle-reading>p').count()===1, 'Only one observation sentence accompanies the stage');

    check(!layout.overflow && layout.locked, 'Focus view avoids whole-page overflow and background scrolling');
    if ([0,5,6,8].includes(clip)) await shot(`lifecycle-focus-${clip}`);
  }
  await scene.locator('[role=combobox]').click();
  await shot('lifecycle-focus-menu');
  await page.keyboard.press('Escape');
  check(await scene.getAttribute('class').then(c=>c.includes('is-focused')), 'Escape dismisses an open stage menu before exiting focus');
  const before = await scene.getAttribute('data-clip');
  const recordHandle = await scene.locator('[data-record-id="record:x1:i"]').elementHandle();
  await scene.locator('.lifecycle-example-note summary').click();
  check(await scene.locator('.lifecycle-provenance').isVisible(), 'Detailed example provenance is available on demand');
  await scene.locator('.lifecycle-example-note summary').click();
  await scene.locator('.lifecycle-exit-focus').click();
  check(!(await scene.getAttribute('class')).includes('is-focused') && await scene.getAttribute('data-clip')===before, 'Returning to reading preserves the current animation state');
  check(await page.evaluate(()=>document.body.style.overflow!=='hidden'), 'Reading mode restores normal document scrolling');
  await scene.locator('.lifecycle-focus-button').click();
  check(await scene.getAttribute('data-clip')===before, 'Re-entering focus does not restart the accepted animation');
  check(await recordHandle.evaluate(el => el === document.querySelector('[data-record-id="record:x1:i"]')), 'Switching viewing modes retains the exact record DOM object');
  await page.keyboard.press('Tab');
  check(await scene.evaluate(el=>el.contains(document.activeElement)), 'Keyboard focus remains inside the focus workspace');
  await page.keyboard.press('Escape');
  check(!(await scene.getAttribute('class')).includes('is-focused'), 'Escape returns to the full reading page');
}
