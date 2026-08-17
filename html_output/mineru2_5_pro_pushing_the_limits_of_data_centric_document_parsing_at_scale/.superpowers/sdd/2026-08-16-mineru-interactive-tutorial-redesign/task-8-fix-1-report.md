# Task 8 Review Fix 1 Report

## Status

The sole Major review finding is fixed. The 420px contract is now enforced by the final CSS cascade rather than inferred from a low-specificity declaration.

## Root cause and repair

The original `main :is(...)` font-size rule lost to component-class selectors, including a FurtherLearning boundary declaration with `!important`. The original target-size rule also omitted anchors, leaving the brand and footer paper links without a guaranteed 44px height.

The new App regression parses all runtime CSS, expands the media rules that apply at 420px, matches the selectors against an isolated representative DOM, and resolves importance, specificity, and source order. It runs both with `paper.css` before and after component styles. The fixture covers one body-copy element from each of the six experiences, ResearchProblemOverview, FurtherLearning, the brand link, the footer paper link, a button, summary, and range input.

`paper.css` now uses an ID-scoped, `!important` 16px rule for learner-visible paragraph/list/label/output copy in the app and portal surfaces. At 420px all anchors become `inline-flex` with 44px minimum width/height and vertical-only padding; buttons, visible inputs, selects, summaries, and role buttons receive the same 44px minimum dimensions. The link rule adds no inline padding, so prose links remain inline-level flex boxes and do not acquire avoidable horizontal width.

## TDD evidence

- RED on the old CSS: `npm test -- src/App.test.tsx` failed 1/16 with `paper-first: data body copy: expected 13 to be greater than or equal to 16`.
- An intermediate run exposed JSDOM's incorrect source-order handling when two declarations are both `!important`; a minimal reproduction returned the later 11px class rule over an earlier ID-scoped 16px rule. The test therefore performs standards-based cascade resolution instead of relying on that faulty computed-style behavior.
- GREEN: `npm test -- src/App.test.tsx` passed 16/16.

## Fresh verification

- `npm test`: PASS, 14 files / 58 tests.
- `npm run build`: PASS, 65 modules transformed.
- Official validator: PASS, 6 chapters, 11 active modules, all 11 component IDs registered.
- Required legacy `rg`: exit 1, 0 matches.
- Strict UTF-8/U+FFFD scan: PASS across 199 project-owned text files; 0 invalid UTF-8 and 0 files containing U+FFFD.

Browser visual QA: NOT RUN — no browser connection available

No deployment, PR, or Git initialization performed.
