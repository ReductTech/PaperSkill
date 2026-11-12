import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { transformSync } from "esbuild";

async function importExample(name) {
  const text = await readFile(new URL("../src/modules/" + name, import.meta.url), "utf8");
  const { code } = transformSync(text, { loader: "ts", format: "esm" });
  return import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
}

async function checkLayout(container, selector) {
  const issues = await container.evaluate((root, selector) => {
    const box = root.getBoundingClientRect();
    return [...root.querySelectorAll(selector)].flatMap(node => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const svg = node.ownerSVGElement;
      const font = parseFloat(style.fontSize) * (svg ? svg.getScreenCTM().a : 1);
      const outside = rect.left < box.left - 1 || rect.right > box.right + 1
        || rect.top < box.top - 1 || rect.bottom > box.bottom + 1;
      return outside || font < 13 || style.textOverflow === "ellipsis"
        || (node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1)
        ? [{ text: node.textContent, font, outside }] : [];
    });
  }, selector);
  assert.deepEqual(issues, [], "Clipped or undersized teaching labels");
}

async function capture(page, locator, output, filename) {
  await locator.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
  const frame = await locator.boundingBox();
  const viewport = page.viewportSize();
  const header = await page.locator(".site-header").boundingBox();
  assert(frame.y >= header.y + header.height - 1, filename + ": covered by navigation");
  assert(frame.y + frame.height <= viewport.height + 1, filename + ": frame extends below viewport");
  await page.screenshot({ path: path.join(output, filename + ".png") });
}

