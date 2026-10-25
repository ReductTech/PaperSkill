---
name: "paper-skill"
description: "Create a Simplified Chinese interactive PPT-style React + TypeScript tutorial from an AI or machine-learning paper provided as a PDF, text, URL, or detailed description. Use for paper-to-teaching-web-app requests; deliver a self-contained project folder."
---

# Paper Tutorial Generator

Turn one machine-learning or AI paper into one self-contained Simplified Chinese interactive tutorial delivered as a **React + TypeScript (Vite) project folder**. Preserve the two-phase design, but execute both phases continuously in the same task.

Agent-facing guidance is in English; exact tutorial copy and examples may be in Chinese. The final tutorial uses **Simplified Chinese**, except the official English paper title, symbols and established technical names.

## Single Source of Truth

All hard numeric constraints and the color semantics are canonical in **`contract.md`**.
Human-facing summaries may repeat a value only with a reference to the relevant section;
scripts must load thresholds from the contract rather than hard-code another copy. If a
summary disagrees with `contract.md`, the contract wins.

## Required Outcome

Produce exactly one persistent deliverable in the caller's original working directory:

`<paper-short-name>_output/`  — a self-contained React + TypeScript (Vite) project folder.

Use a paper-specific skill only as an internal intermediate artifact. Create it under a
task-scoped temporary root, consume it immediately, and remove it before the final
response (unless `PAPER_SKILL_DEBUG=true`; see below). Never write that intermediate skill
under `skills/`, the workspace, or another persistent location. Never expose its path or
contents to the user.

The same temporary root contains one canonical `source-cache/`. Parse the supplied PDF,
LaTeX, text, URL, or description into that cache once, validate it, and use only the cached
record for the rest of Phase 1. Do not persist or deliver the cache.

## Continuous Two-Phase Contract

```text
paper PDF, text, URL, or description
  -> Phase 1: parse once into a validated source-cache
  -> analyze the cached paper record and build a temporary paperSkill
  -> validate the temporary paperSkill against the Phase 1 checklist
  -> Phase 2: immediately execute that paperSkill
  -> scaffold the React+TS project folder (scaffold.js)
  -> generate isolated chapter packets in parallel when safe, or sequentially as a fallback
  -> assemble tutorial.ts / registry / modules once (assemble-chapter-packets.js), then fill paper.css / images
  -> parse every assembled source with syntax-check.js (TypeScript/esbuild) before preview
  -> validate the project folder (validate-output.js)
  -> delete the exact task-scoped temporary root (unless debug)
  -> return only the final folder path
```

Do not stop, ask for confirmation, or send a final response between phases. If either phase
is blocked, clean up the exact task-scoped temporary root before reporting the blocker.

## Phase 1 Required Reading (rules for building the intermediate skill)

Read these files before planning the intermediate paperSkill. Stage their Markdown source
with `stage-template.js` so Phase 2 can review the same global rules while implementing
the paper-specific slide plan.

1. `contract.md` — all hard numbers and color semantics (read first).
2. `scripts/generation-pipeline.md` for the complete execution sequence.
3. `references/philosophy.md` for the instructional design principles.
4. `references/metaphor-library.md` for selecting one unified everyday theme and different paper-mapped episodes.
5. `references/animation-library.md` for recognizable, varied everyday-story scenes.
6. `references/interaction-patterns.md` for the core-method design test, assets behavior references and interaction patterns P1–P8. Inspect the cited demo functions after selecting the current paper's theme; borrow behavior, not demo content.
7. `references/visual-interaction-standard.md` for the universal Canvas grammar, interaction compositions, technical insets, color pairing, and cross-domain adaptation rules.
8. `scripts/chapter-template.md` for flexible chapter planning.
9. `templates/skill-template.md` for the temporary paperSkill structure.
10. `references/intermediate-skill-standard.md` for the expected intermediate Skill detail and section order.
11. `scripts/validation-checklist.md` for both validation gates and cleanup.
12. `references/presentation-standard.md` for the benchmark scene format, page schema,
    shared typography, player chrome, speaker notes and thumbnail capture workflow.
