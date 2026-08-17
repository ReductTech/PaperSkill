# Task 3 Fix 2 Independent Re-review

## Verdict

**FAIL**

Fix 2 closes the Figure 3 crop/ancestor clipping defect and raises the DDAS boundary to 16px. Primitive restoration, cluster membership, completion cardinality, and mobile thumbnail containment remain intact. The whole-chapter height test is still a false positive, the page-state side panel overlaps its controls, and the compact toolbar reduces clickable glossary terms to 36px.

## Required checks

### Whole-chapter `521 ≤ 548` production budget — FAIL

The new test improves on Fix 1 by reading several values from production styles, but it still omits or undercounts real production boxes.

#### Reveal allowance is about 541px, not 548px

The test subtracts a nominal 86px footer (`46px control + 2 × 20px padding`) but omits:

- the process card's 2px border;
- the footer's 2px border;
- the footer text stack, whose inherited line height is taller than the 46px button: `15 × 1.7 + 13 × 1.7 + 1 ≈ 48.6px`.

With the 698px chapter shell, 64px process padding and the actual footer content, the reveal allowance is approximately **541.4px**.

#### Heading budget omits the visible badge row

The test computes only the H2 line, its 5px top margin, and the heading's 18px bottom margin, producing 65px (`DdasMicroscope.test.tsx:230-234`). The real heading also contains the visible `Coverage · DDAS` badge before the block H2. Its anonymous line box inherits the 18px/1.7 chapter line height, adding approximately **30.6px**. The real heading budget is therefore about **95px**, not 65px.

#### Other undercounts

- The collapsed DDAS details row is 44px plus the parent details border; the actual collapsed DDAS root is about **354px**, not 352px.
- The collapsed `ChapterEvidence` summary inherits an 18px/1.7 line box; with 22px padding, details border, and 14px margin it is about **69px**, not 64px.

A production-based approximation is therefore:

```text
reveal allowance ≈ 541.4px
heading with badge ≈ 95px
problem ≈ 39.2px
collapsed DDAS root ≈ 354px
collapsed evidence ≈ 69px
whole chapter ≈ 557.2px
```

The default Step 02 composition remains about 16px over budget, so the reveal still scrolls. The assertion `521 ≤ 548` does not prove the approved one-screen result.

### Collapsed DDAS root around 352px — PARTIAL

The structural simplification is sound: one 44px toolbar, a 248px stage, two 8px gaps, and a collapsed boundary. There is no longer a duplicated experience header or standalone status row.

However, the details border makes the content-driven root approximately 354px. This small difference is not itself a usability blocker; it matters because the whole-chapter margin is already too tight and the test claims exact production arithmetic.

### Side panel without text clipping/overlap — FAIL

The 248px stage leaves about 236px inside the page workspace after its 6px top/bottom padding. The element panel reserves:

- controls: 44px;
- navigation: 44px;
- Figure 3 rail: 74px;
- three gaps: 9px.

That leaves only **65px** for the prompt/evidence row.

The element-state evidence is now short enough to fit. The page-state prompt is not: it contains an ordinary 18px/1.7 `下一层` span (about 30.6px), a 16px/1.7 heading (about 27.2px), a 16px/1.15 status line (about 18.4px), two gaps and 8px padding—approximately **88px**.

Removing `overflow:hidden` does not make this fit; it lets roughly 23px overflow into the next 44px control row. The test at `DdasMicroscope.test.tsx:250-266` checks only that hidden/clip is absent, so it misses text/control overlap.

### Figure 3 200px rail, crop heights and viewer target — PASS

The registered media geometry gives:

- `pageLevel`: about 44.68px at 200px width;
- `elementLevel`: about 71.34px at 200px width.

The 74px rail, 72px media cap, visible stage overflow, and absence of hidden overflow in the side panel keep both crops visible. The viewer's 44px minimum now fits inside both crop boxes, so the previous 21/34px target defect is closed.

### Boundary body at least 16px — PASS

The collapsed summary and expanded body explicitly use 16px; the source link retains a 44px minimum target. The previous shared 12px always-visible boundary was removed from Step 02.

### Toolbar glossary targets — FAIL

`.ddas-toolbar__facts .glossary-term { min-height: 36px }` has greater specificity than `.ddas-microscope button { min-height: 44px }`. Both the DDAS and ViT explanation buttons therefore resolve to 36px on desktop and on most mobile widths. Only the separate `max-width: 420px` `!important` rule can override it.

This violates Task 3's 44px interaction-target contract and is not covered by the candidate-only 44px assertion.

## Previously closed behavior regression check

- Primitive semantic restoration with fresh parent objects: **no regression**.
- Candidate → page → element context preservation: **no regression**.
- Cluster positions/membership and random `×3`/`×2` markers: **no regression**.
- Pointer nearest-candidate and keyboard behavior: **no regression found**.
- Exactly one live status per current view: **preserved**.
- Completion fires only on the first valid element selection: **preserved**.
- Mobile 105/136 ordinary thumbnail containment: **preserved**.
- Task 2 PaperMedia, Step 01 and DocumentPrimer selectors/tests: **no regression found**.

## Test-quality assessment

- The semantic restoration and crop-ratio tests exercise meaningful production data.
- The chapter budget test reads real declarations but omits the badge line, borders, content-driven footer height, and content-driven summary height.
- The side-panel test equates “not hidden” with “fits”; it does not budget the prompt's three text rows or detect overlap.
- The 44px assertion covers candidates and Figure 3, but not the newly compressed toolbar glossary buttons.
- Real browser geometry QA remains unavailable; jsdom `toBeVisible()` is not viewport evidence.

## Fresh verification evidence

```text
npm test -- src/experiences/DdasMicroscope.test.tsx src/experiences/DataCounterfactual.test.tsx src/components/PaperMedia.test.tsx src/components/DocumentPrimer.test.tsx
PASS — 4 files, 28/28 tests

npm test
PASS — 17 files, 89/89 tests

npm run build
PASS — TypeScript and Vite; 65 modules transformed

node ..\PaperSkill\paper-skill\scripts\validate-output.js .
PASS — 6 chapters, 11 active modules, all 11 componentIds registered
```

The green suite does not close the whole-chapter overflow, page-prompt overlap, or 36px glossary-target findings.

`Browser visual QA: NOT RUN — no browser connection available`

