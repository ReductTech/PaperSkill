# Task 6 Re-review 1

## VERDICT: FAIL

## Remaining finding

1. **MEDIUM — The hash step/module consistency fix does not cover DocumentPrimer.** The repaired chapter helper correctly requires `hashState.stepId === stepId` at `src/App.tsx:174-180`, but the separate `restoredStateFor` at `src/App.tsx:171-173` still checks only `moduleId`, and feeds `DocumentPrimer` at `src/App.tsx:245-252`. Therefore a locked/mismatched hash such as `#step-3/document-primer/formula` scrolls toward the Step 2 locked prompt while also changing the earlier primer from its default `text` state to `formula`. The new locked-hash test at `src/App.test.tsx:111-118` covers an earlier chapter experience (`data-bias`) but not this remaining restoration path. Require both `stepId === 'document-primer'` and `moduleId === 'document-primer'`; add a negative regression for `#step-3/document-primer/formula` and a positive one for `#document-primer/document-primer/formula`.

## Original findings rechecked

- **Finding 1: PARTIAL.** Cross-chapter experience restoration and locked-hash pollution are fixed by `restoredStateForModules(step.id, step.modules)` and the tests at `src/App.test.tsx:75-118`; the DocumentPrimer path above remains inconsistent.
- **Finding 2: RESOLVED.** `src/components/DocumentPrimer.tsx:31,90-96` renders the `omni-output` allowed claim and both forbidden inferences beside the crops. `src/components/PaperMedia.tsx:39,51-64` forwards allowed claim, Figure/source link and boundary text into the modal viewer; the dialog exposes `aria-describedby` and retains Escape/focus return.
- **Finding 3: RESOLVED by static geometry.** At 360px, `src/styles/paper.css:803-820` keeps the rail within the approximately 304px primer content width, uses a 202px card (`56vw`), and yields crop heights of about 280–283px from `src/data/media.ts:15-18`, below the 310px cap. The roughly 634px three-card track scrolls inside the focusable `overflow-x:auto` region with mandatory inline snap; it does not create page-level horizontal overflow or the former 1.5kpx vertical stack. Browser visual QA was not available, so this is not presented as a rendered viewport test.
- **Finding 4: RESOLVED.** `src/components/PaperMedia.tsx:33-46` gives each crop a crop/caption-specific alt and unique viewer-trigger name. `src/components/PaperMedia.test.tsx:5-40` verifies the name, viewer context/source/boundary, Escape close and focus return.

Task 7's compact optional footer is explicitly deferred and is not part of this FAIL verdict; App has no dangling `FurtherLearning` mount.

## Verification evidence

- `npm test -- src/components/ChapterExperience.test.tsx src/components/ProgressiveChapter.test.tsx src/App.test.tsx src/components/PaperMedia.test.tsx` — PASS, 4 files / 22 tests.
- `npm test` — PASS, 13 files / 51 tests.
- `npm run build` — PASS (`tsc`, Vite; 63 modules transformed).
- `node ..\PaperSkill\paper-skill\scripts\validate-output.js .` — PASS: 6 chapters, 11 active modules, all 11 component IDs registered.