13. `assets/layout-gallery/catalog.md` and `index.html` for varied slide compositions; use them to plan each page, not as a runtime layout schema.

## Phase 2 Global Reading Scope

The intermediate skill is the **per-slide content plan**, not the sole instruction source.
Before coding, Phase 2 reviews the staged global guides and assets together:

- the temporary intermediate `SKILL.md` (paper-specific evidence and slide plan), and
- `assets/global-guides/SKILL.md`, `contract.md`, relevant `references/` and `scripts/*.md`
  (global rules, source boundaries, interaction and presentation standards), and
- the `assets/react-template/` directory copied beside it (the full Vite+React+TS scaffold), and
- the `assets/layout-gallery/` catalog and visual slide examples copied beside it (planning references, not output assets), and
- `assets/layout-gallery/teaching-demo/` — reference-only source from the runnable assets example; inspect its shared-state scene/control/calculation behavior, then implement the current paper's own mechanism, and
- `scaffold.js` — a portable build helper that sits beside `assets/` in the temporary
  root and copies the template into the caller's working directory (run it, do not modify it), and
- `assemble-chapter-packets.js` — the single-writer helper that merges isolated chapter data and
  widgets into `src/data/tutorial.ts` and `src/modules/registry.tsx`, and parses the assembled
  sources so a truncated widget fails during assembly instead of in the repository CI, and
- `syntax-check.js` — the shared TypeScript/esbuild syntax gate used by assembly and the final
  validator; run `node syntax-check.js <outputDir> --require-parser` as a hard gate after
  `npm install`, and
- `contract.md` — copied validator configuration, matching the staged global contract, and
- `validate-output.js` — the hard structural gate (it also runs the syntax gate
  when dependencies are installed).

Selected original figures are copied from the validated source cache into the temporary
scaffold's `public/images/` during Phase 1. Phase 2 may consult the validated
`source-cache/` for a factual ambiguity, but must not invent evidence or reopen an
unvalidated source. Hard numbers and color semantics come from the global `contract.md`;
paper facts and approved interpretations come from the intermediate plan and validated cache;
runtime fields come from `assets/react-template/src/types.ts`. If the plan conflicts with a
global rule or actual schema, correct the plan before implementation. The helper scripts are
portable build tools — run them unchanged.

## Phase 1 Summary

Follow all steps in `scripts/generation-pipeline.md`:

1. Read the paper source once, materialize `source-cache/` with normalized content, locators,
   metadata, figure inventory, and evidence rows, then run `scripts/validate-source-cache.js`.
2. Apply the four instructional design principles.
3. Decompose the paper into its actual problem, insight, method, evidence, limitations and terminology; add architecture, training or inference only when applicable.
4. Build a source-evidence matrix for every core claim, formula, architecture condition, and
   reported result before designing the tutorial. For each proposed life interaction, add a
   mapping from physical action to paper variable/component, formal relation, source locator,
   observable prediction, and analogy boundary.
5. Compare several paper-specific theme candidates and lock the best fit. Plan distinct
   related episodes where an analogy helps; mark other pages as paper-native technical
   interactions or evidence views rather than inventing a life episode for every slide.
6. Choose chapter boundaries from the paper's questions and plan the full deck per `contract.md` §2. Aim for about 10–15 teaching slides when the content supports them; this is guidance, not a validator limit. Pick a `paperType` per §2.2.
7. Lock one shared chapter contract: evidence boundaries, chapter roles and dependencies, terminology,
   symbol meanings, theme, visual kit, state conventions, and output schema.
8. Assign life-animation scenes where useful and paper-native interaction patterns elsewhere. Draft disjoint chapter packets
   concurrently only when the Agent supports isolated parallel work; otherwise draft the same packets sequentially.
