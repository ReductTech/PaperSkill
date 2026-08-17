# Task 6 Independent Review

## VERDICT: FAIL

## Findings

1. **HIGH — Hash restoration does not verify that the step and module belong together.** `src/App.tsx:174-179` searches every rendered chapter only by `hashState.moduleId` and never compares `hashState.stepId` with the chapter being rendered. With Step 2 already unlocked, `#step-1/element-ddas/formula` scrolls to Step 1 but restores Step 2's microscope to Formula; similarly, a locked-chapter hash can mutate an earlier unlocked experience if it names that earlier module. This violates the `#<step>/<module>/<state>` contract and makes malformed-but-decodable hashes semantically unsafe. Pass the current step ID into the helper and require both IDs to match; add mismatched-step/module and locked-hash regression cases. `src/App.test.tsx:75-96` currently tests only a consistent hash and a locked hash whose module is also in the locked chapter.

2. **MEDIUM — The DocumentPrimer crops expose a source but not the required OmniDocBench fact boundary.** `src/components/DocumentPrimer.tsx:62-80` renders only label/caption props, while `src/components/PaperMedia.tsx:34-44` exposes the image, a generic full-image viewer and source link but never renders `allowedClaim` or `forbiddenClaims`. Consequently the two explicit restrictions in `src/data/media.ts:32-35` are data-only and absent beside these entrance crops, contrary to the design's same-screen boundary rule and the implementer report's claim that the OmniDocBench limitation was retained. Render a concise shared boundary beside the three-image comparison (and retain it or a source/boundary description in the viewer).

3. **MEDIUM — The mobile rule turns the three portrait crops into a very long prelude before the primer interaction.** `src/styles/paper.css:288-290,765` stacks all three figures into one column but preserves each crop's portrait aspect ratio. At the 360px layout, the approximately 304px content width and `originalPdf` ratio from `src/data/media.ts:15-18` yield roughly 425px of image height per crop before labels, captions, source links and gaps—more than 1.5kpx for the group, pushing `.document-demo` far below the 800px viewport. Use a compact horizontal/snap comparison, tabs, or a bounded mobile crop height. This is static CSS geometry; an in-app browser was unavailable, so it is not reported as visual QA.

4. **MEDIUM — The three crop viewer controls have indistinguishable accessible names.** Every `PaperMedia` uses the fixed `aria-label="查看完整图片"` at `src/components/PaperMedia.tsx:39`; DocumentPrimer therefore presents three same-named buttons although they open different original/output views, and all three cropped images inherit the same full-composite alt text at `:38`. Include the caption/crop label in each trigger name and provide crop-specific accessible image text. The existing App test at `src/App.test.tsx:34-40` checks only visible captions, not control names.

## Confirmed requirements

- Exact ordered six-step experience registry and thin, title-free adapter are present (`src/experiences/registry.tsx:10-25`; `src/components/ChapterExperience.tsx:4-12`). App statically mounts exactly one `ChapterExperience` and one closed native-details `ChapterEvidence` per unlocked chapter; the default route renders only Step 1.
- `App` no longer mounts `StepConceptVisual`, `LearningLab`, `RealDocumentCases`, standalone `PaperFigureCard`, `CheckpointCard`, or `FurtherLearning`; Task 7's compact resource footer is correctly treated as deferred, and there is no dangling App reference or independent demo mode.
- The official tutorial data remains 6 chapters / 11 modules and the old widget registry still explicitly registers all 11 component IDs. Chapter completion uses `chapter:<stepId>`, header progress counts 6 chapters, and reset clears sequential unlocks plus module/chapter token progress (`src/App.tsx:135-150,169-170,267-288,319-323`).
- `ProgressiveChapter` gates next unlock on meaningful completion, permits saved-next continuation, focuses the destination, and gives the incomplete final chapter an explicit prompt (`src/components/ProgressiveChapter.tsx:54-63,87-101,146-169`). Native disabled/description semantics and closed evidence disclosures are correct. Glossary affordances remain inline in chapter-facing title/problem/evidence copy.
- Percent-decoding failures return safely and locked hashes do not mount/bypass the locked experience (`src/App.tsx:30-40,67-85`; `src/components/ProgressiveChapter.tsx:103-134`). The cross-step consistency defect above remains.

## Verification evidence

- `npm test -- src/components/ChapterExperience.test.tsx src/components/ProgressiveChapter.test.tsx src/App.test.tsx` — PASS, 3 files / 16 tests.
- `npm test` — PASS, 13 files / 47 tests.
- `npm run build` — PASS (`tsc`, Vite; 63 modules transformed).
- `node ..\PaperSkill\paper-skill\scripts\validate-output.js .` — PASS: 6 chapters, 11 active modules, all 11 component IDs registered.
- Browser visual QA — NOT RUN: no browser instance was available; mobile observations above are explicitly static CSS review.
