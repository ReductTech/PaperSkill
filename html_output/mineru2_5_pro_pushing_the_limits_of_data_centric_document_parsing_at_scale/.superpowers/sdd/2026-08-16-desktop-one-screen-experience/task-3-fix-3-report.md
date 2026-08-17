# Task 3 Fix 3 Report — Conditional Toolbar and Honest Chapter Budget

## Review verification

The third review findings reproduced in the production structure:

- the prior whole-chapter test omitted the badge line, process/footer borders, footer text stack, and the content-driven evidence-summary height;
- the 248px stage left only about 65px for an approximately 88px page prompt because two control rows still occupied the side panel;
- `.ddas-toolbar__facts .glossary-term` won the cascade with a 36px target.

## RED evidence

Before production changes:

```text
npm test -- src/experiences/DdasMicroscope.test.tsx
12 passed, 4 failed
```

The four expected failures covered conditional toolbar content, the 212px stage/whole-chapter budget, removal of side-panel controls, and the 44px high-specificity glossary target.

## Minimal structural fix

- Candidate view keeps one 44px toolbar containing the DDAS/ViT/60M facts and the three sampling choices.
- Page and element views replace that content in the same toolbar with the three element choices plus context-appropriate return buttons (4 buttons in page view, 5 in element view).
- The stage now contains only the main page/candidate visual and a side panel with current prompt/evidence plus the 74px Figure 3 rail.
- The side panel reserves `minmax(110px, 1fr) 74px`, eliminating prompt/control overlap rather than hiding it.
- Stage height is 212px; collapsed DDAS composition is approximately 318px including the boundary border.
- Candidate magnifier diagrams use a proportional `105 / 136` aspect ratio with automatic height. Mobile still exposes the full 105×136 reference size.
- The higher-specificity toolbar glossary rule now has a 44px minimum target.

## Whole-chapter budget contract

The test now derives all relevant production boxes:

```text
reveal allowance = 768 - 70 header - 66 process padding/border - 90.6 footer = 541.4px
heading          = 30.6 badge line + 41.4 H2 + 5 top margin + 18 bottom margin = 95px
problem          = 28 line + (-8 + 20) margins = 40px
DDAS root        = 44 toolbar + 212 stage + 44 boundary + 2 border + 16 gaps = 318px
evidence         = 14 margin + 52.6 summary + 2 border = 68.6px
chapter core     = 521.6px; spare = 19.8px
```

The contract therefore preserves more than the required 12px spare at 1366×768 without clipping teaching copy.

## Fresh verification

```text
npm test -- src/experiences/DdasMicroscope.test.tsx
16/16 passed

npm test -- src/experiences/DdasMicroscope.test.tsx src/experiences/DataCounterfactual.test.tsx src/components/PaperMedia.test.tsx src/components/DocumentPrimer.test.tsx
4 files passed, 31/31 tests passed

npm test
17 files passed, 92/92 tests passed

npm run build
TypeScript + Vite PASS; 65 modules transformed

node ..\PaperSkill\paper-skill\scripts\validate-output.js .
RESULT: PASS; 6 chapters, 11 active modules, all 11 componentIds registered
```

## Browser QA

**NOT RUN — no connected in-app browser session is available.** CSS and DOM contracts verify the approved geometry, but they are not represented as real-browser viewport evidence.