9. Design core-method experiments using the causal specification in `references/interaction-patterns.md`. Map the central contributions to learner-operated computations, not benchmark selectors. Inspect the assets behavior demo and compose life/hybrid/technical scenes around those operations.
10. Extract a concise formula and symbol inventory, then run one coordinator consistency pass across all packets.
11. **Optionally** find and verify relevant Bilibili videos (best-effort; see `contract.md` §7).
12. Consider important original method/architecture figures as optional teaching material per `contract.md` §11. Record selected figures and their page arrangements in the intermediate plan, then stage the cached images into the temporary React scaffold.
13. Materialize the paper-specific skill under the same task-scoped temporary root.
14. Validate the temporary paperSkill against the Phase 1 checklist. Run `validate-output.js`
    only after the React project has been assembled.

After Phase 1 passes, review the generated temporary `SKILL.md`, staged `assets/global-guides/`, `assets/layout-gallery/`, and `assets/react-template/` together, then immediately execute Phase 2.

## Non-Negotiable Output Rules

1. Write all visible tutorial prose in natural Simplified Chinese.
2. Generate one React + TypeScript (Vite) project folder named `<paper-short-name>_output/`. Fill `src/data/tutorial.ts` (typed by `src/types.ts`), set paper-specific `:root{}` overrides in `src/styles/paper.css`, and author each chapter's freely composed JSX/Canvas scene in `src/modules/*`. Register each scene widget in `src/modules/registry.tsx`; never replace the shared PPT player with handwritten page markup.
3. Do not use KaTeX, MathJax, CDNs or external fonts. Local media belongs in `public/images/` (paper figures) and `public/thumbnails/` (page screenshots). Reference all local `public/` resources with page-relative URLs, such as `./images/fig1.png`, `./thumbnails/cover.jpg` or `./media/demo.mp4`, including scene thumbnails and cover images. Import assets stored under `src/` through Vite; resolve CSS `url()` paths relative to the stylesheet. The only runtime dependencies are `react` and `react-dom`; the only optional network feature is the Bilibili metadata loader. Use semantic MathML in custom bodies when simple HTML formulas cannot express the structure faithfully.
4. Do **not** edit framework files by hand: `src/components/*`, `src/lib/*`, `src/styles/{tokens,components,presentation}.css`, `App.tsx`, `main.tsx`, `vite.config.ts`, `tsconfig*.json`, and `package.json` (beyond scaffold injection). Author paper content only in `src/data/tutorial.ts`, `src/styles/paper.css`, `src/modules/*`, `public/images/*` and `public/thumbnails/*`. The assembler writes data, registry and derived `outlines.json`; scaffold injects the title.
5. Select one anchor everyday theme through the paper-specific candidate process in `references/metaphor-library.md`: consider different activity families, test their episode variety and mechanism fit, and record why the winner is stronger than the main alternative. All documented activities are equal examples and receive no automatic priority.
6. Lock one paper-specific everyday activity before writing scenes. Use it to introduce
   the problem and recur where it clarifies a mechanism; do not make every page depict
   its protagonist or prop. Every page carries a recognizable theme visual. On static or
   paper-native pages, use a small, clear theme illustration or object connected to the
   current explanation, conditions or conclusion, per `contract.md` §3.
7. Draw recognizable life events, not a labeled dot tracing a line or the same abstract path under new terminology. Keep each scene readable at fitted slide size.
8. Do not disguise an abstract processing pipeline as packages moving through labeled stations. A physical activity is usable when its specific action faithfully explains the paper mechanism; the setting alone does not establish a teaching analogy.
9. Do not use abstract particle clouds, arrow grids, heat maps, vector fields, or purely mathematical wave plots as automatic analogy animations. Body pages may use readable equations, curves, feature maps and verified charts to teach the actual paper mechanism, but not abstract node/flow diagrams as the main explanation.
10. The opening may be purely life-based animation; end it with the paper's core method.
    In subsequent pages, choose life, hybrid or paper-native views according to what the
    learner must manipulate and understand. Place formal material where it answers that
    page's question at a readable size; do not bolt a generic evidence card onto every scene.
