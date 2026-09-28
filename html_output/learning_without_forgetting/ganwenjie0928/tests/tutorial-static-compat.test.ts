import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const tutorialSource = readFileSync(
  fileURLToPath(new URL("../src/data/tutorial.ts", import.meta.url)),
  "utf8",
);
const chapterPattern = /["']?kind["']?\s*:\s*["']chapter["']/g;
const modulePattern = /["']?kind["']?\s*:\s*["']module["']/g;

test("materialized tutorial.ts is readable by PaperSkill's static validator", () => {
  const chapterCount = (tutorialSource.match(chapterPattern) ?? []).length;
  const moduleCount = (tutorialSource.match(modulePattern) ?? []).length;
  const chapterBlocks = tutorialSource.split(chapterPattern).slice(1);

  assert.ok(chapterCount >= 6 && chapterCount <= 10, `literal chapter count = ${chapterCount}`);
  assert.ok(moduleCount >= 4, `literal module count = ${moduleCount}`);
  assert.ok(
    chapterBlocks.some((chapter) => (chapter.match(modulePattern) ?? []).length >= 2),
    "at least one literal chapter must contain two modules",
  );
});
