# Task 4 Implementer Report — CMCV Truth Boundary, Compact Render Bench, and Integration

## Scope and root causes

- Modified only the Task 4 component/tests/styles, `App.test.tsx`, `README.md`, this report, and the required progress log.
- CMCV previously omitted the unavailable-GT slot, called external agreement a reliable answer, and used three large drag lanes. Its responsive CSS also hid target C and the `C ≠ 外部共识` relation.
- Render Forensics previously used the tall `mergedCells` crop, placed controls outside a shared bench, and stacked two code cards vertically beside an oversized canvas.
- No Git, PR, deployment, dependency, external API, PaperSkill template, registry ID, or Bilibili change was made.

## RED → GREEN evidence

### CMCV semantics

Initial command:

`npm test -- src/experiences/CmcvRoutingChallenge.test.tsx`

Observed RED: 4 expected failures / 1 pass. The missing thumbnail/GT evidence strip, missing single choice group/outcome, old reliable-answer wording, and old restore surface caused the failures.

GREEN: 5/5 passed after the first minimal implementation.

### Render media/layout/state

Initial command:

`npm test -- src/experiences/RenderForensics.test.tsx`

Observed RED: 4 expected failures / 1 pass. The old crop, absent two-sibling bench, absent desktop/mobile caps, old repair action, and incomplete boundary caused the failures.

GREEN: 5/5 passed after the first minimal implementation; the reduced-motion terminal-frame regression was then added.

### Independent height-budget correction

The controller pre-review identified that both internal headers repeated chapter framing, CMCV hid causal evidence at narrow breakpoints, and the Render sidecar remained taller than its canvas. New tests were written first.

Observed RED: 3 expected failures across the two targeted files: duplicate headers/source row, missing 116px/72px CMCV caps, missing 270px Render canvas/two-column code contract.

GREEN: 12/12 targeted tests passed after removing duplicate headers, merging CMCV truth caution into its single outcome tray, moving sources/boundaries to collapsed 44px group notes, retaining C/inequality at every breakpoint, making Render code cards horizontal, and fixing the desktop canvas at 270px (mobile cap 300px).

## Implemented behavior

- CMCV now presents `真实 PDF 输入 → GT：不可用 → 目标输出 C ≠ 外部共识 A = B` with the real `omni-output/originalPdf` thumbnail and teaching-labeled A/B/C outputs.
- One mutually exclusive Easy/Medium/Hard group reveals exactly one Medium tray. Its label source is `外部共识伪标签（非 GT）`; the same tray says `共识不等于真值` and gives the supervised-training destination.
- Valid `cmcv-router/easy|medium|hard` and `cmcv-trust/consensus:correct` restores are atomic and callback-free; invalid state is inert; user completion fires once.
- Render uses `omni-table/mergedCellTable`, `variant="stage"`, and crop-first viewing. Its bench has exactly two direct siblings: a 270px landscape canvas and a compact 260–300px sidecar.
- Slider, two horizontal code/diff cards, and repair action are all in the sidecar. Buckets remain `<50=p0`, `50..99=p50`, `100=p100`; moving the slider clears repaired state. Reduced motion starts at the fully revealed p100 frame.
- The repair terminal state shows `<td colspan="2">总计</td>` and `教学演示已应用`, without a performance or data-membership claim.
- Sequential access regression now opens all six chapters with five `进入下一章` clicks while progress remains `0 / 6` and no `chapter:*` token is written. Registry contracts remain six chapter experiences and eleven explicit widget IDs. The all-unlocked DOM has no nested button/link markup or legacy runtime surface.
- README now documents the one-screen baseline, sequential access independent of completion, six-slot Step 01, functional DDAS microscope, GT-unavailable CMCV, bounded Render bench, crop-first viewer, and optional page-tail Bilibili boundary.

## Fresh verification

- Task 4 targeted suite: PASS — 3 files / 30 tests.
- Full suite: PASS — 17 files / 98 tests.
- `npm run build`: PASS — TypeScript and Vite, 65 modules transformed.
- Official PaperSkill validator: PASS — 6 chapters, 11 active modules, 11 registered component IDs.
- Runtime scans: PASS — zero legacy runtime, fetch/XHR/JSONP/script-injection, infinite-animation, U+FFFD/common-mojibake findings; strict UTF-8 decoding passed.
- Media crop/bounds and `mergedCellTable` aspect checks: PASS through the full test suite.
- HTTP smoke check: PASS — 13/13 responses returned 200 for `/`, six local images, and six experience source routes on the existing `127.0.0.1:5174` server.

Browser visual QA: NOT RUN — no browser connection available

