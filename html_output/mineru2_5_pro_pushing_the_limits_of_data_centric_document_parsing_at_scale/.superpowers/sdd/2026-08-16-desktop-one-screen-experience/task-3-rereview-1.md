# Task 3 Fix 1 Independent Re-review

## Verdict

**FAIL**

Fix 1 closes semantic restoration, cluster membership, and the mobile ordinary-thumbnail defect. It also raises most primary DDAS copy to 16px. The desktop one-screen/no-clipping Major remains open: the new budget test excludes the chapter content surrounding the experience, and the 270px stage clips both the right-hand explanation and the Figure 3 viewer target.

## Five-Major closure matrix

### 1. Fresh-object / parent-rerender semantic restoration — CLOSED

The effect now depends on primitive `restoredModuleId` and `restoredState` (`src/experiences/DdasMicroscope.tsx:104-130`). A fresh object with equal semantic values no longer retriggers restoration.

The App-like regression (`DdasMicroscope.test.tsx:154-187`) covers:

- mode state reflection followed by candidate opening;
- element state reflection while preserving the learner-selected `complex-layout` page;
- returning to the selected page and surviving an arbitrary parent rerender;
- a genuinely different external element state restoring the deterministic `formula-table` context.

Returning all the way to candidates is not directly repeated in the new parent-rerender test, but the primitive dependency makes equal-state parent renders inert there as well. The production identity-reset defect is closed.

### 2. Cluster coordinates and membership — CLOSED

`formula-table` moved to `(36, 74)`, which is in the lower-left `结构元素` region. All candidates and regions now expose matching `data-cluster` values (`DdasMicroscope.tsx:24-31`, `222-233`). The regression checks all six candidate coordinates against the current four-region arrangement and random markers now communicate `×3` / `×2`.

The test hard-codes the current 44.5% split rather than deriving it from the CSS grid declaration, but the current implementation is internally consistent.

### 3. 270px stage, embedded Figure 3, and no-clipping one-screen budget — OPEN

Figure 3 is now inside the stage in both candidate and page/element views, and the standalone sixth root row was removed. However, two clipping failures remain.

#### 3a. The “488px” test omits required chapter content

At 1366×768, the reveal allowance is approximately 548px. The new test at `DdasMicroscope.test.tsx:189-205` compares a hand-written DDAS-only estimate against that allowance:

```ts
52 + 44 + stage + 26 + 72 + (4 * 6)
```

It does not include the `step-heading`, `chapter-problem`, or collapsed `ChapterEvidence` that are children of the same `.chapter-unlock-reveal`. Their conservative minimum is roughly:

- heading plus margin: about 59px;
- one-line problem plus margins: about 40px;
- collapsed evidence summary plus margin: 64px.

Adding at least 163px to the asserted 488px produces about 651px, exceeding the approximately 548px reveal. The page therefore still needs internal scrolling before the core experiment and next-chapter control can be seen together. The test also uses invented header/boundary constants rather than computed production geometry.

#### 3b. The 270px stage clips its own right-hand content

The page workspace has about 254px after its 8px top/bottom padding. `.ddas-element-panel` reserves:

- element controls: 44px;
- navigation: 44px;
- Figure 3 rail: 62px;
- three gaps: 15px.

Only about **89px** remains for `.ddas-element-evidence` or `.ddas-page-prompt`. Those containers still use `overflow: hidden` (`experience-data.css:91-103`). At 16px, the source tag, heading, multi-line explanation, gaps, and padding require roughly 103–130px depending on the selected element. The causal explanation will be clipped in the compact stage.

#### 3c. Figure 3's actual viewer target is clipped below 44px

The rail constrains the media width to 96px (`experience-data.css:107-112`). With the registered Figure 3 crops:

- `pageLevel` aspect ratio is about 4.476, so the crop is only **21.4px high**;
- `elementLevel` aspect ratio is about 2.803, so the crop is only **34.2px high**.

The viewer button/44px child is inside `.paper-crop { overflow: hidden }`, so its visible and hittable area is clipped to the 21/34px crop. `toBeVisible()` in jsdom (`DdasMicroscope.test.tsx:193-194`) does not validate geometry or the 44px target. The embedded evidence rail is therefore neither a readable image nor a compliant touch target in its current form.

### 4. Core teaching copy at least 16px — PARTIALLY CLOSED / STILL OPEN GLOBALLY

The named causal selectors in the fix are now 16px: header fact, magnifier reason, page/element explanation, element controls, Figure 3 explanation, and live status (`experience-data.css:45`, `76-77`, `98-103`, `113-115`). Compact candidate names and provenance labels reasonably remain metadata.

However, the Task 3 factual limitation/source paragraph uses shared `.experience-boundary`, which still resolves to **12px** (`experience-data.css:31`). It contains core evidence boundaries, not incidental decoration. The regex test at `DdasMicroscope.test.tsx:207-222` omits this selector, so it does not fully enforce the approved 16px body-copy floor.

### 5. Mobile ordinary-thumbnail containment — CLOSED

The mobile magnifier now uses `minmax(105px, 38%)`, the ordinary teaching thumbnail uses a 105/136 aspect ratio, and the visual no longer clips it (`experience-data.css:122-131`). The mobile stage returns to natural growth. No body-level horizontal-overflow regression is introduced by these rules.

## Task 2 regression review

The fix remains scoped to `.ddas-*` behavior. PaperMedia thumbnail semantics, Step 01's stable six-slot layout, long-tail crops, and DocumentPrimer contracts remain green. No Task 2 selector regression was found in static review or targeted tests.

## Test-quality observations

- The semantic restoration regression now models App's fresh-object behavior and is meaningful.
- The cluster test validates current coordinates, although its boundary is duplicated as a hard-coded number.
- The desktop budget test is a false positive because it checks arithmetic constants rather than the actual chapter composition and ignores internal row content.
- The Figure 3 test checks DOM presence/`toBeVisible`, not crop height, hitbox height, or text clipping.
- The readability test matches the last textual CSS declaration and omits `.experience-boundary`; it is not a computed-style or whole-component audit.
- Real browser geometry QA is still unavailable, so jsdom assertions must not be presented as viewport verification.

## Fresh verification evidence

```text
npm test -- src/experiences/DdasMicroscope.test.tsx src/experiences/DataCounterfactual.test.tsx src/components/PaperMedia.test.tsx src/components/DocumentPrimer.test.tsx
PASS — 4 files, 27/27 tests

npm test
PASS — 17 files, 88/88 tests

npm run build
PASS — TypeScript and Vite; 65 modules transformed

node ..\PaperSkill\paper-skill\scripts\validate-output.js .
PASS — 6 chapters, 11 active modules, all 11 componentIds registered
```

These green commands do not close the geometry/clipping issues above.

`Browser visual QA: NOT RUN — no browser connection available`

