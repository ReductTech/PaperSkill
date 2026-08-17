# Task 2 Implementer Report — Bounded Media, Figure S3 Primer, Step 01 Budget Strip

Date: 2026-08-16  
Status: implementation complete; awaiting independent review  
Scope: `mineru2_5_pro_output` only

## Implemented

- Added shared `PaperMediaVariant` and `PaperMediaViewerMode` contracts while preserving the legacy `card/full` defaults.
- Added the exact `omni-table/mergedCellTable` crop (`65/46/33/38`) and registry-wide finite/positive/in-bounds geometry checks. Its effective aspect ratio is approximately 1.411.
- Added stable media data attributes, bounded `stage` and `thumbnail` variants, viewer suppression, and crop-first viewing with `查看整图` / return-to-crop behavior.
- Kept PaperFigureViewer Escape, focus restoration, direct crop-first entry, full-image entry, source link, failure fallback and fact-boundary behavior covered.
- Replaced the three portrait Figure S3 cards with one complete horizontal `omni-output` stage, three focusable sibling hotspots, one live explanation, one source link and one OmniDocBench boundary.
- Rebuilt Step 01 as six stable budget slots. The baseline is six CSS/HTML single-column pages marked `教学示意`; automatic/manual long-tail states replace slots 4–6 with real `formula`, `mergedCellTable`, and `tripleColumn` crops.
- Kept preview and persistence separate: automatic preview never calls `onStateChange` or `onComplete`; both strategy buttons start unpressed; only a manual long-tail choice completes once.
- Kept glossary-attention pause, IntersectionObserver start, reduced-motion terminal frame, restored state, stable hash callbacks, 44px actions and local mobile scroll-snap behavior.
- Kept `+2.71` explicitly attributed to the complete data/training pipeline and the OmniDocBench excerpts explicitly outside MinerU training/296-page-Hard/performance-evidence claims.

## RED → GREEN evidence

### RED 1 — media primitives

Command:

`npm test -- src/data/media.test.ts src/components/PaperMedia.test.tsx src/components/PaperFigureCard.test.tsx`

Observed: 5 expected failures / 6 passes. Missing crop, missing media data/variant/viewer behavior, and old viewer toggle text caused the failures.

GREEN: 3 files / 11 tests passed.

### RED 2 — Figure S3 primer

Commands:

`npm test -- src/components/DocumentPrimer.test.tsx src/App.test.tsx`

After correcting the test fixture to use the real GlossaryProvider, observed expected failures because the old primer rendered three cropped media figures and had no region controls.

GREEN: 2 files / 18 tests passed.

### RED 3 — Step 01

Command:

`npm test -- src/experiences/DataCounterfactual.test.tsx`

Observed: 2 expected failures / 4 passes because the old two-lane implementation had no six-slot budget strip or three real tail crops.

GREEN: 1 file / 6 tests passed.

## Fresh final verification

- Task 2 targeted suite: PASS — 6 files / 35 tests.
- Full suite: PASS — 17 files / 79 tests.
- `npm run build`: PASS — TypeScript and Vite, 65 modules transformed.
- Official PaperSkill validator: PASS — 6 chapters, 11 active modules, all 11 component IDs registered.
- Nested interactive inspection: PASS for changed JSX. Figure S3 hotspots are siblings of PaperMedia; budget slots are non-interactive containers; PaperMedia trigger/source are siblings and no button contains another button/link.
- No new remote images, runtime APIs, dependencies, Bilibili changes, Git operations, PR, deployment or PaperSkill template changes.

Browser visual QA: NOT RUN — no browser connection available
