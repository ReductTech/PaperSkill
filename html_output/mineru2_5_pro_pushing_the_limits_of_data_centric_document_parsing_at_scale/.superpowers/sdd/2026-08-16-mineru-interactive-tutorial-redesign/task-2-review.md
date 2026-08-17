# Task 2 independent review

## VERDICT: FAIL

## Findings

1. **Major — `PaperFigureCard` viewer lost existing source/boundary and context content.** `src/components/PaperFigureCard.tsx:114-122` now renders only the image, generic label/copy, and hotspot controls. The controlled-viewer contract at `:29-39` has no `sourceHref`, `intro`, `provenance`, or boundary props, and the call at `:146` cannot supply them. This regresses the prior card viewer's accessible boundary (`aria-describedby`), provenance-aware label, introductory guidance, source link, and image-error fallback (Task 2 snapshot `task-2-before/src/components/PaperFigureCard.tsx:266-379`). Restore those behaviours or extend the viewer contract so `PaperFigureCard` remains behaviourally equivalent.

2. **Major — visibility handling pauses on every visibility event, including a visible document.** `src/hooks/usePlaybackTimeline.ts:92-98` calls `pause()` when `playingRef.current` is true (`document.hidden || playingRef.current`); while playing, that is always true. The requirement is to pause *on `document.hidden`*. A foreground `visibilitychange` therefore stops playback incorrectly. Use only the hidden condition and add a test with `document.hidden === false` proving playback continues.

3. **Major — the required non-Git progress checkpoint is not in the designated ledger.** The plan names `docs/superpowers/progress/2026-08-16-mineru-interactive-tutorial-redesign.md` as the checkpoint ledger (plan:14,54), but its only entry is Task 1 (`docs/.../progress/...md:3`). Task 2 was recorded only in the private review-transport ledger (`.superpowers/sdd/.../ledger.md:5`), so the Task 2 brief's checkpoint requirement is unmet.

## Verification and checklist

- `npm test -- src/components/PaperMedia.test.tsx src/hooks/usePlaybackTimeline.test.tsx` — PASS (2 files, 3 tests).
- `npm run build` — PASS.
- `node ..\\PaperSkill\\paper-skill\\scripts\\validate-output.js .` — PASS.
- PaperMedia crop math, local image, label/source preservation on preview-image error, portal, Escape, focus return, body lock, desktop centering/mobile sheet, visible focus/reduced-motion/44px PaperMedia controls: present by source inspection. PaperFigureCard regression above prevents approval.
- Playback has rAF, clamps, beats, reduced-motion listener, and unmount cancellation; its single test does not exercise clamp extremes, stepping, reduced motion, cleanup, focus trap, or body lock, and its generic visibility event masks finding 2.
- Diff is confined to Task 2-owned implementation/test/style files plus progress artifacts; no source-scope overreach found. `task-reviewer-prompt.md` was not present anywhere in the workspace.