11. Explain nontrivial network structure through a recognizable life event and a readable architecture consequence somewhere in the sequence, never by an abstract node-flow diagram alone. If the paper has no nontrivial network, teach its actual central mechanism in an active technical module (per `contract.md` §2.2).
12. Make interaction the main teaching medium. Give the core method substantial meaningful interactive coverage; evidence or boundary chapters may use `modules: []`. Use the deck-wide mix in `contract.md` §3: theme-grounded animated interactions follow the planning target in that section, and varied episodes from the chosen theme recur in the early, middle and late stages. Keep occasional static derivation/evidence pages purposeful and return to a core-method interaction in the later application or limitation section. Add pages only for distinct teaching questions.
    Apply `contract.md` §3: core-method pages should predominantly be learner-operated mechanisms. Benchmark/chart controls are supporting evidence and cannot substitute for those experiments. Use the assets behavior example as well as the layout gallery.
13. Give each module one dominant learner operation. It must alter a paper-relevant
    variable, structure, constraint or result and the main visual consequence, not merely
    a decorative image effect. Show immediate feedback from the same state. Record the
    paper source and analogy boundary in the evidence matrix and speaker notes.
14. Reuse one tutorial-wide Canvas drawing kit and restrained scene palette across the Hero and life-metaphor scenes. Keep the color semantics in `contract.md` §5 stable across chapters.
15. Use technical graphics where they teach an actual paper claim. When a curve, formula, feature view or architecture fact shares an interactive page, connect it to learner-controlled state. An exact result figure may be a static, readable record on its own page. Never make abstract nodes or flows the default life analogy.
16. Anchor every core factual claim to a paper section, page, equation, figure, or table in the Phase 1 evidence matrix. Mark interpretations as interpretations; never upgrade an inference into a paper claim.
17. State the conditions under which each architecture choice, training statement, comparison, and conclusion is valid. Do not present a conditional design choice as universal.
18. Verify every formula's symbols, shapes or dimensions, sign, normalization, and surrounding assumptions before using it in prose or an interaction. Every displayed teaching formula must expose concise Simplified Chinese symbol meanings on hover, keyboard focus and touch; use the shared `SymbolHint` component for custom bodies and the symbol inventory for `Formula`. See `references/interaction-patterns.md` for integration.
19. Record every result's dataset, split or evaluation protocol, baseline, unit, and metric direction. Prefer statistical charts for numerical experiment tables; choose the chart by the comparison question, following `references/presentation-standard.md` → Numerical experiment results. Never compare values from incompatible protocols or treat lower-is-better and higher-is-better metrics alike. Cover major ablations, transfer results, and limitations when the paper reports them.
20. Present the old-method limitation before introducing the paper's solution.
    Do not print generic on-slide headings such as “论文机制 / 证据”, “论文出处”, “来源 / 证据” or “实验 · 机制示意”. Keep source locators and analogy limits in the Phase 1 evidence matrix and speaker notes. Attribute an exact figure or number discreetly on-slide only when its interpretation requires it. Use a specific scientific heading or no subheading.
21. Render scene-based PPT pages per `contract.md` §§2.4–2.5 and `references/presentation-standard.md`. Chapters group multiple scenes; every page has one objective, a shared header and a freely composed body. Put the chapter marker at the header's upper right. Use at most the three body type roles from §2.5; remove redundant small labels and fill large unused areas with the actual mechanism or explanation. Review the whole-deck contact sheet for repeated imagery and silhouettes. Keep the fixed canvas, external navigation, mobile pinch zoom and device-width viewport.
22. **Bilibili videos are optional** (per `contract.md` §7). Include only relevant videos with established real BVIDs; never invent a link, cover or view count. Omit the section when lookup is unavailable or yields nothing suitable.
23. Continue directly from Phase 1 to Phase 2.
24. Remove the exact task-scoped temporary root on success or failure, unless `PAPER_SKILL_DEBUG=true`. Confirm that the root, source cache, and temporary paperSkill no longer exist before responding (or, in debug mode, that the root is preserved and its path is returned).
25. Deliver only the final `<paper-short-name>_output/` folder; do not list or describe the temporary paperSkill.
26. Never repeatedly parse or reopen the original paper after the canonical source cache passes
    validation. Later Phase 1 work reads the cache; Phase 2 reads the evidence-backed temporary
    skill and already staged figures. If the first extraction is unusable, replace the incomplete
    cache with one corrected extraction before continuing rather than performing ad hoc rereads.
