# Task 2 Independent Review

Date: 2026-08-16  
Reviewer scope: read-only review of Task 2 production files/tests plus fresh verification  
Verdict: **FAIL**

## Summary

The data contracts, crop registry, viewer state transitions, six-slot DOM stability, callback separation, Figure S3 consolidation, full test suite, production build, and PaperSkill validator all pass. However, four user-visible requirements are not met. Two CSS geometry errors make the new real-media interactions visually incorrect even though the DOM assertions pass.

## Critical findings

None.

## Major findings

### M1. Thumbnail sizing breaks the crop transform, so the merged-cell example can render mostly blank

- Files: `src/styles/experience-foundation.css:16-17`, `src/styles/experience-data.css:12-15`, `src/components/PaperMedia.tsx:17-26`
- `cropStyle()` calculates image offsets for a viewport whose aspect ratio equals the crop's aspect ratio. The thumbnail rules then replace that aspect ratio with a fixed/equal-height frame (`aspect-ratio: auto`, later `height: 100%`). `object-fit: contain` cannot repair this because the image remains absolutely positioned with a generated oversized width and `height: auto`.
- At a representative desktop slot of about 174×192, `mergedCellTable` has a true crop ratio of about 1.41 but the slot ratio is about 0.91. The generated CSS top is about `-232px`; the correct source-image offset at that scale is about `-149px`. The image bottom therefore lands around 92px inside a 192px frame, leaving roughly half of the thumbnail blank and omitting much of the requested crop.
- This violates the approved requirement that a thumbnail show the complete crop and directly undermines the new Step 01 real-table example.
- Required fix: keep the crop viewport at `var(--paper-crop-aspect)` inside a bounded thumbnail frame (center it and cap its dimensions), or implement a separate thumbnail transform that accounts for the actual fixed frame. Add a CSS/geometry regression for the landscape crop instead of checking only `data-crop-id`.

### M2. Figure S3 hotspots are positioned against the full stage, not the centered 697px image

- Files: `src/styles/paper.css:293-301`, `src/components/DocumentPrimer.tsx:87-106`
- The real image is centered and capped at 697px, while `.primer-figure-hotspots` spans the full `.primer-figure-stage`. On a roughly 1184px inner desktop stage, the original-PDF hotspot occupies approximately x=30–397, but the actual original-PDF region is approximately x=261–477. Output A and B are similarly displaced and oversized.
- The current test checks only that three sibling buttons exist and update copy; it does not establish that clicking a visible image region selects that region.
- This violates the three-hotspot Figure S3 contract and makes the desktop interaction misleading.
- Required fix: cap and center a common media-plus-overlay wrapper at the same width, or mount the overlay over the `.paper-crop` box itself. Add a desktop CSS geometry contract ensuring overlay and crop share the same containing block.

### M3. The three gap labels do not visually map to slots 4, 5, and 6

- Files: `src/experiences/DataCounterfactual.tsx:167-170`, `src/styles/experience-data.css:22`
- The labels correctly expose `aria-controls="budget-slot-4/5/6"`, but the desktop layout is a left-aligned flex row. Visually, the labels begin under the first slots rather than under the three replaced long-tail slots.
- This fails the approved one-to-one visual mapping requirement; the mapping currently exists only in accessibility metadata.
- Required fix: use the same six-column grid as the budget strip and place the labels in columns 4, 5, and 6. Preserve a compact mobile mapping with explicit slot numbers or paired labels.

### M4. Crop-first views relabel paper-original crops as "教学示意"

- Files: `src/components/PaperFigureCard.tsx:127`, `src/components/PaperMedia.tsx:50-58,81-95`
- `PaperMedia viewer="crop"` creates a hotspot from a registered paper crop and passes `provenance="paper-original"`. `PaperFigureViewer` nevertheless labels every active cropped hotspot as `教学示意`.
- For Step 01, the formula/table/layout crop itself is a paper excerpt; only the tutorial's explanation/selection is teaching material. The dialog therefore contradicts the visible group provenance and weakens the required paper-fact/teaching boundary.
- Required fix: distinguish paper-crop hotspots from teaching annotation hotspots (for example with hotspot provenance), and render `论文原图节选 · 局部` for the former while retaining teaching labels for authored overlays.

## Minor findings

### m1. The thumbnail error message claims a retained source link that the thumbnail intentionally omits

- Files: `src/components/PaperMedia.tsx:59,67-80`
- With `variant="thumbnail"` and `viewer={false}`, the fallback says the source link is retained, but `showChrome` removes that link from the component. A surrounding group may provide a source, but `PaperMedia` does not guarantee it.
- Use neutral fallback wording or provide an explicit accessible group-source relationship.

### m2. Step 01's sole visible group source points to Figure S7 although two thumbnails come from Figure S10

- Files: `src/experiences/DataCounterfactual.tsx:10,186-188`, `src/data/media.ts:117-162`
- The boundary correctly names Figure S7/S10, and the crop dialogs contain exact links, but the single visible group source is taken only from `omni-layout` (page 19 / Figure S7). A generic OmniDocBench paper source would avoid implying that the formula/table excerpts are on that page.

## Test-quality assessment

- `PaperMedia.test.tsx` covers default/full behavior, crop-first toggling, Escape, and focus restoration well.
- `media.test.ts` correctly validates finite/positive/in-bounds crop geometry and the required 1.4 landscape ratio.
- `DataCounterfactual.test.tsx` correctly covers stable six-slot nodes, initial double-false state, preview callback isolation, manual mutual exclusion, completion-once behavior, and all three asset/crop IDs.
- `DocumentPrimer.test.tsx` correctly covers a single full Figure S3, three sibling controls, one live explanation, one source, and one boundary.
- The principal false-positive gap is visual geometry: the tests prove DOM identity and state changes, but not that the crop is visible inside the frame or that hotspots/labels align with what the user clicks.
- Changed production/test files remain inside the Task 2 allow-list; the added `DocumentPrimer.test.tsx` is expected. No nested button/link pattern was found in the changed JSX, and App/Task 1 regressions stayed green.

## Fresh verification evidence

1. Targeted suite:
   - `npm test -- src/data/media.test.ts src/components/PaperMedia.test.tsx src/components/PaperFigureCard.test.tsx src/components/DocumentPrimer.test.tsx src/experiences/DataCounterfactual.test.tsx src/App.test.tsx`
   - PASS: 6 files, 35 tests.
2. Full suite:
   - `npm test`
   - PASS: 17 files, 79 tests.
3. Production build:
   - `npm run build`
   - PASS: TypeScript + Vite, 65 modules transformed.
4. Official validator:
   - `node ..\PaperSkill\paper-skill\scripts\validate-output.js .`
   - PASS: 6 chapters, 11 active modules, all 11 component IDs registered.
5. Static changed-JSX scan found no nested interactive controls or newly added runtime image/API fetches.

Browser visual QA: NOT RUN — no browser connection available

