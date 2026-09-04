# Task 3 implementation report

## RED / GREEN

- RED: added interaction tests before either experience existed; `npm test -- src/experiences/DataCounterfactual.test.tsx src/experiences/DdasMicroscope.test.tsx` failed because both imports were unresolved.
- RED: added reduced-motion coverage; it failed because the six-second preview still waited for a timer.
- GREEN: implemented both components and the minimal reduced-motion branch. The fresh targeted run passed 5 tests.

## Verification

- Tests: `npm test -- src/experiences/DataCounterfactual.test.tsx src/experiences/DdasMicroscope.test.tsx` — 2 files, 5 tests passed.
- Build: `npm run build` — exited 0.
- Validator: `node ..\PaperSkill\paper-skill\scripts\validate-output.js .` — PASS (6 chapters, 11 active modules registered).

## Accessibility and interaction

- The counterfactual's automatic six-second preview changes only local visual state; it neither reports state nor completes. Reduced motion shows its static endpoint immediately.
- The microscope has pointer-normalized lens coordinates, 5% arrow-key movement, Enter page selection, visible status text, 44px desktop controls, and alternate 52px mobile controls.
- Figure 3 stays inside one `figure-3-canvas`; page/element crops are conditionally switched rather than reserving a hidden layout slot.

## Fact boundary and risks

- All imagery comes from `MEDIA_ASSETS` through `PaperMedia` or its local source. Figure S7 is explicitly limited to layout examples, not MinerU2.5-Pro training/performance evidence; +2.71 is attributed only to the complete data-and-training flow. DDAS repeats the disclosed 512-dimensional ViT-base and about-60M candidate facts, while stating K and sampling weights are undisclosed.
- Browser visual QA was not run because no browser connection was available. Integration into the Step 1/2 registry, hash restoration, and progressive unlock remains Task 6 work.
