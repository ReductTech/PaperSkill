# Task 4 re-review 1

**VERDICT: FAIL**

## Original findings

1. **PASS — slider reporting.** Every range change now calls `onInteract('render-verify')` and emits the computed `compare-p0|compare-p50|compare-p100` state (`src/experiences/RenderForensics.tsx:53-58`), with focused assertions for all buckets (`RenderForensics.test.tsx:37-50`).
2. **PASS — slider-state restoration.** The three comparison states restore to 0/50/100 and clear the repair state; `repaired` restores its terminal frame (`RenderForensics.tsx:15-27`; tests `:52-60`).
3. **PASS — CMCV timing.** One route attempt immediately sets and reports `cmcv-trust/consensus:correct`, while completing exactly once (`CmcvRoutingChallenge.tsx:30-40`); no second reveal action remains.
4. **PASS — CMCV trust deep link.** The trust state reconstructs Medium, the token/outcome context, and boundary (`CmcvRoutingChallenge.tsx:24-27`; test `CmcvRoutingChallenge.test.tsx:58-66`).
5. **PASS — touch target.** The range is now a 44px minimum-height, padded control (`src/styles/experience-labeling.css:6`).
6. **PASS — fact-boundary labels.** Synthetic routing and feedback have an explicit teaching-demonstration scope (`CmcvRoutingChallenge.tsx:61-86`); real Omni crops remain input anchors, and generated code/errors retain teaching labels (`RenderForensics.tsx:45-47,61-65`).

## New blocking finding

1. **MEDIUM — A post-repair slider interaction serializes an unrepaired state while leaving the UI repaired.** After `repair()` sets `repaired` true (`RenderForensics.tsx:29-37`), the still-enabled range handler at `:53-58` reports `compare-p*` but never calls `setRepaired(false)`. The canvas/source/diff therefore remain repaired, whereas restoring that exact emitted `compare-p*` state intentionally clears repaired at `:22-26`. This breaks the stable-state/deep-link contract on an allowed interaction path. Disable the range after repair, or clear `repaired` whenever it emits a comparison state; add a repair-then-slider test.

## Verification

- PASS — targeted Task 4 tests: 2 files / 6 tests.
- PASS — full suite: 8 files / 21 tests.
- PASS — `npm run build`.
- PASS — validator (6 chapters, 11 active modules).
- Browser visual QA was not run; responsive layout, reduced motion, 44px range, distinct experience styles, and no Task 4 runtime network call were verified by source inspection.
