# Task 4 Brief — CMCV Truth Boundary, Compact Render Bench, and Final Integration

## Objective

Make Step 03 explicitly teach that ground truth is unavailable and that external consensus is a pseudo-label, rebuild Step 04 as a bounded horizontal forensic bench, then run full integration verification. Follow RED → GREEN TDD and do not ask the user further questions.

## Allowed files

- `src/experiences/CmcvRoutingChallenge.tsx` and test
- `src/experiences/RenderForensics.tsx` and test
- `src/styles/experience-labeling.css`
- only necessary integration rules in `src/styles/paper.css`
- `src/App.test.tsx`
- `README.md`
- progress and task report.

Assume Task 2 provides `PaperMedia` display/viewer variants and `omni-table/mergedCellTable`. Do not change registry/tutorial IDs, Bilibili footer, external APIs/dependencies, PaperSkill templates, Git, PR, or deployment.

## RED/GREEN 1 — CMCV

Write failing behavior tests before production code:

1. Initial evidence strip shows `真实 PDF 输入`, exact `GT：不可用`, `目标输出 C`, `外部模型 A`, `外部模型 B`, accessible `A = B` and `C ≠ 外部共识`. GT is a dashed empty slot, never an output card.
2. The real input uses `omni-output/originalPdf` as a compact crop; one group-level source/boundary states it only illustrates a document task.
3. Initial state has no outcome. Selecting Medium shows exactly one outcome tray with:
   - `路由：Medium`
   - `标签来源：外部共识伪标签（非 GT）`
   - `训练去向：采用外部共识进入监督训练池`
4. The component never says `可靠外部答案`. Concrete A/B/C outputs remain `教学示意`.
5. Keep one mutually exclusive 44px Easy/Medium/Hard choice group; remove redundant drag/lane choreography. Any answer reveals the correct Medium relation immediately; do not require a second click.
6. Preserve callback/state contracts for `cmcv-router/easy|medium|hard` and `cmcv-trust/consensus:correct`; complete exactly once. Restore states atomically without callbacks; invalid state is inert.
7. Preserve point-of-use glossary buttons without nesting interactive controls.

Confirm RED then implement GREEN:

```powershell
npm test -- src/experiences/CmcvRoutingChallenge.test.tsx
```

Target a compact evidence strip about 400–460px total at desktop: input → GT unavailable → C → A=B, followed by choices and one outcome tray. Mobile wraps naturally with >=16px body text.

## RED/GREEN 2 — Render Forensics

Write failing tests first:

1. Main media is `data-asset-id="omni-table" data-crop-id="mergedCellTable" data-variant="stage"`, viewer crop-first. Caption says merged-cell/cross-column structure, not formula.
2. `render-forensics-bench` has two direct siblings: canvas and sidecar. Slider, source code, diff, and repair action all live in the sidecar.
3. Raw CSS contract at desktop gate: bench columns equivalent to `minmax(0,720px) minmax(260px,300px)` and stage/canvas max block size <=420px. At <=760px use one column and max block size <=300px.
4. Preserve stable states: `compare-p0`, `compare-p50`, `compare-p100`, `repaired`. Slider buckets remain `<50=p0`, `50..99=p50`, `100=p100`; any slider change clears repaired before reporting compare state. Invalid restore is inert.
5. Repair only appears at sufficient reveal progress and completes once. After repair, code visibly includes `<td colspan="2">总计</td>` and feedback says `教学演示已应用`.
6. Boundary states that OmniDocBench crop only illustrates a merged-cell challenge; render error/code/repair are teaching constructions; no repair-rate or training/Hard-subset claim.

Confirm RED then implement GREEN:

```powershell
npm test -- src/experiences/RenderForensics.test.tsx
```

Use a left compare canvas and right compact sidecar. Reduced motion must land directly in the final state.

## Integration RED/GREEN

Extend App tests before changes where relevant:

- From empty storage, click each current chapter's `进入下一章` five times; all six experiences become available while progress remains `0 / 6` and no `chapter:*` token is written.
- Experience registry keys remain exactly `step-1..step-6`; widget registry remains the established 11 explicit IDs.
- After full unlock, each of six named experience surfaces appears once; no old GuidedTour/Presentation/StepConceptVisual/LearningLab/RealDocumentCases/video-learning task surface.
- No nested interactive markup: `button button, button a, a button, a a` all absent.
- Keep Task 1 baseline shell tests and Task 2 media/Step01 caps.

README must document: sequential access without interaction gating; 1366×768 chapter core/1120px width cap and natural flow on narrow/short screens; Step01 six-slot strip; Step02 real DDAS microscope; Step03 `GT：不可用` and non-GT consensus pseudo-label; Step04 bounded forensic bench; crop-first viewer; Bilibili only as optional page-tail material.

## Final verification

Run fresh:

```powershell
npm test -- src/experiences/CmcvRoutingChallenge.test.tsx src/experiences/RenderForensics.test.tsx src/App.test.tsx
npm test
npm run build
node ..\PaperSkill\paper-skill\scripts\validate-output.js .
```

Then scan:

- old presentation/guided components absent from runtime source;
- no runtime fetch/XHR/JSONP/script injection;
- no infinite CSS animations;
- no mojibake/U+FFFD; strict UTF-8;
- all crops remain within bounds and mergedCellTable aspect is >=1.4;
- no nested interactive elements.

HTTP-check `/`, six local images, and six experience source routes against the existing local Vite server without killing the unknown 5173 listener. Only use the in-app browser for visual QA if a connection exists; otherwise record exactly `Browser visual QA: NOT RUN — no browser connection available` and do not claim real viewport geometry.

Write `task-4-implementer-report.md`, append progress, and preserve 6 chapters / 11 active modules / 11 explicit registrations.
