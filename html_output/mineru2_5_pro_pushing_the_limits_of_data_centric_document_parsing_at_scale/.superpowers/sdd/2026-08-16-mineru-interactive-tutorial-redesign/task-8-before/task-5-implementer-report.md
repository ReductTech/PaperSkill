# Task 5 Implementer Report

## Scope

- Added `TrainingTimeline` and `MgamMatchingPuzzle`, their behavior tests, and `experience-training.css`.
- App/registry integration was intentionally left for Task 6; `App.tsx` and `main.tsx` were not changed.
- Appended the Task 5 checkpoint to the redesign progress ledger.

## RED → GREEN evidence

- RED: `npm test -- src/experiences/TrainingTimeline.test.tsx` failed because `./TrainingTimeline` did not exist.
- RED: `npm test -- src/experiences/MgamMatchingPuzzle.test.tsx` failed because `./MgamMatchingPuzzle` did not exist.
- Regression RED: restoring `results-boundary/evidence-open` rendered `partition-3`; the cause was a restore guard limited to `mgam-lab`. The added test failed on missing `合理匹配`, then passed after reconstructing `partition-1` for the secondary-module deep link.
- Replay RED: the control returned to Stage 1 without playing. The extended player test failed on missing `暂停训练过程`, then passed after routing the control through `usePlaybackTimeline.replay()`.
- GREEN: targeted Task 5 suite passes 6/6 tests.

## Verification

- Targeted: `npm test -- src/experiences/TrainingTimeline.test.tsx src/experiences/MgamMatchingPuzzle.test.tsx` — PASS, 2 files / 6 tests.
- Full suite: `npm test` — PASS, 10 files / 28 tests.
- Build: `npm run build` — PASS (`tsc` and Vite production build).
- Validator: `node ..\PaperSkill\paper-skill\scripts\validate-output.js .` — PASS (6 chapters, 11 active modules, all component IDs registered).

## Accessibility

- Player, stage stepping, scrubbing, task selection, prediction merges, and evidence disclosure use native keyboard-operable controls with explicit labels.
- Core buttons, slider, and summary use a 44px minimum target; mobile layouts stack without removing controls.
- Reduced motion disables timed playback while preserving scrub/step access; dynamic stage, score, and ranking feedback uses restrained live regions.

## Facts and boundaries

- Training scale, rollouts, reward names, waterfall endpoints, Base/Hard scores, held-out page count, and comparator values all read from `PAPER_FACTS`.
- Primary Hard evidence uses v2 main-text `94.08 / 92.01 / +2.07`; appendix `92.48 / +1.60` appears only after opening evidence.
- The rounding note distinguishes reported segment sum `+2.72` from endpoint difference `+2.71`. Teaching candidate scores and MGAM blocks are explicitly scoped as demonstrations; the real Markdown comparison is explicitly not an original MGAM example.

## Risks / remaining QA

- Browser visual QA was not run because these isolated components are not mounted by the current App until Task 6; build success is not reported as layout verification.
- Task 6 should visually inspect 1366×768 and 360×800 after registry integration, especially the horizontal training frame and prediction block convergence.