27. Parallelize only disjoint chapter drafts after the shared tutorial contract is locked. Workers
    write isolated packets and never edit `tutorial.ts`, `registry.tsx`, `paper.css`, or another
    worker's files. One coordinator assembles shared files, checks cross-chapter terminology,
    evidence, transitions, duplication, and coverage, then runs every normal validation gate.
    When safe parallel execution is unavailable, use the identical packet contract sequentially.
28. Move the compile-time syntax check into the generation stage: after `npm install`, run
    `node syntax-check.js <outputDir> --require-parser` and `node validate-output.js <outputDir>`
    on the final project folder, then run `npm run build` inside `<outputDir>`. Any edit after
    these gates requires re-running them.
    A truncated or unbalanced widget TSX must never survive to a Pull Request. The validator
    checks essential files, widget registration and syntax. Confirm the generated project
    with a build and browser review.
29. Validate rendered slide fit per `contract.md` §2.4, using the bundled browser-side `auditSlide()` plus screenshot review. Phase 2 checks the staged global contract and browser checklist alongside its slide plan.

## Resource Map

```text
paper-skill/
|-- SKILL.md
|-- contract.md                  <- single source of truth for numbers + colors
|-- assets/
|   |-- global-guides/           <- staged Markdown rules for Phase 2 global review; not output assets
|   |-- layout-gallery/          <- visual slide references staged for Phase 2, never copied into output
|   `-- react-template/          <- Vite + React + TS scaffold copied into the output folder
|       |-- index.html
|       |-- package.json
|       |-- vite.config.ts / tsconfig*.json
|       |-- src/
|       |   |-- main.tsx, App.tsx, types.ts
|       |   |-- components/      <- framework UI (NOT edited by generator)
|       |   |-- lib/             <- canvasKit, hooks (NOT edited by generator)
|       |   |-- modules/         <- widget registry + paper-specific widgets
|       |   |-- data/tutorial.ts <- the ONLY data file the generator rewrites
|       |   `-- styles/          <- tokens.css, components.css, paper.css
|       `-- public/images/       <- optional original figures
|-- references/
|   |-- philosophy.md
|   |-- metaphor-library.md
|   |-- animation-library.md
|   |-- interaction-patterns.md
|   |-- visual-interaction-standard.md
|   `-- intermediate-skill-standard.md
|-- scripts/
|   |-- generation-pipeline.md
|   |-- chapter-template.md
|   |-- validation-checklist.md
|   |-- validate-source-cache.js  <- validates the temporary canonical paper cache
|   |-- stage-template.js        <- copies a demo-free scaffold into the temporary skill
|   |-- assemble-chapter-packets.js <- single-writer merge for isolated chapter drafts + syntax gate
|   |-- syntax-check.js          <- shared TypeScript/esbuild syntax gate
|   |-- validate-output.js        <- automated structural validator (folder)
|   `-- scaffold.js               <- React+TS project scaffolder (copied beside assets/)
`-- templates/
    `-- skill-template.md
```

Treat the Markdown files as Agent instructions. Stage `assets/` into the temporary paperSkill
with `node scripts/stage-template.js <temporary-paperSkill-directory>`. This stages the global
guides and neutral layout gallery while omitting the runnable mountain demo from the React
scaffold; only the React scaffold is copied into the final project.

## Planning and Presentation References

`references/intermediate-skill-standard.md` and `templates/skill-template.md` define the
paper-specific plan. `references/presentation-standard.md` defines scene composition,
cover playback, player behavior and rendered acceptance. Keep those rules in their canonical
references rather than copying them into the intermediate skill. Phase 2 reads the plan,
staged global guides, gallery and scaffold together.

## Debug Mode

If the environment variable `PAPER_SKILL_DEBUG` is set to `true`:

- Preserve the exact task-scoped temporary root, including `source-cache/`, packet work, and the temporary paperSkill.
- Return its absolute path to the caller alongside the final folder path so a human can inspect Phase 1 output.
- The delivered project folder is identical to non-debug mode.

Otherwise, delete the exact task-scoped temporary root as usual and never expose its path.
