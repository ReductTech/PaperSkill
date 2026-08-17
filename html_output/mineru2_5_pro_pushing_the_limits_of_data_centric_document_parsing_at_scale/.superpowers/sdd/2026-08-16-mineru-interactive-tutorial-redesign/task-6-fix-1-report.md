# Task 6 Fix 1 Report

## Result

All four findings from `task-6-review.md` are resolved within the approved App, DocumentPrimer, PaperMedia, test, CSS, and progress scope. A focused read-only re-review returned PASS with no remaining Task 6 issues.

## Systematic root-cause analysis

1. `restoredStateForModules` accepted only a module list, so every mounted chapter could consume a hash state whose `componentId` happened to occur in that chapter even when the hash's `stepId` named another chapter.
2. `DocumentPrimer` rendered `omni-output` crops but never consumed the registry's `allowedClaim` or `forbiddenClaims`, leaving required fact limits data-only.
3. `PaperMedia` used the full composite image alt and one generic trigger label for every crop, and invoked `PaperFigureViewer` without the registry's claim, Figure/source, or boundary context.
4. The `max-width: 820px` rule replaced the three-column comparison with one column while retaining portrait crop ratios, producing roughly three full portrait heights before the interactive primer at 360px.

## RED → GREEN

- RED command: `npm test -- src/App.test.tsx src/components/PaperMedia.test.tsx`.
- RED result: 2 files, 15 tests; 6 expected failures and 9 passes. Failures reproduced both cross-step hash mutations, missing registry boundary, missing scrollable region semantics, generic crop alt, and generic viewer control/context.
- GREEN hash slice: both mismatched/locked hash pollution tests passed 2/2 after adding the current step ID to the restoration contract.
- GREEN PaperMedia slice: 2/2 passed after crop-specific text and viewer context forwarding.
- GREEN combined slice: App + PaperMedia passed 15/15 after the DocumentPrimer/CSS change.
- Final Task 6 targeted suite including PaperMedia: 4 files, 22/22 passed.

## Fixes

- `restoredStateForModules(stepId, modules)` now returns state only when `hashState.stepId === stepId` and the hash module matches a real `componentId` in that chapter. A wrong-step `element-ddas` hash leaves Step 2 at `cluster`; a locked Step 3 hash naming `data-bias` leaves Step 1 at `ordinary`.
- `DocumentPrimer` reads `getMediaAsset('omni-output')` and shows the registry's allowed claim plus both forbidden inferences once beside the three crops.
- Crop image alt text includes the full-image context, `crop.label`, and distinct caption. Viewer trigger names include the caption and crop label, so Original PDF, Output A, and Output B controls are distinguishable.
- `PaperMedia` forwards `allowedClaim` as viewer introduction, Figure/source URL as the verification link, and forbidden claims as the viewer boundary/description.
- At `max-width: 560px`, the comparison becomes a contained, focusable horizontal scroll-snap rail. Cards are `178–220px` wide, preserving the portrait crop while bounding it to about 310px; overflow stays inside the rail and touch panning remains enabled.

## Accessibility and fact checks

- The comparison has `role="region"`, an instructional accessible name, keyboard focus, and a visible focus ring.
- All three overlay triggers retain 44px visible controls and now expose unique accessible names.
- The viewer remains a modal dialog with focus return, Escape close, source fallback, `aria-describedby`, and the source boundary.
- OmniDocBench remains an input/example source only; the UI explicitly rejects MinerU2.5-Pro performance and 296-page Hard-isolation inferences.

## Verification

- `npm test -- src/components/ChapterExperience.test.tsx src/components/ProgressiveChapter.test.tsx src/App.test.tsx src/components/PaperMedia.test.tsx` — PASS, 4 files / 22 tests.
- `npm test` — PASS, 13 files / 51 tests.
- `npm run build` — PASS (`tsc` and Vite; 63 modules transformed).
- `node ..\PaperSkill\paper-skill\scripts\validate-output.js .` — PASS: 6 chapters, 11 active modules, all 11 component IDs registered.
- Focused independent re-review — PASS, no remaining issues.
- Browser visual QA: NOT RUN — no connected browser was used; the 360px result was verified through bounded CSS geometry and DOM/accessibility regression coverage.

## Files changed in Fix 1

- `src/App.tsx`
- `src/App.test.tsx`
- `src/components/DocumentPrimer.tsx`
- `src/components/PaperMedia.tsx`
- `src/components/PaperMedia.test.tsx`
- `src/styles/paper.css`
- this report and the progress ledger

No deployment, PR, Git initialization, or Git mutation performed.
