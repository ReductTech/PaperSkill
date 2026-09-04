# Task 1 Fix 1 Scope Re-review

## Verdict

**PASS**

The two Major findings and all three Minor findings from `task-1-review.md` are closed within the Task 1 scope. No source files were modified during this re-review.

## Critical findings

None.

## Major findings

None.

## Original finding disposition

### Major 1 — bounded shell clipped real chapter content: CLOSED

- The desktop `.process-step` no longer applies `overflow: hidden`.
- `.chapter-unlock-reveal` now has `min-block-size: 0` and `overflow: auto` at the desktop gate. Therefore, if a legacy experiment still exceeds the fixed row before Tasks 2–4 compact it, its heading, content, controls, evidence summary, and navigation remain reachable through an explicit bounded scroll container instead of disappearing.
- The navigation footer remains in grid row 2 and is outside that scroll fallback, so it stays visible.
- An opened evidence panel has a bounded block size and its `.evidence-list` has its own `overflow-y: auto` route.
- The strengthened fixture contains a populated Step 1-shaped experiment rather than the former empty placeholder and asserts the active overflow and shrinkability declarations.

The static contract does not prove real pixel geometry, but it now proves a non-clipping fallback. Real-browser visual geometry remains a final QA item rather than a Task 1 blocker.

### Major 2 — locked card still required completion: CLOSED

The locked card now says `请从上一章点击进入下一章，学习进度可稍后补做。`, and a regression test excludes the old completion-required copy.

### Minor 1 — wrong button copy: CLOSED

The action and tests now use the approved exact label `进入下一章`.

### Minor 2 — incomplete/unrepresentative CSS contract: CLOSED

- The desktop fixture is now 1366×768.
- The test resolves the `.tutorial-layout` declaration to the 1120px cap.
- Its relevant stylesheet order matches the production bundle: component-imported `chapter-unlock.css` precedes `paper.css`, the experience styles, and the final `elf-inspired.css` override. Inspection of the built CSS confirms the same ordering for the selectors under review.
- The omitted component styles do not declare the shell selectors being asserted, so excluding them from this focused cascade fixture does not invalidate the result.
- Narrow 1023×800 and short 1280×699 fixtures still retain natural flow.

### Minor 3 — access/completion status conflation: CLOSED

Only `completed` now produces `✓`. Saved sequential access without completion produces `→` plus explicit text that the learning progress is still incomplete.

## Step 6 page-tail check

`research-lens` and `FurtherLearning` are now rendered in `.page-tail` after the closing `.tutorial-layout`, gated by `isUnlocked('step-6')`. They are no longer descendants of `#step-6` or its bounded reveal. The App regression test verifies both the DOM position and absence from Step 6.

## Navigation, completion, and hash regression check

- An unfinished Step 1 can unlock only its immediate Step 2 successor.
- Advancing alone keeps the chapter counter at `0 / 6` and does not write `chapter:step-1`.
- Existing locked Step 3 hash tests still prevent skipping Step 2 or injecting state into an earlier module.
- Saved access and semantic completion remain visually and persistently distinct.

## Verification run

1. `npm test -- src/components/ProgressiveChapter.test.tsx src/App.test.tsx src/styles/desktop-one-screen.test.ts`
   - PASS — 3 files, 23 tests.
2. `npm test`
   - PASS — 16 files, 71 tests.
3. `npm run build`
   - PASS — TypeScript and Vite production build; 65 modules transformed.
4. `node ..\PaperSkill\paper-skill\scripts\validate-output.js .`
   - PASS — 6 chapters, 11 active modules, 11 explicit registrations.

## Browser QA limitation

No connected in-app browser session was available, so real 1366×768 `scrollHeight`/`clientHeight` visual measurement was not run. This is explicitly not substituted with JSDOM. The CSS contract now guarantees reachable overflow rather than silent clipping, and Tasks 2–4 can proceed to compact the default experiment layouts.
