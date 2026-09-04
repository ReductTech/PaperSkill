# Task 3 Independent Review — DDAS Microscope

## Verdict

**FAIL**

The pointer geometry, nearest-candidate calculation, keyboard direction logic, non-nested controls, distinct element evidence, completion cardinality, and validator contract are implemented plausibly and the current automated suite is green. However, the production parent/child hash-reflection path contains a blocking state-reset defect, and the current layout does not meet the approved one-screen/readability contract.

## Major findings

### 1. Reflected hash state resets the real candidate → page → element journey

`DdasMicroscope` applies restoration whenever the `restoredModuleState` **object identity** changes (`src/experiences/DdasMicroscope.tsx:96-118`). `App.restoredStateForModules` constructs a fresh object on every parent render (`src/App.tsx:175-181`). Opening a candidate calls `onInteract` (`DdasMicroscope.tsx:140-145`), and `App.markInteraction` always creates a new `Set`, so the parent renders again.

Reproduction from the production control flow:

1. Select random, cluster, or DDAS. This writes `#step-2/page-ddas/<mode>`.
2. Click any candidate.
3. `openPage` locally sets `data-view="page"`, then `onInteract` rerenders `App`.
4. `App` supplies a new `{ moduleId: 'page-ddas', state: '<mode>' }` object.
5. The restoration effect runs again and forces `setView('candidates')` plus the mode's default candidate.

The same defect means that after an element hash exists, returning to the page/candidate view is not durable: any later `App` render can pull the component back into the restored element view.

The test at `DdasMicroscope.test.tsx:141-152` is a false negative for this production case because its controlled wrapper stores and reuses the same state-object reference. It does not reconstruct the object as `App` does, nor does it trigger a parent rerender after returning. Add a regression whose parent creates a fresh semantically equal restoration object on every render. Restoration should be keyed by semantic state transitions, with locally emitted reflections distinguished from external/deep-link restoration.

### 2. Cluster regions do not actually encode candidate membership

The candidate model says `formula-table` belongs to `结构元素` at `(57, 74)` (`DdasMicroscope.tsx:29`). The four cluster regions are a two-column/two-row CSS grid whose left column occupies roughly 44% (`experience-data.css:49-50`). Therefore `(57, 74)` is visually inside the lower-right `复杂版式` region, leaving the lower-left `结构元素` region empty.

Candidates expose the cluster only inside their accessible name; there is no structural membership relation between a candidate and the visible region. The test at `DdasMicroscope.test.tsx:56-73` merely counts four region nodes, so it passes even when the visual grouping is wrong. The cluster view must align region geometry with candidate coordinates (or render candidates inside named cluster containers) and assert each candidate's visible membership.

### 3. Step 02 still exceeds the approved desktop one-screen height budget

At 1366×768 the chapter shell is 698px. Its 32px top/bottom padding and the unlock footer's 20px padding around a minimum 46px control leave at most about 548px for `.chapter-unlock-reveal`, before considering borders.

The DDAS component alone reserves at least:

- mode controls: 44px;
- main stage: 330px (`min(330px, 43svh)` at 768px);
- Figure 3 rail: 54px;
- live state: 18px;
- five 9px grid gaps: 45px.

That is already 491px before the DDAS header and boundary paragraph. The chapter heading, problem introduction, and collapsed evidence summary are additional content in the same reveal. Consequently the core experiment and next-chapter control cannot be visible together; the reveal must internally scroll.

The Figure 3 rail is not individually oversized (`min-height: 54px`, crop capped at 48–52px), but adding it as a sixth full-width row makes the total composition exceed the viewport budget while being too small to read without opening the viewer. Integrate it into the stage/side panel or reduce the desktop stage/row structure. A static selector test is insufficient; real 1366×768 visual QA remains required.

### 4. Core teaching text is below the approved 16px readability floor

Several pieces of primary explanation are rendered as microcopy:

- magnifier reason: 11px (`experience-data.css:76`);
- element explanation/page prompt: 10px (`experience-data.css:93`);
- element controls: 10px (`experience-data.css:96`);
- Figure 3 explanation: 11px (`experience-data.css:105`);
- status/header facts: 13px (`experience-data.css:36`, inherited earlier rules).

These are not incidental metadata; they contain the causal explanation the learner must read. This conflicts with the approved “正文不低于 16px” requirement and undermines the requested clarity. Reclaim vertical space through composition, not by shrinking teaching copy.

### 5. Mobile magnifier clips the ordinary-page thumbnail

On mobile the magnifier's visual column is 72px wide (`experience-data.css:118`), while the ordinary-page magnifier child remains 105×136px (`experience-data.css:74`) inside an `overflow: hidden` visual (`experience-data.css:71`). Thus the required complete thumbnail is clipped. The test suite has no mobile media-box assertion and browser visual QA was not run.

## Minor observations / non-blockers

- The approved design/brief does **not** require `DEFAULT_CANDIDATE.ddas` to be `complex-layout`; it only requires a deterministic page-state default, while element-state restoration explicitly requires `formula-table`. The current page-DDAS default is therefore not by itself a specification failure. `complex-layout` may be a better pedagogical default, but it should remain separate from the mandatory element deep-link default.
- Both random-mode repeat candidates display `×3`. The brief requires visible repeated markers/counts, not specifically `×3` and `×2`, so this is not a hard failure. Using different counts would communicate sampling imbalance more clearly; a stronger test should assert marker ownership and values rather than only a count of two nodes.
- Pointer normalization correctly uses `event.currentTarget.getBoundingClientRect()`, clamps to 0–100, and uses strict `<` during reduction, which preserves constant-order tie resolution. The tests do not cover clamping, zero-size boards, ties, or all four arrow directions.
- Candidate thumbnails use `viewer={false}` and `chrome={false}`, so there is no nested button/link. However, `PaperMedia` still renders a `<figure>` inside a `<button>`, which is an HTML content-model concern even though the nested-interactive scan passes.
- The Figure 3 rail has one viewer trigger and the root has one group-level boundary/link, but the rail itself lacks an immediately visible “论文原图节选” provenance tag because `chrome={false}`.

## Fresh verification evidence

```text
npm test -- src/experiences/DdasMicroscope.test.tsx
PASS — 1 file, 10/10 tests

npm test
PASS — 17 files, 86/86 tests

npm run build
PASS — TypeScript and Vite; 65 modules transformed

node ..\PaperSkill\paper-skill\scripts\validate-output.js .
PASS — 6 chapters, 11 active modules, all 11 componentIds registered
```

These green results do not cover the production restoration-object identity defect, cluster geometry correctness, real viewport height, or mobile clipping.

`Browser visual QA: NOT RUN — no browser connection available`

