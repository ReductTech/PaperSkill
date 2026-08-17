### Task 8: Remove Obsolete Surfaces, Responsive/A11y QA, and Documentation

**Files:**
- Delete: `src/components/StepConceptVisual.tsx`
- Delete: `src/components/LearningLab.tsx`
- Delete: `src/components/RealDocumentCases.tsx`
- Delete: `src/styles/step-concept-visual.css`
- Delete: `src/styles/real-document-cases.css`
- Modify: `src/main.tsx`
- Modify: `src/styles/elf-inspired.css`
- Modify: `src/styles/paper.css`
- Modify: `README.md`
- Modify: `docs/superpowers/progress/2026-08-16-mineru-interactive-tutorial-redesign.md`

**Interfaces:**
- Consumes: completed integrated experiences and tests.
- Produces: the final smaller runtime surface, responsive layout, and verified handoff documentation.

- [ ] **Step 1: Add legacy-surface regression assertions before deletion**

Extend `src/App.test.tsx` to assert that the rendered page does not contain `step-concept-visual`, `learning-lab`, `real-cases`, video task rails, or a standalone checkpoint card. Assert that the six registered experience components remain reachable after programmatically unlocking chapters.

- [ ] **Step 2: Run the regression test against the current files**

Run: `npm test -- src/App.test.tsx`  
Expected: the runtime assertions PASS after Task 7; the obsolete files still exist and will be removed next.

- [ ] **Step 3: Delete obsolete components and imports**

Delete the five listed files with `apply_patch`. Remove their imports from `main.tsx` and remove only their selector blocks from `elf-inspired.css` and `paper.css`. Do not remove Hero, glossary, paper viewer, module registry, or progressive-unlock styles.

- [ ] **Step 4: Complete responsive and keyboard rules**

At `max-width: 760px`, stack each experience without page-level horizontal overflow, keep local scroll only inside cluster/timeline strips, and expose full-width keyboard alternative controls. At `max-width: 420px`, keep body text at least 16px and controls at least 44px. Add `scroll-margin-top` for all chapter and media anchors. Ensure no keyframe is infinite.

- [ ] **Step 5: Update README**

Document:

- the six interaction types;
- local paper image provenance and limitations;
- footer-only Bilibili behavior;
- `npm test`, `npm run build`, and validator commands;
- offline boundary;
- no four-minute, speed-run, or independent video mode;
- no deployment or PR performed.

- [ ] **Step 6: Run the full automated verification suite**

Run fresh:

```powershell
npm test
npm run build
node ..\PaperSkill\paper-skill\scripts\validate-output.js .
rg -n "StepConceptVisual|LearningLab|RealDocumentCases|video-learning-task|GuidedTour|PresentationMode" src
```

Expected: tests PASS; build exits 0; validator PASS with six chapters and eleven active modules; `rg` exits 1 with no legacy matches.

- [ ] **Step 7: Check local runtime and assets**

With the existing dev server or `npm run dev -- --host 127.0.0.1`, request `/`, all six local image files, and the six experience source modules. Expected: HTTP 200 for every request. Disconnect the network and verify that all chapter experiences and glossary entries still render; only source links and Bilibili playback may fail.

- [ ] **Step 8: Perform browser visual/interaction QA when a browser connection is available**

Test 1366脳768 and 360脳800:

- no passive empty slot in Steps 1, 3, 5, or 6;
- the active navigation follows unlocked chapter position;
- all six primary interactions work with pointer and keyboard;
- the training timeline can pause, scrub, step, and replay;
- Figure 2/3 viewer is centered on desktop and usable as a mobile sheet;
- body has no page-level horizontal overflow;
- reduced-motion shows stable final states.

If no browser connection is available, append exactly `Browser visual QA: NOT RUN 鈥?no browser connection available` to the progress ledger; do not mark those checks as passed.

- [ ] **Step 9: Record final checkpoint**

Append the exact test/build/validator results, HTTP checks, browser-QA status, changed-file inventory, and the statement `No deployment, PR, or Git initialization performed.` to the progress ledger.

---

## Execution Order and Review Gates

Execute Tasks 1鈥? in order. Tasks 3, 4, and 5 are implementation-independent after Task 2 and may be assigned to separate implementers only if each receives exclusive file ownership; integration remains Task 6. Review each task against its tests and the approved design before proceeding. A build failure caused by another in-flight task does not count as success; wait for a stable filesystem and rerun the full command.

## Final Requirement Trace

- Diverse interaction rhythms: Tasks 3鈥?.
- More video-like explanation without a separate mode: Tasks 2, 3, and 5.
- Higher user control and clarity: Tasks 3鈥?.
- Real PDF imagery throughout the tutorial: Tasks 1鈥?.
- Bilibili only as final supplement: Task 7.
- Reduced repetition and page length: Tasks 6鈥?.
- Clickable terms and centered paper figures: preserved and verified in Tasks 2, 6, and 8.
- Six chapters, eleven active modules, deep links, progressive unlock, offline core: Tasks 1, 6, and 8.
