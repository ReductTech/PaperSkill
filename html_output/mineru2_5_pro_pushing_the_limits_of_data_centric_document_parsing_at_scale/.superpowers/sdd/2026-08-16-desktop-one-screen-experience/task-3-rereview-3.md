# Task 3 Fix 3 Independent Re-review

## Verdict

**PASS**

Fix 3 closes all three Major findings from the previous review. The conditional toolbar removes the duplicated side-panel controls, both prompt/evidence variants fit above the Figure 3 rail, the production chapter accounting leaves approximately 20px of vertical margin at 1366×768, and the higher-specificity glossary targets are now 44px. The previously closed semantic restoration, cluster geometry, Figure 3, completion, and mobile containment behavior has not regressed.

**Critical findings: none.**  
**Major findings: none.**

## Scoped checks

### Conditional toolbar and side-panel structure — PASS

- Candidate view contains the DDAS/ViT/60M facts and exactly three sampling controls.
- Page view replaces that content with three element choices plus “返回版式簇” (four controls).
- Element view adds “返回所选页面” (five controls total).
- The stage-side panel now contains only the current prompt/evidence and the compact Figure 3 rail; the former `.ddas-element-controls` and `.ddas-navigation` rows are absent.
- The current view still exposes only one live status, so the restructuring did not duplicate announcements.

This is structural, not merely hidden with CSS: `DdasMicroscope.tsx:208-225` conditionally mounts the toolbar variants, while `DdasMicroscope.tsx:281-290` mounts only prompt/evidence plus `FigureEvidence` in the side panel.

### Prompt/evidence row geometry — PASS

The desktop stage is 212px. With the stage border and the page workspace's 6px top/bottom padding, the element panel has about 198px of usable height. Its rows are `minmax(110px, 1fr) 74px` with one 6px gap, yielding about 118px for the first row at 1366×768.

The taller page prompt is approximately:

```text
18 × 1.7       inherited “下一层” line
+ 16 × 1.7     strong line
+ 16 × 1.15    status line
+ 4            two 2px gaps
+ 8            vertical padding
= 88.2px
```

It therefore has roughly 30px of real slack and cannot overlap the 74px rail. The element evidence has less text and also fits. Neither prompt/evidence container uses hidden/clip overflow.

### DDAS root and full chapter budget — PASS

The production DDAS composition is **316px before the collapsed boundary's two border pixels, 318px outer height**:

```text
44 toolbar + 212 stage + 44 boundary summary + 16 gaps = 316px
+ 2 boundary border = 318px
```

This distinction reconciles the “root 316” shorthand with the actual `.ddas-microscope { min-height: 318px }` and prevents the border from being omitted in the chapter calculation.

The test now reads the relevant production declarations and includes the previously missed badge line, process/footer borders, content-driven footer text stack, ChapterEvidence summary line/padding, DDAS boundary border, and both DDAS gaps. Recalculation agrees with the test:

```text
reveal allowance  ≈ 541.4px
heading            = 95.0px
problem            ≈ 39.2–40px
DDAS root          = 318.0px
evidence           ≈ 68.6px
chapter core       ≈ 520.8–521.6px
remaining margin   ≈ 19.8–20.6px
```

The margin exceeds the 12px contract. No material production box in the collapsed default chapter was found outside this accounting.

### Glossary interaction target — PASS

`.ddas-toolbar__facts .glossary-term` now resolves to `min-height: 44px`. This higher-specificity rule no longer overrides the global 44px button contract with a smaller value. DDAS and ViT remain actual focusable glossary buttons.

### Figure 3 rail geometry — PASS

The rail remains 200px wide and 74px high. Registered source-crop geometry produces approximately:

- `pageLevel`: 44.68px high;
- `elementLevel`: 71.34px high.

Both meet the 44px viewer target and fit under the 72px media cap. The stage is `overflow: visible`, and the prompt/evidence ancestors do not clip the rail. Figure 3 remains embedded inside the main stage rather than consuming another chapter row.

### Previously closed behavior — PASS, no regression

- Restoration is keyed to primitive `moduleId`/`state`, so a fresh-but-semantic-equal parent object is inert and does not reset local candidate/page navigation.
- Page restoration returns to the deterministic candidate view; element restoration atomically restores DDAS, `formula-table`, matching element, and element view without callbacks.
- Formula/table candidate coordinates remain within their declared cluster regions; random still renders `×3`/`×2`, and random/cluster/DDAS retain structurally different scenes.
- Pointer normalization/clamping and nearest-candidate selection remain board-relative and callback-free.
- Direction keys move focus and magnifier; candidate → page → candidates restores candidate focus.
- First valid element selection completes exactly once.
- Text/formula/table still use distinct evidence keys and real crops.
- Mobile retains natural flow, a complete proportional 105×136 ordinary-page magnifier, and no DDAS-created horizontal overflow rule.
- Task 2 PaperMedia, Step 01 DataCounterfactual, and DocumentPrimer targeted tests remain green.

## Test-quality assessment

The new tests close the prior false positives: they assert structural control removal, calculate text-row occupancy rather than merely checking overflow, exercise the high-specificity glossary cascade, and account for the complete collapsed chapter stack. Restoration uses a parent harness that recreates the object on every render, which meaningfully covers the identity-loop regression.

The CSS arithmetic is still not a substitute for rendered-browser measurement at every font/platform combination, but it now has about 20px of planned margin rather than relying on an exact-fit claim. No test-only selector or mocked constant was found masking a Major defect.

## Fresh verification evidence

```text
npm test -- src/experiences/DdasMicroscope.test.tsx src/experiences/DataCounterfactual.test.tsx src/components/PaperMedia.test.tsx src/components/DocumentPrimer.test.tsx
PASS — 4 files, 31/31 tests

npm test
PASS — 17 files, 92/92 tests

npm run build
PASS — TypeScript and Vite; 65 modules transformed

node ..\PaperSkill\paper-skill\scripts\validate-output.js .
PASS — 6 chapters, 11 active modules, all 11 componentIds registered
```

`Browser visual QA: NOT RUN — no connected in-app browser session was available for this review.`
