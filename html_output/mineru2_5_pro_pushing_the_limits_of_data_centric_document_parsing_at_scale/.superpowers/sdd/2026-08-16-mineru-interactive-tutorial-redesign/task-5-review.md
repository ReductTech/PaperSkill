# Task 5 Independent Review

## VERDICT: FAIL

## Findings

1. **Major — The MGAM waterfall omits the three reported segment gains.** `MgamMatchingPuzzle.tsx:79-86` renders only the four endpoints (`92.98 → 94.29 → 95.25 → 95.69`) and the aggregate `+2.72`/endpoint `+2.71` note. It never shows the paper-reported `+1.31`, `+0.96`, and `+0.45`, so the user cannot see which stage contributed each reported rounded increment or why the displayed endpoint arithmetic differs by `0.01`. `facts.ts:11-16` likewise centralizes only endpoints and aggregate gains. Add the three reported segment gains to centralized facts and label them directly between/on the waterfall steps, retaining the explicit rounding explanation.

2. **Major — MGAM stable-state restoration only works on first mount.** `MgamMatchingPuzzle.tsx:10-15` derives `merged12`, `merged23`, and `evidenceOpen` exclusively through `useState` initializers. A later `restoredModuleState` change on the same mounted experience does not reconstruct `partition-3`, `partition-2`, `partition-1`, `evidence-open`, or `evidence-closed`. This differs from the stable hash/deep-link contract and the restoration pattern used by the other experiences. Add restoration synchronization and rerender coverage for every MGAM state, including closing evidence and returning from a `results-boundary` state.

3. **Medium — Completion is emitted on the first partial merge, before the reasonable match and evidence/results terminal state.** `MgamMatchingPuzzle.tsx:28-39` calls `onComplete()` for any separator click, including the `partition-3 → partition-2` transition. The Task 5 test only checks the callback after the second merge (`MgamMatchingPuzzle.test.tsx:25-38`) and never asserts that it was absent after the first. The design spec's minimum condition (“at least one merge and view the score change”) permits this early timing, but the Task 5 terminal narrative and stricter completion semantics center `partition-1` / “reasonable match.” To satisfy both without prematurely unlocking the chapter, gate completion on `nextPartition === 1` and add a negative assertion after `partition-2`.

4. **Medium — MGAM convergence transitions remount the blocks instead of animating them.** `MgamMatchingPuzzle.tsx:58,63` includes `partition` in every matching-line/block key. Every merge therefore replaces all nodes, so the transitions declared in `experience-training.css:49` cannot animate existing blocks into their converged positions. Use stable block identities (or an explicit layout animation) while recomputing the line geometry.

## Requirements checked

- Training uses `24_000` ms and `[0, 8_000, 16_000, 24_000]`, with play/pause, scrub, stage stepping, replay, Stage-specific facts, no pre-Stage-3 rollout slot, exactly 16 rollouts, stable candidate IDs, correct Edit Distance/CDM/TEDS/IoU mapping, Stage-3-plus-ranking completion, restoration, and reduced-motion manual access (`TrainingTimeline.tsx:8-18,34-95,103-151`).
- MGAM visibly distinguishes `HELD-OUT TEST` / `TEST-296`, keeps GT non-interactive, merges only Prediction, emits partition states, recomputes line count/score, keeps `92.01/+2.07` primary and `92.48/+1.60` folded, and labels the Markdown comparison as not an original MGAM example (`MgamMatchingPuzzle.tsx:42-102`).
- Core controls meet the 44px CSS minimum, mobile rules stack at 760/420px, reduced motion removes transitions, and both PaperMedia assets use local image paths. This is static inspection; Task 5 components are not yet mounted for visual viewport QA (`experience-training.css:22,27,59-62`; `media.ts:48-52,82-86`).

## Verification evidence

- `npm test -- src/experiences/TrainingTimeline.test.tsx src/experiences/MgamMatchingPuzzle.test.tsx` — PASS, 2 files / 6 tests.
- `npm test` — PASS, 10 files / 28 tests.
- `npm run build` — PASS (`tsc` and Vite production build).
- `node ..\PaperSkill\paper-skill\scripts\validate-output.js .` — PASS (6 chapters, 11 active modules, all component IDs registered).
