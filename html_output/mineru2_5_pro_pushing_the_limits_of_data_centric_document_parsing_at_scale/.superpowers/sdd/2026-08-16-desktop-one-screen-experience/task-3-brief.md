# Task 3 Brief — Functional DDAS Microscope

## Objective

Replace the decorative Step 02 cursor with a real, accessible three-level DDAS microscope: candidate space → selected page → element evidence. Follow RED → GREEN TDD. Do not commit, deploy, initialize Git, or change PaperSkill templates.

## Required reading

- Approved design and implementation plan for `2026-08-16-desktop-one-screen-experience`
- Task 2's final PaperMedia/media interfaces and tests
- Current `DdasMicroscope.tsx`, its tests, and only the DDAS section of `experience-data.css`
- `superpowers:test-driven-development`, systematic debugging, and verification-before-completion

## Allowed files

- `src/experiences/DdasMicroscope.tsx`
- `src/experiences/DdasMicroscope.test.tsx`
- only `.ddas-*` selectors in `src/styles/experience-data.css`
- `src/data/media.ts` only if a Task 2 crop name must be consumed, not renamed
- report/progress checkpoint.

Do not alter Step 01 selectors or its tested behavior.

## Stable public states

Preserve exactly:

- `page-ddas/random|cluster|ddas`
- `element-ddas/text|formula|table`

Transient candidate/page focus does not need new hash states.

Use a constant candidate model with six stable IDs:

```ts
type CandidateId = 'repeat-a'|'repeat-b'|'double-column'|'triple-column'|'formula-table'|'complex-layout';
type PageState = 'random'|'cluster'|'ddas';
type DdasView = 'candidates'|'page'|'element';
type ElementKind = 'text'|'formula'|'table';
```

Suggested stable positions: repeat-a `(14,24)`, repeat-b `(32,37)`, double-column `(54,22)`, triple-column `(75,31)`, formula-table `(57,74)`, complex-layout `(86,72)`. Ordinary repeated pages are teaching diagrams; real candidates use Task 2 thumbnail media with `viewer={false}`.

## Pointer and keyboard algorithm

- Normalize pointer coordinates only against the actual candidate-board rectangle, clamp 0–100, and choose the candidate with minimum squared Euclidean distance. Resolve ties by constant order.
- Pointer hover/move changes only the active candidate and magnifier; it must not write hash or complete the chapter.
- Each candidate is one focusable outer button. No nested button/link. Focusing a candidate synchronizes the magnifier.
- Direction keys choose the nearest candidate in that direction and move DOM focus. Enter/Space use native button click.
- Delete any container `role=application` or global Enter behavior that can reset an element view.

## Sampling modes must change the visible scene

- random: repeated ordinary candidates visibly receive repeated sample markers/counts while long-tail candidates recede;
- cluster: show four named layout-cluster regions and candidate cluster membership, without claiming difficulty weighting;
- ddas: mark triple-column, formula-table, and complex-layout as retained; mark repeated ordinary pages as down-weighted.

Mode buttons remain mutually exclusive and write `page-ddas/<mode>` while keeping the candidate-space view.

## View state machine

1. candidates: six candidates, snap lens, synchronized magnifier and retain reason.
2. page: selected page context with three visible hotspots and equivalent text/formula/table buttons; explicit “返回版式簇” restores the previous candidate focus.
3. element: preserve page context but show genuinely different evidence and hotspot positions:
   - text: a text/multicolumn crop;
   - formula: `omni-table/formula`;
   - table: `omni-table/mergedCellTable`.

If an evidence crop is a same-kind real example rather than a region on the selected page, label it “同类真实例图”. Never imply all crops came from one page.

Figure 3 is one compact evidence rail: page/candidates uses `mineru-ddas/pageLevel`, element uses `elementLevel`. It is not the pointer background.

Hash restoration must be atomic:

- page states restore candidate view plus a deterministic default candidate;
- element states restore `pageState=ddas`, `selectedCandidateId=formula-table`, the matching element and element view;
- invalid state is ignored without callbacks.

Only the first valid element selection calls `onComplete`, exactly once.

## Mandatory RED tests

Write/replace behavior tests before production changes:

1. Exactly six focusable candidate buttons; no `button button` or `button a`.
2. Mock board rect and pointer near complex-layout; assert active candidate, aria-live name, magnifier data/content change, and no callbacks.
3. Direction-key navigation moves focus/magnifier deterministically; Enter opens the focused page.
4. random/cluster/ddas have structurally different visible markers/regions/selections, not only different status text.
5. Candidate → page → “返回版式簇” is reversible and restores candidate focus.
6. text/formula/table update active hotspot and three distinct `data-evidence-key` values; Enter on a non-button container does not leave element view.
7. Valid page and element state restoration is atomic; invalid restore is inert.
8. Pointer/focus/mode/page open do not complete; first element choice completes once.
9. One Figure 3 rail, one 512-dimensional ViT-base fact, 44px touch equivalents.

Confirm RED with:

```powershell
npm test -- src/experiences/DdasMicroscope.test.tsx
```

## GREEN/layout requirements

- Root exposes `data-view`, `data-page-state`, `data-active-candidate`, and selected candidate state.
- Desktop board and magnifier fit a bounded main stage around `min(330px, 43svh)` with `min-height:0`; remove the old empty-lens/fixed 74px clipped thumbnails.
- Mobile uses natural flow or local scroll only; no body horizontal overflow.
- `prefers-reduced-motion` lands directly in the final visual state.
- Retain one live status and one group-level media boundary; facts/examples remain correctly labeled.

## Verification/report

```powershell
npm test -- src/experiences/DdasMicroscope.test.tsx
npm test
npm run build
node ..\PaperSkill\paper-skill\scripts\validate-output.js .
```

Write `task-3-implementer-report.md`, append progress, and record real-browser QA honestly.
