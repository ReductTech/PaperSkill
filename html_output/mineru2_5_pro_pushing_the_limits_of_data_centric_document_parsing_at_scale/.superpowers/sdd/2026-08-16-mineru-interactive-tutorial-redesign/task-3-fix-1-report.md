# Task 3 review fix 1

## Root cause

`DdasMicroscope` encoded page sampling only as a view transition and hard-coded every page callback to `ddas`. Its conditional controls had no pointer return from element to page, while a separate mobile-only button group omitted text/table actions. Cluster thumbnails bypassed `PaperMedia`.

## RED → GREEN

- Added state-contract tests before changing production code. RED reproduced the missing random control and absent `data-view` reversible state.
- Added explicit `PageState` handling for `random`, `cluster`, and `ddas`, including restored deep-link state.
- Replaced the one-way controls with one shared control group: all page element choices and `返回页面级` work with pointer and native button keyboard activation. Mobile makes that same group full-width and 52px high rather than hiding functions.
- Replaced raw cluster images with local `PaperMedia` thumbnails, retaining its failure fallback. Moved the duplicate 512-dimensional ViT-base fact out of the boundary sentence.

## Fresh verification

- Targeted: `npm test -- src/experiences/DataCounterfactual.test.tsx src/experiences/DdasMicroscope.test.tsx` — 2 files / 8 tests passed.
- Full: `npm test` — 6 files / 15 tests passed.
- Build: `npm run build` — exited 0.
- Validator: `node ..\PaperSkill\paper-skill\scripts\validate-output.js .` — PASS.

## Scope and residual risk

- Changed only Task 3 experience/test/style files plus the required progress ledger and this report.
- Browser visual QA was not run because no browser connection was available; automated tests cover the shared controls and state transitions but not physical viewport rendering.
