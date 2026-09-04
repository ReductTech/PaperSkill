# Task 2 Fix 1 Independent Re-review

Date: 2026-08-16  
Scope: `task-2-review.md` M1–M4 and m1–m2 only; production source/tests reviewed without implementation edits  
Verdict: **PASS**

## Finding closure

### M1 — thumbnail crop geometry: CLOSED

- `PaperMedia` now separates the bounded frame (`.paper-media__canvas`) from the crop-aspect viewport (`.paper-crop`).
- In the Step 01 production cascade, the budget slot gives the media/canvas a definite width and height; the thumbnail crop then uses `min(100cqi, 100cqb × crop aspect)` and retains `aspect-ratio: var(--paper-crop-aspect)`.
- For the representative 174×192 frame and the 1.411 merged-cell crop, the resulting viewport is approximately 174×123.3. Both axes stay inside the frame. Because the viewport aspect again equals the registered crop aspect, the existing generated `left/top/width` transform is mathematically consistent and no longer produces the former blank lower half.
- The canvas owns `overflow: hidden`, while the crop owns the source transform and viewer trigger. The later Step 01 CSS sizes only `.paper-media` and `.paper-media__canvas`; it no longer forces `.paper-crop` to `height: 100%`.
- Mobile retains a locally bounded grid/scroll-snap rail with a 166px minimum track; the same canvas fit formula prevents either portrait or landscape crops from escaping the slot.
- Regression coverage now checks both the crop math and the production CSS/container-query contract instead of only asset/crop IDs.

### M2 — Figure S3 hotspot geometry: CLOSED

- `DocumentPrimer` now places the chrome-free `PaperMedia` and `.primer-figure-hotspots` as direct siblings inside one `.primer-figure-canvas`.
- That canvas is `position: relative`, centered, and capped with `inline-size: min(100%, 697px)`; the media canvas/crop fills it and the overlay uses `inset: 0`.
- Therefore the percentage hotspot coordinates are evaluated against the same box as the complete Figure S3 image at desktop widths. The previous 1184px-overlay versus 697px-image mismatch is removed.
- Mobile gives both the stage and canvas the same 620px local scroll width, so the overlay remains aligned while page-level overflow is avoided.
- The group renders one source link and one separate visible fact boundary; hotspot buttons remain siblings of the PaperMedia viewer trigger rather than nested controls.

### M3 — gap-to-slot mapping: CLOSED

- Desktop gaps use the same six-column grid and explicitly assign the three chips to columns 4, 5, and 6.
- Each chip also includes visible `槽位 4/5/6` text and retains the matching `aria-controls` target.
- At `max-width: 760px`, the chips become a compact three-column row and their explicit slot numbers preserve the mapping independently of the horizontally scrolling six-slot rail.

### M4 — paper crop versus teaching provenance: CLOSED

- `PaperFigureHotspot` now carries optional `paper-original | teaching` provenance.
- Registered `PaperMedia` crops are marked `paper-original`, and crop-first dialogs display `论文原图节选 · 局部`.
- Authored hotspots without paper-crop provenance continue to display `教学示意`; the direct viewer regression covers this path.
- The crop dialog still supports whole-image toggle/return, Escape close, and focus restoration.

### m1 — misleading thumbnail fallback: CLOSED

- The fallback now neutrally says to continue with the page's text explanation and no longer promises source chrome that a thumbnail intentionally omits.

### m2 — incomplete group source: CLOSED

- `OMNIDOCBENCH_PAPER_URL` is centralized in `src/data/media.ts`.
- Step 01's sole visible group source now links to the generic OmniDocBench paper URL and is labeled `论文总览`; the individual crop viewers retain exact Figure S7/S10 page anchors.
- A production scan found no duplicated non-registry OmniDocBench PDF URL.

## Regression and scope review

- Legacy `PaperMedia` defaults remain `card/full`; `viewer={false}`, crop-first entry, full-image entry, fallback, Escape, focus trap/restoration, and source/fact boundaries remain covered.
- Figure S3 remains one complete horizontal image with three controls and one live explanation.
- Step 01 still keeps six stable slot nodes, initial double-false buttons, preview/persistence separation, manual mutual exclusion, completion-once semantics, the three real crops, one group source, and one boundary.
- No nested button/link structure or new runtime fetch/API was found in the changed JSX.
- App/Task 1 regressions remain green; the official validator still reports six chapters, eleven active modules, and all eleven component registrations.

## Fresh verification evidence

1. Task 2 targeted suite:
   - `npm test -- src/data/media.test.ts src/components/PaperMedia.test.tsx src/components/PaperFigureCard.test.tsx src/components/DocumentPrimer.test.tsx src/experiences/DataCounterfactual.test.tsx src/App.test.tsx`
   - PASS: 6 files, 38 tests.
2. Full suite:
   - `npm test`
   - PASS: 17 files, 82 tests.
3. Production build:
   - `npm run build`
   - PASS: TypeScript + Vite, 65 modules transformed.
4. Official validator:
   - `node ..\PaperSkill\paper-skill\scripts\validate-output.js .`
   - PASS: 6 chapters, 11 active modules, all 11 component IDs registered.
5. Built CSS inspection confirms the thumbnail container-query rules, 697px Figure S3 canvas, zero-inset overlay, and gap column assignments survive Vite production output.

Browser visual QA: NOT RUN — no browser connection available

