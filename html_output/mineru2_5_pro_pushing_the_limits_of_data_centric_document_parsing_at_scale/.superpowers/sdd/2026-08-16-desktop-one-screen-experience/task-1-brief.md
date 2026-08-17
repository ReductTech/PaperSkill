# Task 1 Brief — Free Chapter Progression and Desktop Chapter Shell

## Context

The current tutorial requires a semantic interaction completion token before the next chapter can be unlocked, and chapter cards have no desktop viewport-height budget. This task changes only navigation/access and the chapter shell; it must not alter the six experience implementations or their completion semantics.

## Files

- Modify `src/components/ProgressiveChapter.tsx`
- Modify `src/components/ProgressiveChapter.test.tsx`
- Modify `src/App.test.tsx`
- Modify `src/styles/chapter-unlock.css`
- Modify `src/styles/paper.css`
- Modify `src/styles/elf-inspired.css`
- Create `src/styles/desktop-one-screen.test.ts`

## Required behavior

1. When `nextId` exists, “进入下一章” is enabled even if `completed` is false.
2. Clicking it unlocks exactly the next chapter and scrolls/focuses there through the existing continuous-prefix unlock hook.
3. `completed` and `chapter:<stepId>` remain learning-progress signals only; entering Step 2 without operating Step 1 must leave progress at `0 / 6` and must not write `chapter:step-1`.
4. A direct locked Step 3 hash still cannot skip Step 2 or inject state into an earlier experience.
5. Copy: incomplete state says `可直接继续；完成实验后会记录学习进度`; the button says `进入下一章`.
6. At `@media (min-width: 1024px) and (min-height: 700px)`, `.process-step` is a one-screen grid with `block-size: calc(100svh - var(--header-height))`; external vertical margins are removed; the chapter reveal can shrink; the footer occupies the final row. Only the opened evidence body may scroll.
7. Under 1024px width or 700px height, retain natural document flow. Do not reduce body copy below 16px or controls below 44×44px.
8. Keep tutorial width near 1120px at large desktops and do not alter mobile horizontal-overflow safeguards.

## TDD sequence

1. Add a failing ProgressiveChapter/App test for unlocked-next-without-completion and unchanged 0/6 progress.
2. Run `npm test -- src/components/ProgressiveChapter.test.tsx src/App.test.tsx`; record the expected disabled-button failure.
3. Implement the smallest access/completion decoupling.
4. Create a failing CSS contract test that parses the final runtime styles and verifies the desktop gate, fixed chapter block size, shrinkable reveal, no external chapter margin, and absence of that fixed block size from narrow/short-screen rules.
5. Implement the desktop chapter shell and neutralize the later conflicting `.process-step` rule in `elf-inspired.css`.
6. Run targeted tests, full tests, `npm run build`, and `node ..\PaperSkill\paper-skill\scripts\validate-output.js .`.

## Constraints

- Preserve 6 chapters, 11 active modules, 11 explicit widget registrations, glossary/hash restoration, and all experience completion tests.
- No new runtime dependency, external API, legacy mode, deployment, PR, or Git initialization.
- Use `apply_patch` for edits and follow RED → GREEN.
- Report exact commands/results and any browser-QA limitation.
