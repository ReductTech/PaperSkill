# Task 6 Fix 2 Report

## Result

The remaining Task 6 re-review finding is fixed. `DocumentPrimer` now restores state only when the hash identifies both the `document-primer` step and the `document-primer` module; locked-chapter hashes cannot mutate it.

## Root cause

Chapter experiences already used `restoredStateForModules(stepId, modules)`, which validates both hash keys. `DocumentPrimer` used a separate `restoredStateFor(moduleId)` helper that checked only `hashState.moduleId`, so `#step-3/document-primer/formula` incorrectly restored the primer even though its step was locked and unrelated.

## RED -> GREEN

- Added a negative regression for `#step-3/document-primer/formula`: the primer must remain at its default `text` region and the locked Step 2 prompt must stay visible.
- Added a positive regression for `#document-primer/document-primer/formula`: the primer must restore `formula`.
- RED command: `npm test -- src/App.test.tsx -t "document primer"`.
- RED result: 1 failed, 2 passed, 12 skipped. The negative case received `data-region="formula"` instead of `text`; the legal positive case passed.
- GREEN change: `restoredStateFor(stepId, moduleId)` now requires both `hashState.stepId === stepId` and `hashState.moduleId === moduleId`; the primer call supplies `document-primer` for both keys.
- GREEN result: the focused slice passed 3/3, with 12 unrelated App tests skipped.

## Hash, unlock, and scope checks

- The legal primer deep link restores exactly as before.
- The wrong-step hash leaves the primer untouched while the existing locked-hash scroll/prompt behavior remains active.
- `restoredStateForModules` and persisted chapter unlock behavior were not changed.
- Fix 2 changed only `src/App.tsx`, `src/App.test.tsx`, this report, and the progress ledger.

## Verification

- Targeted Task 6 + PaperMedia suite: PASS, 4 files / 24 tests.
- Full suite: PASS, 13 files / 53 tests.
- `npm run build`: PASS (`tsc` and Vite; 63 modules transformed).
- Official PaperSkill validator: PASS (6 chapters, 11 active modules, all 11 component IDs registered).

No deployment, PR, Git initialization, or Git mutation performed.
