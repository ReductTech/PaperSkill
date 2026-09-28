import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { tutorial } from "../src/data/tutorial.ts";
import { LWF_UPSTREAM_ADAPTER, LWF_UPSTREAM_CHAPTERS } from "../src/v3/data/upstream-adapter.ts";

test("the upstream adapter exports the complete 00–07 chapter spine", () => {
  assert.equal(LWF_UPSTREAM_ADAPTER.chapterCount, 8);
  assert.equal(LWF_UPSTREAM_ADAPTER.readyChapterCount, 8);
  assert.equal(LWF_UPSTREAM_ADAPTER.activeModuleCount, 10);
  assert.equal(LWF_UPSTREAM_ADAPTER.upstreamReady, true);
  assert.deepEqual(LWF_UPSTREAM_CHAPTERS.map((chapter) => chapter.id), [
    "chap-00", "chap-01", "chap-02", "chap-03", "chap-04", "chap-05", "chap-06", "chap-07",
  ]);
  assert.ok(LWF_UPSTREAM_CHAPTERS.every((chapter) => chapter.kind === "chapter"));
  assert.equal(tutorial.chapters, LWF_UPSTREAM_CHAPTERS);
});

test("upstream modules are real registered interactions and satisfy the import thresholds", () => {
  const modules = LWF_UPSTREAM_CHAPTERS.flatMap((chapter) => chapter.modules);
  const componentSources = [
    readFileSync(fileURLToPath(new URL("../src/modules/registry.tsx", import.meta.url)), "utf8"),
    readFileSync(fileURLToPath(new URL("../src/modules/v3-widgets.tsx", import.meta.url)), "utf8"),
  ].join("\n");

  assert.ok(modules.length >= 4);
  assert.ok(LWF_UPSTREAM_CHAPTERS.some((chapter) => chapter.modules.length >= 2));
  assert.ok(modules.every((module) => module.kind === "module" && componentSources.includes(`"${module.componentId}"`)
    || module.kind === "module" && componentSources.includes(`'${module.componentId}'`)));
  assert.ok(modules.some((module) => module.componentId === "lwf-evidence-explorer"));
  assert.ok(modules.some((module) => module.componentId === "lwf-grand-trail"));
  assert.equal(LWF_UPSTREAM_CHAPTERS.find((chapter) => chapter.id === "chap-05")?.modules[0]?.componentId, "lwf-task-handoff");
  assert.ok(componentSources.includes('"lwf-task-handoff": TaskHandoffWidget'));
  assert.ok(componentSources.includes("LwfTaskHandoffView"));
});
