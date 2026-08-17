# Task 1 Fix 1 Implementer Report — Independent Review Remediation

## Review disposition

Implemented all four requested review corrections without modifying Task 2–4 experience implementations:

- Locked cards now tell learners to use the prior chapter's `进入下一章` action and explicitly state that learning progress can be completed later.
- The sequential action now uses the exact `进入下一章` label. Completion and access status are separated: only `completed` renders `✓`; an already accessible next chapter renders `→` plus text that it is access-only and progress remains incomplete.
- Step 6 `research-lens` and `FurtherLearning` now render in an independently gated `.page-tail` after `.tutorial-layout`, rather than inside MGAM's `ProgressiveChapter`.
- The desktop shell no longer uses the two clipping `overflow: hidden` declarations. The fixed-size grid, reveal, and experience have shrinkable block constraints; the reveal uses visible `overflow: auto` as the bounded fallback for legacy oversized experiences. An opened evidence list remains independently scrollable inside a bounded evidence panel.

## RED evidence

1. `npm test -- src/components/ProgressiveChapter.test.tsx src/App.test.tsx src/styles/desktop-one-screen.test.ts`
   - Expected RED: 7 failures. The prior output retained `进入下一章节`, the completion-required locked copy, a checkmark for saved access, no page tail, and the former CSS shell contract.
2. `npm test -- src/styles/desktop-one-screen.test.ts`
   - Expected RED after strengthening the CSS contract: `.chapter-experience` had no active desktop `min-block-size` declaration (`''` instead of `0`).

## GREEN and verification

- `npm test -- src/components/ProgressiveChapter.test.tsx src/App.test.tsx src/styles/desktop-one-screen.test.ts` — PASS, 3 files / 23 tests.
- `npm test` — PASS, 16 files / 71 tests.
- `npm run build` — PASS (`tsc && vite build`; 65 modules transformed). The first build exposed a PostCSS test-helper ancestor type mismatch; the helper was narrowed to a read-only parent-node shape and the full build was rerun successfully.
- `node ..\PaperSkill\paper-skill\scripts\validate-output.js .` — PASS (6 chapters, 11 active modules, 11 explicit registrations).

## CSS contract coverage

- Uses the actual relevant production import order: `chapter-unlock → paper → experience foundation/data → elf-inspired`.
- Exercises the desktop 1366×768 baseline with a populated `data-counterfactual`-shaped experience fixture, checks the 1120px tutorial-width cap semantics, fixed grid shell, zero external chapter margins, shrinkable reveal/experience, final footer row, non-hidden step overflow, reveal `overflow: auto` fallback, and independent evidence-list scrolling.
- Keeps narrow and short viewport natural-flow regressions.

## Browser QA limitation

No connected browser session was available. JSDOM CSS contracts establish the active cascade and an accessible overflow route, but cannot measure real `scrollHeight`/`clientHeight`; real-browser visual geometry QA is still required after Task 2–4 compact the default experiences.
