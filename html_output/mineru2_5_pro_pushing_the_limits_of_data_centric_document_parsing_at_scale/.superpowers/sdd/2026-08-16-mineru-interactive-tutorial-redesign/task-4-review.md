# Task 4 independent review

**VERDICT: FAIL**

## Blocking findings

1. **HIGH — Render comparison changes are never persisted or reported.** `src/experiences/RenderForensics.tsx:46` only calls `setProgress`; it never calls `onInteract('render-verify')` or `onStateChange` with `compare-p0`, `compare-p50`, or `compare-p100`. Thus a slider interaction cannot produce the required stable hash/module state, despite `:6` computing buckets. The focused tests only inspect a private `data-compare` attribute (`RenderForensics.test.tsx:40-43`), so this contract regression is untested.
2. **HIGH — Render deep links cannot restore any comparison bucket.** `RenderForensics.tsx:15-20` recognizes only `render-verify/repaired`; `compare-p0|compare-p50|compare-p100` are ignored. This violates the merged-experience restoration requirement and makes the three requested slider states non-reproducible.
3. **MEDIUM — The CMCV consensus boundary is gated behind a second action.** `CmcvRoutingChallenge.tsx:86-87` renders the counterexample only after the separate “reveal” button. The design requires it to unfold after one routing round; completion itself correctly fires for either answer at `:28-35`, but that completed path does not set `consensusBoundary`.
4. **MEDIUM — Restoring `cmcv-trust/consensus:correct` does not restore the preceding route stage.** `CmcvRoutingChallenge.tsx:19-25` displays the consensus aside without selecting the Medium route, moving the token, or showing its outcome/label source/destination. A deep link to the second state therefore lacks the stage needed to understand that state.
5. **MEDIUM — The range input does not meet the 44px touch-target requirement.** `experience-labeling.css:6` gives the slider input only width/accent styling, with no `min-height`, padding, or expanded hit area. The buttons meet 44px (`:4`), but the Chapter 4 primary control does not.
6. **MINOR — Synthetic routes are not individually labeled as teaching demonstrations.** `CmcvRoutingChallenge.tsx:71-74` and `:81-86` show invented lane rules, label sources, destinations, and feedback without a teaching tag; the nearby header scope labels only A/B/C (`:49,54-57`). The real Omni crop is correctly framed solely as an input anchor (`:53`). Render generated source/error cards are correctly tagged (`RenderForensics.tsx:49-51`).

## Confirmed checks

- CMCV’s Medium relation is correct: C differs, while external A/B agree (`CmcvRoutingChallenge.tsx:55-59`); button and native drop share `chooseRoute` (`:28-36,69,74`), errors state the exact pairwise relation (`:83`), and one attempt completes the chapter.
- Repair atomically updates source, visual alignment, diff, reports `repaired`, and completes once (`RenderForensics.tsx:22-30,40,50-51`). The hotspot is a native keyboard button after its threshold; the expert fallback is one sentence; code/errors are tagged teaching demonstrations.
- The lane/token and layered split/heatmap designs are materially distinct. Responsive stacking, reduced-motion instant transitions, and local image assets are present by source inspection. No Task 4 runtime network request was found; source links are inactive until clicked.

## Verification

- PASS — focused tests: 2 files / 5 tests.
- PASS — full suite: 8 files / 20 tests.
- PASS — `npm run build`.
- PASS — `node ..\\PaperSkill\\paper-skill\\scripts\\validate-output.js .` (6 chapters, 11 active modules).
- No interactive browser visual QA was performed; the mobile/44px finding is static CSS inspection.
