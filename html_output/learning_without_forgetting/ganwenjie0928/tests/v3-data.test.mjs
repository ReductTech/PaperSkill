import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { grandTrailSteps } from "../src/v3/data/grand-trail.ts";
import { LWF_CHAPTERS } from "../src/v3/data/chapters.ts";

test("the release spine is exactly the ready 00–07 sequence", () => {
  assert.deepEqual(LWF_CHAPTERS.map((chapter) => chapter.id), ["00", "01", "02", "03", "04", "05", "06", "07"]);
  assert.ok(LWF_CHAPTERS.every((chapter) => chapter.status === "ready"));
});

test("GrandTrail has nine complete checkpoints and ends at the next Teacher", () => {
  assert.equal(grandTrailSteps.length, 9);
  assert.equal(grandTrailSteps.at(-1)?.id, "next-teacher");
  assert.ok(grandTrailSteps.every((step) => step.title && step.input && step.output && step.state && step.why));
  assert.ok(grandTrailSteps.every((step) => step.durationMs > 0));
  assert.ok(grandTrailSteps.every((step) => !Object.hasOwn(step, "visibleObjects")));
});

test("the release entry imports App directly without a version query switch", () => {
  const entryPath = fileURLToPath(new URL("../src/main.tsx", import.meta.url));
  const entry = readFileSync(entryPath, "utf8");
  assert.match(entry, /import App from ["']\.\/App["']/);
  assert.doesNotMatch(entry, /URLSearchParams|version=v3/);
});
