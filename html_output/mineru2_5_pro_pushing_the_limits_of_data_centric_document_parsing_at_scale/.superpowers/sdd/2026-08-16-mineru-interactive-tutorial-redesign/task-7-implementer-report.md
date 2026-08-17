# Task 7 implementer report — compact Bilibili footer

## Scope delivered

- Re-mounted `FurtherLearning` immediately after the Step 6 research directions, so all Bilibili material is footer-only and optional.
- Replaced the three-stage video task/progress flow with three compact cards: one reason to watch, at most two observation points, an original-page link, and an explicit source boundary.
- Replaced duplicate video embed URLs with `videoAssetId`; the player resolves its iframe source only through `getMediaAsset(videoAssetId).src`.
- Added one in-memory consent gate per mounted page session. No consent or video progress is written to `localStorage`.
- Added close-button and Escape disposal, focus return to the requested playback button, original-page fallback, primary/foundation resource lists, and a three-column/two-row research index while retaining all six research items.

## RED → GREEN record

The first test render initially lacked the required `GlossaryProvider`, which was a test-harness error; it was corrected before evaluating product behavior. The valid RED run then failed as expected: the old UI exposed six controls matching “播放” and had no “继续播放” consent dialog. That failure identified the legacy task flow rather than a selector issue.

After the minimal footer/player implementation, `src/components/FurtherLearning.test.tsx` passed its two behavior tests. They exercise the real component and cover three playback controls, first-use consent, iframe creation only after consent, direct later playback in the same page session, Escape iframe destruction/focus return, and absence of video-progress writes.

## Verification

- `npm test -- src/components/FurtherLearning.test.tsx src/App.test.tsx` — PASS, 17 tests.
- `npm test` — PASS, 14 files / 55 tests.
- `npm run build` — PASS.
- `node ..\\PaperSkill\\paper-skill\\scripts\\validate-output.js .` — PASS: 6 chapters, 11 active modules, and all 11 component IDs registered.
- Targeted legacy-data search found no `VideoLearningTask`, `videoTask`, `embedHref`, `VIDEO_PROGRESS_STORAGE_KEY`, or `video-learning-progress` in the footer component/data model.

## Concerns

- Browser visual QA was not run because no connected browser session was available. Automated interaction, build, and validator checks completed.
- No deployment, PR, Git initialization, or Git mutation performed.

## Review fix — modal containment and footer CSS

The review finding was reproduced from the component structure: both dialogs were nested in the page footer, only declared `aria-modal`, and had no background isolation or Tab boundary; the player also lacked a viewport-bounded overlay. The fix moves both dialog variants to one body portal host and one full-screen modal layer. While a dialog is open, all other body children receive `inert` and temporary `aria-hidden`, with their prior attributes restored on close or unmount. The modal layer traps Tab and Shift+Tab, returns focus to the initiating playback button, and provides a sticky close control inside a `max-height: calc(100dvh - 24px)` scrolling player. The cross-origin iframe is excluded from the keyboard tab sequence so keyboard users remain in the reliable parent-document close/fallback loop.

RED: the new consent test failed because the rendered tutorial background had no `inert`; the player test failed because its dialog parent was the footer rather than a portal layer. A follow-up iframe keyboard-boundary test failed because the iframe had no `tabindex="-1"`. GREEN: all four footer tests pass after the portal/focus implementation. The stylesheet was replaced with only the current footer and modal selectors; no legacy tabs/task/self-check/preview rules remain, and the new `.further-footer-glyph` owns explicit 38×30 dimensions.

Fresh verification: `npm test -- src/components/FurtherLearning.test.tsx src/App.test.tsx` PASS (19 tests); `npm test` PASS (14 files / 57 tests); `npm run build` PASS; `node ..\\PaperSkill\\paper-skill\\scripts\\validate-output.js .` PASS (6 chapters, 11 active modules, 11 component IDs). Browser visual QA remains not run because no connected browser session is available.

## Review fix round 2 — preserve embedded-player keyboard access

The re-review correctly found that the previous iframe `tabIndex={-1}` workaround removed the real Bilibili player from the keyboard sequence. The iframe is now explicitly `tabIndex={0}` and is included by the dialog focusable selector. The player focus order is close button → iframe → original-page fallback link; the existing trap wraps the fallback link to close and Shift+Tab wraps close to the fallback. This preserves a visible, sticky parent-document close action without treating the cross-origin iframe's internal Escape handling as something the parent page can intercept.

RED: the revised test failed because the iframe did not expose `tabindex="0"`. GREEN: after restoring a normal focusable iframe, the test verifies its focusability and the DOM focus order alongside the existing modal-boundary loop checks. JSDOM does not emulate native Tab traversal out of a cross-origin iframe, so the test asserts the platform-visible tab contract and ordered focusable DOM nodes rather than treating that simulator limitation as a product behavior.

Fresh verification: targeted footer test PASS (4); footer+App PASS (19); full suite PASS (14 files / 57 tests); build PASS; validator PASS (6 chapters, 11 active modules, 11 component IDs).
