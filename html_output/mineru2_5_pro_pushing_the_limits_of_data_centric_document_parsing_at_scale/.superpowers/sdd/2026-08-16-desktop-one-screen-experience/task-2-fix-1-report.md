# Task 2 Fix 1 Report — Independent Review M1–M4

Date: 2026-08-16  
Status: fix complete; awaiting independent re-review  
Source review: `task-2-review.md`

## Review evaluation

All four Major findings and both Minor findings reproduced against the current implementation:

- M1: crop offsets assumed a crop-aspect viewport, while fixed slot height changed that viewport ratio.
- M2: the 697px Figure S3 crop was centered inside a wider hotspot containing block.
- M3: `aria-controls` mapped gaps semantically, but the flex row did not map them visually.
- M4: registered paper crops inherited the authored-hotspot `教学示意` label.
- m1: the hidden-chrome fallback promised a source link it did not render.
- m2: the sole visible Step 01 link pointed only to Figure S7 while two crops came from Figure S10.

## RED evidence

Command:

`npm test -- src/components/PaperMedia.test.tsx src/components/PaperFigureCard.test.tsx src/components/DocumentPrimer.test.tsx src/experiences/DataCounterfactual.test.tsx`

Observed: 10 expected failures / 7 passes.

- M1/m1/M4: 3 PaperMedia failures for the missing crop-aspect canvas contract, old fallback wording and wrong crop provenance.
- M2: 1 DocumentPrimer failure for the missing capped common canvas.
- M3/m2 and dependent legacy assertions: 6 DataCounterfactual failures for missing `.gap-chip` column mapping/slot labels and the Figure-S7-only group link.

## Fixes

### M1 — crop-aspect thumbnail canvas

- Added `.paper-media__canvas`.
- Thumbnail canvases are size containers centered with `place-items: center`.
- Crop width is `min(100cqi, 100cqb × crop aspect)`; the crop keeps `aspect-ratio: var(--paper-crop-aspect)`.
- Budget slots size the media/canvas, not the crop viewport.
- The regression hand-checks a 174×192 frame with the 1.411 landscape crop and verifies both axes remain bounded while the aspect ratio is preserved. It also asserts the production CSS container-query contract.

### M2 — shared Figure S3 containing block

- Added a single centered `.primer-figure-canvas` capped at 697px.
- Both the full stage media and the absolute hotspot overlay are direct children of this canvas.
- The overlay uses `inset: 0`; the media crop uses the same 100% inline size.
- PaperMedia chrome is disabled for this grouped figure and its one source link is rendered at group level.
- DOM and CSS contracts verify common parent, cap, centering and identical overlay extent.

### M3 — visual gap-to-slot mapping

- Replaced the flex row with the same six-column desktop grid.
- Gap chips explicitly occupy columns 4, 5 and 6 and contain visible `槽位 4/5/6` labels.
- Mobile collapses the three chips into a compact three-column row; the visible slot number preserves the mapping independent of horizontal rail position.

### M4 — paper-crop provenance

- Extended `PaperFigureHotspot` with optional `paper-original|teaching` provenance.
- Registered PaperMedia crops are marked `paper-original`.
- Crop-first dialogs now display `论文原图节选 · 局部`.
- Authored PaperFigureCard hotspots without paper-crop provenance retain `教学示意`.

### Minor fixes

- Thumbnail/image fallback is neutral: it asks the learner to continue with page text and no longer promises retained source chrome.
- Centralized `OMNIDOCBENCH_PAPER_URL` in the media registry and uses the generic paper URL for Step 01's sole visible `来源：OmniDocBench（论文总览）` link. Crop dialogs retain their precise Figure S7/S10 anchors.

## Fresh verification

- Task 2 targeted suite: PASS — 6 files / 38 tests.
- Full suite: PASS — 17 files / 82 tests.
- `npm run build`: PASS — TypeScript + Vite, 65 modules transformed.
- Official PaperSkill validator: PASS — 6 chapters, 11 active modules, all 11 component IDs registered.
- Changed-JSX nested-interactive scan: 0 direct patterns; manual structure check confirms hotspots remain siblings of PaperMedia and budget slots remain non-interactive containers.
- Non-registry OmniDocBench PDF URL scan: 0 production matches.
- No new external images, runtime APIs, dependencies, Bilibili changes, Git operations, PR, deployment or PaperSkill template changes.

Browser visual QA: NOT RUN — no browser connection available

