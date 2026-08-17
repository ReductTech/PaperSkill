# Task 6 Implementer Report

## Outcome

Task 6 integrates the six dedicated chapter experiences into the progressive tutorial. The runtime keeps the six chapter and eleven module data/registry contracts, but no longer mounts the old `StepConceptVisual`, `LearningLab`, `RealDocumentCases`, standalone `PaperFigureCard`, `EvidencePanel + CheckpointCard`, or legacy video-task surfaces from `App`.

## RED → GREEN evidence

- Baseline before Task 6: `npm test` — 10 files, 31 tests passed.
- RED 1: `npm test -- src/components/ChapterExperience.test.tsx` failed because `experiences/registry`, `ChapterExperience`, and `ChapterEvidence` did not exist.
- GREEN 1: the registry/adapter/evidence and unlock suites passed 7/7 after the minimal implementation.
- RED 2: `ProgressiveChapter.test.tsx` failed because an incomplete chapter could still unlock the next chapter; the button was not disabled and had no explanation.
- RED 3: the first App regression run failed 3/3 because there was no chapter experience, no inline original/output crop comparison, and progress still counted legacy experiments.
- Audit RED: three additional App tests failed because the unlocked final page mounted the old video task, reset left chapter tokens behind, and malformed percent-encoded hashes threw `URIError`.
- Final GREEN: Task 6 targeted tests passed 16/16; the full suite passed 47/47.

## Integration changes

- Added an exact ordered six-step `chapterExperienceRegistry` and a validating, title-free thin adapter.
- Each unlocked chapter mounts exactly one `ChapterExperience`; App-level legacy experiment/card renderers were removed without deleting the eleven old module definitions or widget registrations.
- Each chapter mounts one initially closed `ChapterEvidence`; standalone checkpoint cards are gone.
- `DocumentPrimer` now contains the `omni-output` `originalPdf`, `outputA`, and `outputB` crops in its existing task section. The former independent real-case gallery is not mounted.
- Header progress now counts six `chapter:<stepId>` completion tokens. Module interactions remain stored by stable component ID.
- The old `FurtherLearning` implementation is intentionally not mounted because it contains independent video tasks, self-checks, progress, reset, and persistence. Task 7 must replace it with the specified compact optional footer before re-mounting the three resources.

## Hash and unlock behavior

- Restoration searches a chapter's `modules` strictly by `componentId`; display IDs such as `2.2` are never rewritten into hash state.
- Experience callbacks preserve hashes as `#<step>/<componentId>/<state>`.
- Locked hashes still land on the next available locked prompt and do not bypass sequential unlock.
- Continue is enabled only when the current experience completed or saved unlock progress already contains the next chapter. Disabled controls expose `完成本章主操作后继续` through visible and accessible description text.
- Reset now clears both sequential unlock state and all module/chapter progress tokens; malformed hashes are ignored safely.

## Accessibility and fact boundary audit

- Native disabled buttons, `aria-describedby`, closed native disclosures, keyboard-capable experience controls, and local-image fallbacks remain intact.
- Chapter headings, badges, problem copy, and evidence continue using the shared glossary affordance at learner-facing occurrences.
- Entry crops retain `论文原图节选` labels, direct source links, and the OmniDocBench limitation; the experiences retain paper/teaching/research provenance and do not add unsupported paper claims.
- Browser visual QA: NOT RUN — Task 6 verification was automated; viewport QA remains a later task.

## Verification

- `npm test -- src/components/ChapterExperience.test.tsx src/components/ProgressiveChapter.test.tsx src/App.test.tsx` — PASS, 3 files / 16 tests.
- `npm test` — PASS, 13 files / 47 tests.
- `npm run build` — PASS (`tsc` and Vite production build, 63 modules transformed).
- `node ..\PaperSkill\paper-skill\scripts\validate-output.js .` — PASS: 6 chapters, 11 active modules, all 11 component IDs registered.

## Risks / deferred ownership

- Task 7 owns the compact Bilibili/resource footer. Until that replacement is implemented, `FurtherLearning` remains in source but deliberately unmounted, so no independent video/progress mode appears in App.
- Task 5's accepted checkpoint deliberately completes MGAM at `partition-1` and keeps its appendix discrepancy in an internal folded evidence disclosure. Both live in a Task 5-owned experience file and were not changed during this Task 6-only integration; reconcile them with the broader design wording only through an explicit cross-task decision.
- No deployment, PR, Git initialization, or Git mutation was performed.

## Changed files

- Created: `src/experiences/registry.tsx`, `src/components/ChapterExperience.tsx`, `src/components/ChapterEvidence.tsx`, `src/components/ChapterExperience.test.tsx`, `src/components/ProgressiveChapter.test.tsx`, `src/App.test.tsx`.
- Modified: `src/App.tsx`, `src/components/DocumentPrimer.tsx`, `src/components/ProgressiveChapter.tsx`, `src/components/EvidencePanel.tsx`, `src/styles/paper.css`, and this progress/report documentation.
