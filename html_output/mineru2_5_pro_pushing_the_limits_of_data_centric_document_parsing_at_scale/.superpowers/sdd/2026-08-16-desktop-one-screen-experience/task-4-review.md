# Task 4 Independent Review

## Verdict

**FAIL — 4 Major findings, 0 Critical findings.**

The semantic presentation is substantially clearer and the submitted automated suite is green, but the real App integration breaks both new Step 03/04 interactions. The Render media and one-screen geometry are also not proven by the current raw-CSS assertions.

No production file was modified during this review.

## Major findings

### Major 1 — Render slider loses within-bucket progress after the App echoes the hash state

`RenderForensics` restores from an effect keyed to the whole `restoredModuleState` object (`src/experiences/RenderForensics.tsx:20-32`). `App.restoredStateForModules` creates a fresh object on every relevant render (`src/App.tsx:175-181`). A slider movement emits a coarse state such as `compare-p50`; App immediately creates a new restore object and the effect overwrites the precise local value with `50`.

I reproduced this against the freshly built production bundle without editing project files. Dragging from 0 to 72 produced:

```text
after input 50 #step-4/render-verify/compare-p50 --compare-progress: 50%; compare-p50
```

This is not cosmetic: values 65–99 fall back to 50, so the repair action that should appear at 65% disappears. The component-only test at `RenderForensics.test.tsx:43` does not mount the App state/hash echo; the restore test at line 69 only tests explicit prop changes.

Required fix: distinguish an external restore from the component's own persisted echo (for example with a last-emitted semantic-state ref), preserve exact local progress when the echoed bucket is unchanged, and add an App-type fresh-object regression proving `72` remains `72` and the repair control stays available.

### Major 2 — CMCV overwrites the learner's Easy/Hard prediction with Medium and reports it as correct

One answer calls `onStateChange` twice (`CmcvRoutingChallenge.tsx:38-40`): first `cmcv-router/<choice>`, then `cmcv-trust/consensus:correct`. App stores only one hash state, so the second update wins. The restore effect then maps the trust state to `medium` (`CmcvRoutingChallenge.tsx:22-32`).

Production-bundle reproduction after clicking **Easy**:

```text
after-easy-pressed ["Medium"] #step-3/cmcv-trust/consensus:correct
outcome 路由：Medium判断正确...
```

The learner therefore sees Medium selected and “判断正确” even after choosing Easy or Hard. This defeats the requested “先判断，再揭示” interaction. The isolated test at `CmcvRoutingChallenge.test.tsx:55` has mocked callbacks and never rerenders through App, so it misses the overwrite.

Required fix: keep the learner prediction and the revealed truth as separate state. Persist one canonical state per answer (or ignore the component's own trust echo), retain the clicked button's `aria-pressed`, and add App-integrated fresh-object tests for Easy, Medium, and Hard.

### Major 3 — The Render crop is landscape in the registry but the rendered stage breaks that ratio

The registered crop is valid: source 1040×640 with 33%×38% crop gives an effective aspect of about **1.411:1**. The generic stage rule assigns a definite width of `420px × aspect`, about **592.7px**, whose aspect-derived height is 420px (`experience-foundation.css:15`). The Render override then caps only height to 250px (`experience-labeling.css:103`). With width still definite, the used crop viewport becomes approximately **592.7×250 = 2.37:1**, not 1.411:1. The mobile override repeats the same one-axis cap at 210px (`experience-labeling.css:148`).

The image itself remains un-stretched, but the viewport no longer represents the declared crop: it exposes/clips a different vertical region and makes the compare overlay spatially misleading.

The current test only regex-matches the presence of `max-block-size` and separately calculates the registry ratio; it never verifies the used width/height relationship.

Required fix: constrain the crop through a ratio-preserving wrapper (for example set both inline and block sizing through `contain`, or derive inline size from the local height cap) and add a computed geometry contract that asserts the Render stage viewport remains near 1.411:1 at desktop and mobile widths.

### Major 4 — The 270px Render bench height does not bound the sidecar, so the chapter's one-screen budget is not credible

Only the canvas is fixed to 270px (`experience-labeling.css:91-103`). The sidecar has no block-size/max-block-size/overflow contract (`:111`), while its two 133px-wide code columns contain 16px headings, 14px wrapping code, tags and padding (`:114-120`). At a 300px sidecar, the long visual-diff string requires roughly three lines. A conservative minimum-height budget is:

- slider: about 67px;
- code row: about 126px;
- hint: about 56px (or repair button 44px);
- sidecar padding and gaps: 42px.

That is about **291px default / 279px repaired**, already taller than the 270px canvas. Because the grid row grows to the tallest child, the test's canvas cap does not cap the bench. At 1366×768 the chapter reveal has about 546px after process padding and navigation; Step 04's heading/problem, bench, collapsed source note and collapsed ChapterEvidence consume roughly 556px in the default state, forcing the internal `.chapter-unlock-reveal` scrollbar.

The raw CSS test at `RenderForensics.test.tsx:23-41` checks declarations, not actual sidecar or chapter height, so it is a false positive for the user's “一个页面完整展示” requirement.

Required fix: make the sidecar genuinely fit the 270px row (reduce/structure copy, reserve a fixed compact feedback area, or give only a deliberate inner subregion bounded overflow without hiding the main action) and add a populated Step 04 chapter-budget test rather than testing only the canvas selector.

## Additional review notes

- CMCV now explicitly shows `GT：不可用`, `A = B`, `C ≠ 外部共识`, a single outcome tray, and the non-GT pseudo-label boundary. The mobile rules retain rather than hide C and the inequality.
- Render uses `omni-table/mergedCellTable`, keeps canvas and sidecar as direct siblings, and preserves the declared compare/repaired state names and evidence boundary.
- Desktop core text is not universally 16px/44px: CMCV output code is 14px and GT secondary copy is 13px; Render code is 14px, while generic glossary term buttons are 30px high on desktop. If the 16px/44px acceptance criterion is literal for every core label/control, this still needs an explicit production-order desktop test. The existing 16px/44px fixture only targets the 420px mobile cascade.

## Fresh verification evidence

- Targeted Task 4 suite: **PASS**, 3 files / 30 tests.
- Full suite: **PASS**, 17 files / 98 tests.
- Production build: **PASS**, TypeScript + Vite; 65 modules transformed.
- Official PaperSkill validator: **PASS**, 6 chapters / 11 active modules / 11 registered IDs.
- Scans: **PASS**, zero legacy runtime surfaces, runtime fetch/XHR/JSONP/script injection, infinite CSS animations, U+FFFD/common mojibake; strict UTF-8 bad-file count 0.
- Nested interactive DOM is covered by the all-unlocked App test and passed. A simple source regex produced one known sibling-button false positive in `FurtherLearning`, not nesting.
- HTTP smoke: **PASS**, 13/13 returned 200 (`/`, six local images, six experience source routes) on `127.0.0.1:5174`.

The green suite does not supersede the two production-bundle interaction reproductions or the geometry defects above.

Browser visual QA: NOT RUN — no browser connection available