export async function checkP4(page, output, width) {
  const { P4_TRAINING_TRACE: trace, P4_TOY_EXPERIMENT: toy, runP4Forward } = await importExample("prompt-tuning-demo.ts");
  const frozen = JSON.stringify(toy.frozenWeights);
  assert(trace.gradientCheck.maxAbsoluteError < 1e-6);
  assert.deepEqual(runP4Forward(trace.updatedPrompt, trace.updatedClassifierWeights, trace.updatedClassifierBias), trace.updated);
  assert.equal(JSON.stringify(toy.frozenWeights), frozen);
  assert(trace.updated.loss < trace.initial.loss);
  const stage = page.locator(".p4-stage");
  const figure = page.locator(".p4-training-figure");
  const range = figure.getByRole("slider");
  const prompt = stage.locator(".p4-components");
  const promptValues = () => prompt.locator("div > span:last-child").allTextContents();
  const original = toy.prompt.flat().map(value => value.toFixed(3));
  const revised = trace.updatedPrompt.flat().map(value => value.toFixed(3));
  const attached = await stage.locator(".p4-edge").evaluateAll(edges => edges.every(edge => {
    const track = edge.getBoundingClientRect();
    const before = edge.previousElementSibling.getBoundingClientRect();
    const after = edge.nextElementSibling.getBoundingClientRect();
    const middle = (track.top + track.bottom) / 2;
    return Math.abs(track.left - before.right) <= 1 && Math.abs(track.right - after.left) <= 1
      && [before, after].every(node => middle > node.top && middle < node.bottom);
  }));
  assert(attached, "Training arrows must connect adjacent node edges");

  for (const [index, label] of ["input", "forward", "loss", "backward", "write", "rerun"].entries()) {
    await figure.locator(".p4-phase-list button").nth(index).click();
    assert.equal(await stage.getAttribute("data-phase"), String(index));
    await checkLayout(stage, ".p4-node h4, .p4-vector strong, .p4-attention strong, .p4-value, .p4-loss-value");
    assert.match(await stage.locator(".p4-frozen-status").innerText(), /权重固定.*梯度可通过/);
    await capture(page, figure, output, "P4-" + width + "-" + label);
    if (index < 4) assert.deepEqual(await promptValues(), original);
    if (index === 2) assert.equal(await stage.locator(".p4-loss-value").innerText(), trace.initial.loss.toFixed(3));
    if (index === 4) {
      assert.notDeepEqual(await promptValues(), original);
      assert.notDeepEqual(await promptValues(), revised);
      assert.equal(await stage.getAttribute("data-updates"), "0");
    }
  }
  assert.deepEqual(await promptValues(), revised);
  assert.equal(await stage.locator(".p4-loss .p4-value").first().innerText(), trace.updatedClassifierBias[1].toFixed(3));
  assert.equal(await stage.locator(".p4-loss-value").innerText(), trace.updated.loss.toFixed(3));
  assert.equal(await stage.getAttribute("data-updates"), "1");

  // Continue in real time through the backward and update phases, then scrub back.
  await range.fill("11300");
  await figure.getByRole("button", { name: "播放过程" }).click();
  await page.waitForFunction(() => document.querySelector(".p4-stage").dataset.phase === "4");
  await page.waitForFunction(() => document.querySelector(".p4-stage").dataset.updates === "1");
  await figure.getByRole("button", { name: "暂停", exact: true }).click();
  const paused = await range.inputValue();
  await page.waitForTimeout(200);
  assert.equal(await range.inputValue(), paused);
  await range.press("End");
  await figure.getByRole("button", { name: "重播", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".p4-stage").dataset.phase === "0");
  await figure.getByRole("button", { name: "暂停", exact: true }).click();
  assert.deepEqual(await promptValues(), original);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await figure.getByRole("button", { name: "播放过程" }).click();
  assert.equal(await stage.getAttribute("data-updates"), "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

export async function checkP5(page, output, width) {
  const { buildSelectionSnapshot, sharedKeyIndices } = await importExample("prompt-retrieval-data.ts");
  const compare = page.locator(".p5-compare-figure");
  const retrieval = page.locator(".p5-retrieval-figure");
  const rank = retrieval.locator(".p5-rank-bars");
  const shelf = retrieval.locator(".p5-prompt-shelf");
  const order = (locator, attr) => locator.evaluateAll((nodes, attr) => nodes.map(node => Number(node.getAttribute(attr))), attr);
  const ids = Array.from({ length: 10 }, (_, index) => index + 1);
  await checkLayout(page.locator(".p5-slot-anatomy"), "strong, span, math, .p5-slot-pair-link, i");
  await capture(page, page.locator(".p5-pair-intro"), output, "P5-" + width + "-slot");
  await checkLayout(compare, ".p5-ring-key text, .p5-score dt, .p5-score dd, .p5-scan-keys button");
  const compareRange = compare.getByRole("slider");
  const readRange = retrieval.getByRole("slider");

  for (const query of ["A", "B"]) {
    const expected = buildSelectionSnapshot(query);
    await page.getByRole("button", { name: new RegExp("查询 " + query) }).click();
    assert.equal(await compareRange.inputValue(), "0");
    assert.equal(await readRange.inputValue(), "0");
    assert.equal(await shelf.locator("[data-copy]").count(), 0);
    assert.deepEqual(await order(rank.locator("li"), "data-key"), ids);
    assert.deepEqual(await order(shelf.locator("[data-slot]"), "data-slot"), ids);
    await compare.locator(".p5-scan-keys button").nth(query === "A" ? 0 : 3).click();
    const candidate = expected.candidates[query === "A" ? 0 : 3];
    assert.deepEqual(await compare.locator("dd").allTextContents(),
      [candidate.thetaDegrees.toFixed(0) + "°", candidate.cosineSimilarity.toFixed(3), candidate.distance.toFixed(3)]);
    assert.equal(await compare.locator("button[data-computed='true']").count(), 1);
    await capture(page, compare, output, "P5-" + width + "-angle-" + query);

    // During the second Key’s angle sweep, only the first score has landed.
    await compareRange.fill("1800");
    assert.equal(await compare.locator(".p5-compare-grid").getAttribute("data-computed"), "1");
    assert.equal(await compare.locator("dd").last().innerText(), "—");
    if (query === "A") {
      await capture(page, compare, output, "P5-" + width + "-scanning");
      await compareRange.fill("10800");
      await compare.getByRole("button", { name: "播放过程" }).click();
      await page.waitForFunction(() => document.querySelector(".p5-compare-grid").dataset.computed === "10");
      await compare.getByRole("button", { name: "暂停", exact: true }).click();
    }

    await readRange.fill("1340");
    assert.equal(await rank.getAttribute("data-ranked"), "false");
    assert.equal(await rank.locator("[data-lifted='true']").count(), 1);
    if (query === "A") {
      const intersects = await rank.locator("li strong, li > span:last-child").evaluateAll(labels => {
        const bounds = labels.map(label => label.getBoundingClientRect());
        return bounds.some((a, i) => bounds.slice(i + 1).some(b => a.left < b.right && b.left < a.right
          && a.top < b.bottom && b.top < a.bottom));
      });
      assert.equal(intersects, false, "Sorting obscures candidate labels");
      await capture(page, retrieval, output, "P5-" + width + "-sorting");
    }
    await readRange.fill("4400");
    assert.deepEqual(await order(rank.locator("li"), "data-key"), expected.ranking.map(item => item.index));
    assert.deepEqual(await order(rank.locator("[data-selected='true']"), "data-key"), expected.selectedKeyIndices);
    await checkLayout(rank, "li strong, li > span:last-child");
    if (query === "A") await capture(page, retrieval, output, "P5-" + width + "-ranked");

    await readRange.fill("5310");
    assert.equal(await shelf.locator("[data-copy]").count(), 1);
    assert.deepEqual(await order(shelf.locator("[data-reading='true']"), "data-slot"), expected.selectedKeyIndices.slice(0, 1));
    assert.equal(await shelf.locator("[data-copy]").getAttribute("data-arrived"), "false");
    if (query === "A") await capture(page, retrieval, output, "P5-" + width + "-copying");
    await readRange.press("End");
    assert.deepEqual(await order(shelf.locator("[data-arrived='true']"), "data-copy"), expected.selectedKeyIndices);
    assert.deepEqual(await order(shelf.locator("[data-slot]"), "data-slot"), ids);
    await checkLayout(shelf, ".p5-source-pair, .p5-copy, .p5-shelf-heading");
    await capture(page, retrieval, output, "P5-" + width + "-read-" + query);
  }
  assert.deepEqual(sharedKeyIndices(), [2, 3]);
  const sharedColumns = page.locator(".p5-overlap [data-shared=true]");
  assert.deepEqual(await order(sharedColumns, "data-pool-slot"), [2, 3]);
  const overlapDrawing = page.locator(".p5-overlap .viewport-drawing");
  await overlapDrawing.evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await overlapDrawing.and(page.locator("[data-entered=true]")).waitFor();
  await overlapDrawing.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(animation => animation.finished)));
  await capture(page, page.locator(".p5-query-sharing"), output, "P5-" + width + "-overlap");
  await retrieval.getByRole("button", { name: "重播" }).click();
  await page.waitForFunction(() => document.querySelector(".p5-rank-bars").dataset.ranked === "false");
  await page.waitForFunction(() => document.querySelector(".p5-copy") !== null);
  await retrieval.getByRole("button", { name: "暂停", exact: true }).click();
  const paused = await readRange.inputValue();
  await page.waitForTimeout(200);
  assert.equal(await readRange.inputValue(), paused);
  await page.getByRole("button", { name: /查询 A/ }).click();
  assert.equal(await readRange.inputValue(), "0");
  assert.equal(await shelf.locator("[data-copy]").count(), 0);
  await compare.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await compare.getByRole("button", { name: "播放过程", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".p5-compare-grid")?.dataset.computed === "1");
  await compare.getByRole("button", { name: "暂停", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await retrieval.getByRole("button", { name: "播放过程" }).click();
  assert.deepEqual(await order(shelf.locator("[data-arrived='true']"), "data-copy"), buildSelectionSnapshot("A").selectedKeyIndices);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await checkLayout(compare.locator(".p5-legend"), "strong, small");
  await checkLayout(retrieval.locator(".p5-retrieval-legend"), "strong, small");
}
