# Task 3 Fix 1 Report — Independent Review Majors

## Review handling

Read the complete independent review and verified all five major findings against the production component, App's fresh-object restoration path, and the runtime CSS cascade. All five findings reproduced before implementation.

## RED evidence

```text
npm test -- src/experiences/DdasMicroscope.test.tsx
7 passed, 5 failed
```

The five failures independently covered:

1. fresh semantically-equal restoration objects pulling an opened candidate back to `candidates`;
2. `formula-table` falling visually inside the wrong lower-right cluster;
3. Figure 3 outside the stage and a 330px stage exceeding the desktop budget;
4. causal teaching copy resolving to 13/11/10px;
5. a 72px mobile column clipping the 105×136 ordinary-page magnifier.

## Fixes

### Semantic restoration

- The restore effect now depends only on primitive `moduleId` and `state`.
- A locally applied mode/element state is inert when App reflects the same semantic state through a newly allocated object.
- Candidate → page remains open after `onInteract` rerenders App.
- Element → page remains durable across arbitrary parent rerenders.
- A genuinely different external state still atomically restores its deterministic page/element context.

### Cluster geometry

- Moved `formula-table` to `(36, 74)`, inside the lower-left `结构元素` region.
- Added explicit `data-cluster` relations to named regions and candidates.
- The regression derives coordinates from rendered styles and verifies all six candidates against the actual two-column/two-row region bounds.
- Random repeat markers now communicate unequal repeat pressure as `×3` and `×2`.

### Desktop composition and provenance

- Reduced the desktop stage from 330px to `min(270px, 36svh)`.
- Moved the single Figure 3 rail into the candidate magnifier or page-side evidence panel, so it no longer consumes a sixth full-width row.
- The rail retains its crop viewer and now exposes a visible `论文原图节选` tag.
- A CSS/DOM contract calculates a 488px experience upper budget against the 548px Task 1 reveal allowance and asserts the root is not clipped to satisfy that budget.

### Readability and mobile containment

- Magnifier reasons, page prompts, element explanations/controls, Figure 3 explanation, header facts, and live status explicitly resolve to at least 16px.
- Compact candidate names and provenance remain metadata.
- Mobile magnifier uses `minmax(105px, 38%)`, a 105/136 aspect-ratio page, and visible overflow for the full teaching thumbnail; the former 72px column is excluded by contract.

## Fresh verification

```text
npm test -- src/experiences/DdasMicroscope.test.tsx
12/12 passed

npm test
17 files passed, 88/88 tests passed

npm run build
TypeScript + Vite PASS; 65 modules transformed

node ..\PaperSkill\paper-skill\scripts\validate-output.js .
RESULT: PASS; 6 chapters, 11 active modules, all 11 componentIds registered
```

## Browser QA

**NOT RUN — no connected in-app browser session is available.** The new viewport, font, membership, and mobile containment checks are automated contracts; a real 1366×768 visual pass remains for the independent reviewer/parent when a browser connection is available.

