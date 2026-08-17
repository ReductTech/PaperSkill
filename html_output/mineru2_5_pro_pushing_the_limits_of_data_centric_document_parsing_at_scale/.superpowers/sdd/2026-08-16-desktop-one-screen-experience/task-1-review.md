# Task 1 Independent Review — Free Chapter Progression and Desktop Chapter Shell

## Verdict

**FAIL**

Task 1 passes its automated suite and preserves validator counts, but it does not yet satisfy the approved navigation copy/semantics or the no-clipping desktop shell requirement. No source files were modified during this review.

## Critical findings

None.

## Major findings

### 1. The bounded desktop shell can hide chapter content instead of fitting it

- `src/styles/elf-inspired.css:276-283` fixes `.process-step` to the viewport budget and applies `overflow: hidden`.
- `src/styles/chapter-unlock.css:199-204` also applies `overflow: hidden` to `.chapter-unlock-reveal`.
- The real reveal contains the heading, problem copy, `.chapter-experience`, evidence, and for Step 6 the research/further-learning sections. Neither `.chapter-experience` nor those Step 6 additions receive a shrinkable grid/flex slot in Task 1. Their intrinsic height can therefore exceed the available row and be clipped with no scroll path.
- The CSS test cannot detect this: `src/styles/desktop-one-screen.test.ts:38-55` mounts an empty `.chapter-experience`, so there is no overflowing key experiment in the fixture. It checks declarations, not whether `scrollHeight <= clientHeight` or whether the main controls/footer remain reachable.

This conflicts with the approved requirement that the chapter shell must not truncate the key experiment and that only an opened evidence body may scroll. The later Step 01–04 redesigns may reduce some content, but Task 1 currently makes the shell unsafe for all existing chapters, especially the extra Step 6 content.

### 2. The locked-card instruction still tells users that completion is required

`src/components/ProgressiveChapter.tsx:122` displays:

> 先完成上一节的观察与实验，再沿研究问题继续推进。

That directly contradicts the new access model. The user only needs to press the previous chapter's sequential navigation button; no experiment completion is required. The regression tests never assert this locked-state copy, so they pass while the page communicates the old rule.

## Minor findings

### 1. Required button copy was changed and the tests were adapted to the mismatch

The approved spec, implementation plan, and Task 1 brief consistently require `进入下一章`. The implementation uses `进入下一章节` at `src/components/ProgressiveChapter.tsx:165`, and both behavior tests search for that changed string. Functionality is unaffected, but the implementation does not match the accepted copy contract.

### 2. The CSS contract test omits two explicit checks and does not mirror runtime ordering

- The plan requires a max-width assertion near 1120px, but `src/styles/desktop-one-screen.test.ts` does not assert `.tutorial-layout` width.
- The desktop baseline is 1366×768, while the only desktop fixture is 1280×800 (`src/styles/desktop-one-screen.test.ts:89`). The media query triggers in both cases, but the test does not represent the height budget requested by the user.
- `RUNTIME_CSS` is assembled as `paper → elf-inspired → chapter-unlock` at line 6, while the production bundle places component-imported `chapter-unlock.css` before the main stylesheet imports. Current selector specificity happens to preserve the tested values, but this ordering can mask future cascade regressions.

### 3. The visual status marker conflates access with completion

At `src/components/ProgressiveChapter.tsx:147`, the green checkmark appears when either `completed` or `nextUnlocked` is true. Thus an unfinished chapter shows `✓` immediately after the learner advances, even though the top progress correctly remains `0 / 6`. The adjacent text says the next chapter is unlocked, but the checkmark reads as a completion marker and weakens the intended access/progress separation.

## Behavior review

- **Next chapter before completion:** Functional. `canAdvance = Boolean(nextId)` and the existing continuous-prefix hook unlock exactly the immediate successor.
- **Completion/progress storage:** Functional in tests. Advancing without interacting leaves the progress counter at `0 / 6` and does not add `chapter:step-1`.
- **Hash protection:** Existing tests still prevent a locked Step 3 hash from rendering Step 3 or mutating Step 1 state.
- **Natural flow below the gate:** The fixed block size is absent at 1023px width and 699px height in the CSS contract test.
- **Desktop no-clipping guarantee:** Not established; the current overflow rules can clip real content as described above.

## Verification run

1. `npm test -- src/components/ProgressiveChapter.test.tsx src/App.test.tsx src/styles/desktop-one-screen.test.ts`
   - PASS — 3 files, 22 tests.
2. `npm test`
   - PASS — 16 files, 70 tests.
3. `npm run build`
   - PASS — TypeScript and Vite production build; 65 modules transformed.
4. `node ..\PaperSkill\paper-skill\scripts\validate-output.js .`
   - PASS — 6 chapters, 11 active modules, 11 explicit registrations.

## Browser QA

Not run because no connected in-app browser session was available. The static CSS tests must not be treated as real geometry verification.

## Required disposition

Before Task 1 can pass review:

1. remove the contradictory completion-required locked copy;
2. use the approved `进入下一章` label;
3. revise the chapter shell so real chapter children do not disappear behind `overflow: hidden`, including Step 6's non-core footer material;
4. strengthen the CSS contract with the 1366×768 baseline, the 1120px width cap, actual runtime stylesheet order, and a non-empty overflow fixture (while still recording real-browser geometry QA as not run).
