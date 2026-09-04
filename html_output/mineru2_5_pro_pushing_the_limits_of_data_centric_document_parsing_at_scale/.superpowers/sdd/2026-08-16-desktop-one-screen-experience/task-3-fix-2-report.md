# Task 3 Fix 2 Report — Whole-Chapter Budget and Figure 3 Geometry

## Review verification

The second re-review correctly identified that Fix 1 budgeted only the DDAS root, not the surrounding chapter, and that a nominal 44px viewer child was clipped by Figure 3 crops only 21/34px high. The remaining readability failure was the 12px factual boundary.

## RED evidence

After retaining all prior Task 3 regressions and adding the whole-chapter/real-crop contracts:

```text
npm test -- src/experiences/DdasMicroscope.test.tsx
10 passed, 3 failed
```

The failures were:

- repeated component header and an oversized 270px root composition;
- 96px Figure 3 media width, producing sub-44px crops;
- missing 16px collapsible factual-boundary selectors.

## Fixes

### 352px collapsed DDAS root

- Removed the experience-level header because the chapter already supplies the question and problem introduction.
- Combined DDAS, `512 维 ViT-base`, `约 60M 页级候选`, and the three sampling modes in one 44px toolbar.
- Removed the standalone root status row. Exactly one `aria-live` status now lives inside the current candidate/page/element side panel.
- Reduced the stage to `min(248px, 33svh)`.
- Replaced the always-visible boundary paragraph with a collapsed `details/summary`: 44px collapsed, 16px body and source link available when opened.
- Collapsed root geometry is 44 + 8 + 248 + 8 + 44 = 352px; opening the boundary grows naturally and the chapter reveal may scroll.

### Whole-chapter production budget

The regression derives values from the actual runtime CSS rather than DDAS-only invented constants:

- 768px viewport − 70px header − 64px process padding − 86px footer = 548px reveal allowance;
- production step heading = 65px;
- Step 02 problem line and margins = 40px;
- collapsed DDAS root = 352px;
- collapsed ChapterEvidence = 64px;
- total = 521px ≤ 548px.

### Figure 3 and right-panel geometry

- Figure 3 media now receives 200px usable width in a 74px rail.
- Registered crop geometry gives approximately 44.7px for `pageLevel` and 71.3px for `elementLevel`.
- The viewer and its visible crop are therefore both at least 44px.
- The stage is `overflow: visible`; magnifier, element panel, evidence, and prompt no longer rely on hidden overflow to meet the budget.
- Right panel uses conditional page/element content, three element controls in one 44px row, return controls in one 44px row, and the rail in one 74px row.

### Readability

- Causal side-panel explanations, controls, Figure 3 caption, collapsed boundary summary, and expanded boundary body remain at least 16px.
- Only provenance/candidate metadata remains compact.

## Fresh verification

```text
npm test -- src/experiences/DdasMicroscope.test.tsx
13/13 passed

npm test
17 files passed, 89/89 tests passed

npm run build
TypeScript + Vite PASS; 65 modules transformed

node ..\PaperSkill\paper-skill\scripts\validate-output.js .
RESULT: PASS; 6 chapters, 11 active modules, all 11 componentIds registered
```

## Browser QA

**NOT RUN — no connected in-app browser session is available.** The tests now cover production-derived chapter arithmetic and registered crop geometry, but this is not presented as a substitute for real 1366×768 visual QA.

