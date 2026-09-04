# Task 2 Brief — Bounded Media, Figure S3 Primer, and Step 01 Budget Strip

## Objective

Replace unbounded portrait media with explicit display semantics, turn the entry Figure S3 into one compact horizontal figure with three explainable regions, and rebuild Step 01 as a six-slot fixed-budget counterfactual. Follow RED → GREEN TDD. Do not commit, deploy, initialize Git, or modify PaperSkill templates.

## Required reading

- `docs/superpowers/specs/2026-08-16-desktop-one-screen-experience-design.md`
- `docs/superpowers/plans/2026-08-16-desktop-one-screen-experience.md`
- `superpowers:test-driven-development` and `superpowers:verification-before-completion`
- Current `types.ts`, media registry/tests, PaperMedia/PaperFigureCard and tests, DocumentPrimer, DataCounterfactual and related CSS/App tests.

## Allowed files

- `src/types.ts`
- `src/data/media.ts`, `src/data/media.test.ts`
- `src/components/PaperMedia.tsx`, `src/components/PaperMedia.test.tsx`
- `src/components/PaperFigureCard.tsx`, `src/components/PaperFigureCard.test.tsx`
- `src/components/DocumentPrimer.tsx`, new `src/components/DocumentPrimer.test.tsx`
- `src/experiences/DataCounterfactual.tsx`, `src/experiences/DataCounterfactual.test.tsx`
- `src/styles/experience-foundation.css`, `src/styles/experience-data.css`, `src/styles/paper.css`
- `src/App.test.tsx`
- task report and progress checkpoint only.

Do not edit DDAS selectors/behavior in `experience-data.css`; Task 3 owns them.

## Interface contract

Add:

```ts
export type PaperMediaVariant = 'card' | 'stage' | 'thumbnail';
export type PaperMediaViewerMode = 'full' | 'crop' | false;
```

`PaperMedia` accepts `variant`, `viewer`, optional label/caption/className and keeps old defaults (`card`, `full`). Root exposes stable `data-asset-id`, `data-crop-id`, and `data-variant`.

- `viewer={false}` renders no viewer trigger.
- `viewer="crop"` opens the current crop first through the existing PaperFigureViewer hotspot mechanism and can switch to the whole image and back.
- `thumbnail` is compact and omits repeated source/caption chrome; an enclosing group provides one source/boundary.
- `stage` is bounded and contained, never expanded without a height cap.
- Preserve Escape, focus trap/restoration, error fallback, full-image default behavior, and media fact boundaries.

Add `omni-table.crops.mergedCellTable` exactly:

```ts
{ x: 65, y: 46, width: 33, height: 38, label: '合并单元格表格' }
```

All crop values must be finite, positive, and remain inside 0–100 bounds. The crop's effective aspect ratio for 1040×640 must be at least 1.4.

## RED 1 — media primitives

Write tests before production changes:

1. Validate every registered crop's geometry and the new landscape merged-cell crop.
2. `thumbnail + viewer={false}` has accessible media content but no viewer button/dialog.
3. `viewer="crop"` opens the named crop, provides “查看整图”, returns to the crop, closes with Escape, and restores focus.
4. Preserve direct PaperFigureViewer initial-hotspot/full-image regression coverage.

Run and record the expected failures:

```powershell
npm test -- src/data/media.test.ts src/components/PaperMedia.test.tsx src/components/PaperFigureCard.test.tsx
```

Then implement the smallest GREEN solution.

## RED 2 — compact Figure S3 primer

Write `DocumentPrimer.test.tsx` and update App regression tests first:

- exactly one `.paper-media[data-asset-id="omni-output"]`, with no crop ID;
- complete horizontal Figure S3, not three portrait crops;
- three focusable controls named “查看原始 PDF 区域 / 查看输出 A 区域 / 查看输出 B 区域” update one `aria-live` explanation;
- one group source and one visible OmniDocBench boundary;
- no three repeated per-card captions/source rows;
- keep existing `text|formula|table|layout` restoration and document-parsing interaction;
- keep the named local scroll region where useful, but at desktop bound the complete figure to roughly 320–360px; mobile overflow may be local only.

Run RED, then GREEN:

```powershell
npm test -- src/components/DocumentPrimer.test.tsx src/App.test.tsx
```

Hotspot controls must be siblings of the media viewer trigger; never nest buttons.

## RED 3 — Step 01 six-slot budget strip

Write behavior tests first:

- exactly six stable budget slots in every phase;
- before manual choice, both strategy buttons have `aria-pressed=false`;
- ordinary mode uses six compact CSS/HTML single-column pages labeled “教学示意”, not a real double-column asset;
- automatic preview really replaces fixed slots with `omni-table/formula`, `omni-table/mergedCellTable`, and `omni-layout/tripleColumn` or `complexLayout`; tests assert asset/crop IDs, not only text;
- automatic preview never calls `onStateChange` or `onComplete`;
- manual ordinary/tail choices are mutually exclusive;
- tail choice exposes all three real crop thumbnails and their crop viewers;
- only one group source link and one OmniDocBench boundary;
- completion fires once only for the semantic long-tail choice; the `+2.71` claim remains explicitly attributed to the full data/training pipeline.

Run RED, then GREEN:

```powershell
npm test -- src/experiences/DataCounterfactual.test.tsx
```

Implementation constraints:

- initialize manual `choice` as `null`; preview state is separate;
- keep six slot DOM nodes stable and swap content;
- three gap labels must visibly map to the three real slots;
- desktop stage total height roughly 260–300px; mobile uses local horizontal scroll-snap without body overflow;
- retain IntersectionObserver, reduced-motion immediate stable state, glossary-attention pause, manual takeover, stable hash restoration, and accessible 44px controls.

## Fact and media boundaries

- Ordinary pages are teaching diagrams.
- Formula/table/layout crops are OmniDocBench paper excerpts.
- They illustrate document complexity only and must never be called MinerU2.5-Pro training samples, the 296-page Hard subset, or performance evidence.
- Do not hardcode source URLs outside the central registry.
- Do not add remote images, APIs, dependencies, or modify Bilibili assets.

## Final verification and report

Run:

```powershell
npm test -- src/data/media.test.ts src/components/PaperMedia.test.tsx src/components/PaperFigureCard.test.tsx src/components/DocumentPrimer.test.tsx src/experiences/DataCounterfactual.test.tsx src/App.test.tsx
npm test
npm run build
node ..\PaperSkill\paper-skill\scripts\validate-output.js .
```

Also inspect rendered JSX for nested interactive controls. Write `.superpowers/sdd/2026-08-16-desktop-one-screen-experience/task-2-implementer-report.md`, append the progress checkpoint, and explicitly record browser visual QA as NOT RUN if no connected in-app browser exists.
