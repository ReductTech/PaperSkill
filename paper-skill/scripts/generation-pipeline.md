# Generation Pipeline

Execute all steps in order. Phase 1 and Phase 2 are one continuous operation. Do not return after Phase 1.

## Step 1: Build and Validate the Canonical Source Cache

Accept a local PDF, pasted text, an arXiv or paper URL, or a sufficiently detailed user description. Before opening the source, create one task-scoped temporary root with the environment's standard temporary-directory facility. Resolve and record its absolute path, then create `source-cache/` beneath it.

Use the available document or web tools to perform one complete source pass. Materialize this cache:

```text
<task-temp-root>/
`-- source-cache/
    |-- manifest.json
    |-- content.md
    |-- evidence.json
    `-- figures/          <- extracted original figures when available
```

- `content.md` contains the normalized complete text. Preserve explicit page markers for PDF input and stable file/section markers for LaTeX input so every later locator can resolve without reopening the source.
- `figures/` contains usable original figures extracted during the same source pass. If an image cannot be exported, retain its locator and caption in the manifest with `file: null`.
- `manifest.json` uses this schema; paths are relative to `source-cache/` and SHA-256 is calculated from the supplied source bytes or normalized source text:

```json
{
  "schemaVersion": 1,
  "sourceKind": "pdf",
  "origin": "participant-provided path or URL",
  "sourceSha256": "64-character SHA-256 digest",
  "contentFile": "content.md",
  "evidenceFile": "evidence.json",
  "locatorScheme": "page + section/equation/figure/table",
  "pageCount": 12,
  "metadata": {
    "title": "Exact paper title",
    "authors": ["Author One"],
    "venue": "Conference, journal, or preprint",
    "year": "2024"
  },
  "figures": [
    {
      "id": "figure-1",
      "locator": "page 3, Figure 1",
      "caption": "Original caption",
      "file": "figures/figure-1.png"
    }
  ]
}
```

Use `pageCount: null` for a source without fixed pages and an empty `figures` array when no original figure is available. Never fabricate metadata, locators, captions, or images.

After this cache is created, do not reopen or reparse the original paper during normal execution. All later Phase 1 steps must read `content.md`, `manifest.json`, `evidence.json`, and cached figures. If the first extraction is incomplete or corrupt, replace the incomplete cache with one corrected complete extraction before continuing; do not accumulate repeated partial reads.

Decompose the cached record into this planning record:

| Field                    | Required content                                                |
| ------------------------ | --------------------------------------------------------------- |
| English title            | Exact paper title                                               |
| Chinese title            | Accurate Simplified Chinese translation                         |
| Short name               | Lowercase filename-safe identifier                              |
| Venue and year           | Conference, journal, or preprint year                           |
| Authors and affiliations | Major authors and institutions                                  |
| Core problem             | One sentence describing the limitation addressed                |
| Core insight             | One sentence describing why the method works                    |
| Main equations           | Only equations needed to understand the method                  |
| Architecture             | Major components and data flow                                  |
| Training                 | Objective, data, optimization, and practical techniques         |
| Inference                | Runtime or sampling procedure                                   |
| Results                  | Key benchmarks, ablations, limitations, and trade-offs          |
| Boundary conditions      | Where each claim, design choice, or conclusion does and does not apply |
| Evaluation protocols     | Dataset, split, baseline, unit, aggregation, and metric direction |
| Transfer and limitations | Cross-task evidence, failure cases, and limitations reported by the paper |
| Domain                   | Language, vision, audio, 3D, RL, graphs, optimization, or other |

Before continuing, create a source-evidence matrix with one row per core tutorial claim:

| Tutorial claim | Exact source locator | Conditions / assumptions | Protocol / metric direction | Allowed tutorial wording |
| -------------- | -------------------- | ------------------------ | --------------------------- | ------------------------ |

Use page plus section, equation, figure, or table identifiers whenever available. Separate the paper's explicit statements from your interpretation. Reject unsupported causal language, comparisons across incompatible evaluation protocols, and universal wording for conditional architecture choices. Serialize the same rows to `evidence.json` as `{"claims":[...]}`; each row has `claim`, `locator`, `conditions`, `protocol`, and `allowedWording` strings. Use explicit values such as `not applicable` rather than an empty field.

Run this hard gate before Step 2:

```bash
node scripts/validate-source-cache.js <task-temp-root>/source-cache
```

Do not continue until the validator passes, the paper's contribution can be explained in one plain sentence, and every planned technical claim has a source row. After the gate, use the cache as the only paper evidence source.

## Step 2: Apply the Design Philosophy

Read `references/philosophy.md`. Enforce all four principles:

- Make the operation embody the concept.
- Reveal concepts progressively: phenomenon before terminology, intuition before formula.
- Optimize for transferable judgment, not symbol memorization.
- Adapt pacing and immediate feedback to the paper's teaching needs.

## Step 3: Select One Unified Everyday Theme

Read `references/metaphor-library.md`. Extract the paper's dominant teaching mechanics, then consider several candidate anchor activities from different families, including an original option when helpful.

For plausible candidates, sketch varied physical episodes for the paper's main questions. Choose the activity that maps the mechanism honestly, supports distinct recognizable events, and can connect to formulas and results. Reject a candidate that yields only one repeated animation or a misleading analogy. No score table is needed.

No example theme is a default, preferred, or discouraged choice. Record a paper-specific reason for the winner and why the main alternative was weaker; generic claims about progress, learning, transformation, or process are not sufficient.

Record the considered candidates, the selected anchor theme, its paper-specific justification, recognizable settings, recurring people or objects, drawing style, and semantic colors. Define a reusable drawing kit for this real activity. Avoid a generic path/target primitive kit that reduces every concept to the same dot-and-line motion.

For every planned slide, record:

- the one paper concept being visualized;
- its chosen life / hybrid / paper-native view and distinctive focal object;
- the physical episode and setting when analogy helps, or the paper variable,
  structure or result when a technical view leads;
- the shared background and semantic colors.

Life scenes should belong to the same anchor theme and vary when the science differs.
If a concept does not map naturally to a physical action, use a paper-native interaction;
do not invent another photo scene to satisfy theme continuity. Never replace the theme with
a factory, conveyor, delivery chain, package route, or multi-station process.

## Step 4: Plan Chapters and the Teaching-Slide Arc

Use `contract.md` §2 to select paper-specific chapter questions and the number of slides
needed to answer them. About 10–15 teaching slides including the cover is a planning
target for a substantial paper, not a hard range. Choose a `paperType` only as a hint
for the paper's central mechanism; it does not assign a fixed chapter number.
Begin with the limitation and contribution, then develop prerequisite concepts and the
method's actual mechanism. Include training, inference, architecture, proof, system decisions,
or ablations only when the paper supports them. End with verified results, applicability and
limitations. Give each chapter one main concept. Never pad chapters or slides or force a
diffusion-style sequence onto another paper.

## Step 5: Plan a varied story and paper-native interactions

Apply the deck-wide mix in `contract.md` §3 to the ordered early, middle and late pages.
Carry distinct theme episodes into result interpretation and applicability, and plan a late
application or failure-and-repair interaction. For every page, record its recognizable theme episode or static theme visual and its link
to the current concept. For a static page, record its teaching reason and where mechanism
interaction resumes. Review theme-grounded animated interactions separately from purely
paper-native interactions and static theme illustrations.

Before selecting controls or page layouts, apply the core-method design test in
`references/interaction-patterns.md`. Map each central contribution to a learner-operated
mechanism and inspect the assets demo functions cited there. Record a causal specification:
scientific operation, executable toy model or transition rule, control surface, visible
intermediate/output consequences and two contrasting input/output states. Use theme objects
as controls for this same state where helpful. The method segment should predominantly be
these experiments; benchmark filtering and animated bars belong to supporting results pages.

Read the animation, interaction and visual standards and inspect `assets/layout-gallery/catalog.md` plus `index.html`. First lock one paper-specific activity from the considered candidates and choose the useful life episodes. For every proposed page record its paper question, life / hybrid / paper-native view, focal object, learner operation, main scientific graphic, visible explanation, immediate feedback, source/analogy boundary in notes, and unique widget ID. After these are clear, select `layoutRef: L01…L08` or `custom`, state why it fits, and sketch actual geometry and relative space for manipulable mechanism, optional animation, explanation and evidence. The ID is planning-only; do not add it to `SceneDef`. Inspect the planned deck as a contact sheet; reject repeated literal photos, decorative-only controls, excessive empty space and left-animation/right-evidence cards.

Give core-method chapters meaningful active operations; evidence or boundary chapters may use `modules: []`. Plan these together and review the deck-wide animation/interaction
mix against `contract.md` §3. Mark each planned page as animated interaction, direct technical
interaction, or explanation/evidence. For animated interactions, name the learner action,
resulting motion, linked scientific state change, and immediate feedback. Spread those scenes
through the method; a cover animation plus one body animation is too sparse for a typical deck.
Use the shared palette and drawing kit where life scenes appear. Let scientific content appear
where the narrative needs it; do not reserve an evidence slot on each page. The introduction
can be purely animated, while another page can be dominated by a manipulable formula,
method detail or verified result. Titles use paper terminology; life-story language belongs
in prompts, motion and feedback.

Also mark each ledger entry as core-method experiment, supporting interaction, or
explanation/evidence, with the contribution it teaches. Do not infer method coverage from
animation or module counts. Phase 2 must read the staged `assets/layout-gallery/teaching-demo/`
reference source as well as the composition gallery and implement/test the planned causal
specifications. Keep the reference demo out of the generated project's runtime.

### Step 5A: Lock the Shared Chapter Contract Before Parallel Work

Before expanding any chapter, write one immutable shared contract in task state containing:

- the ordered chapter list, each chapter's role, prerequisites, and allowed evidence rows;
- canonical Chinese and English terminology plus one meaning for every formula symbol;
- the selected theme, semantic colors, reusable Canvas helpers, widget naming rules, and state conventions;
- global metadata, Hero comparison, result protocols, Bilibili selection, and selected figure paths;
- the chapter JSON schema and deterministic ownership of every chapter and `componentId`.

Partition the chapters into disjoint packets. If safe parallel task execution is available, process packets concurrently with bounded concurrency; otherwise process the same packets sequentially. A packet may read the validated source cache, shared contract, and its assigned chapter plans, but it must write only inside its own packet directory. It must never edit another packet, the output project, `tutorial.ts`, `registry.tsx`, or `paper.css`.

Steps 6-8 below are applied per assigned chapter packet. After all packets return, the coordinator checks chapter transitions, terminology, symbols, evidence wording, duplicated explanations, interaction-pattern coverage, visual consistency, and result coverage. Fix all cross-packet disagreements before Step 9. Parallel execution is an optimization only; it cannot relax any content or validation requirement.

## Step 6: Design each living scene

Specify a recognizable place and event from the locked everyday activity. Draw the objects, surroundings and causally related motions needed to make that event clear; no one-subject or two-prop quota applies. Change the episode and framing when the teaching question changes. Do not use a dot on a generic line, labeled boxes or an abstract flow as the entire analogy. Specify direct scene manipulation where appropriate and keep automatic motion from resetting learner state. Pause off-screen work and respect reduced motion.

Record what the life scene represents, what it does not establish, and where the paper backs the associated scientific claim. Put this provenance in the matrix and notes; show an on-slide source only for exact figures, numbers or quotations that need attribution.

## Step 7: Design Problem-First Interactive Modules

Read `scripts/chapter-template.md`. Use this sequence:

```text
opening life animation poses old-method limitation
  -> one-sentence insight names the paper's core method
  -> readable paper relation or rule explains the prediction
  -> learner operates a life or paper-native scene and the formal representation changes
  -> paper evidence and analogy boundary ground the judgment
```

Choose how much scientific content each page needs. A hybrid view connects a physical action
to a readable, source-backed formula, mechanism, curve, feature view or verified result. A
paper-native view lets the learner operate the actual equation, feature relation, architecture
choice or evidence. Do not replace the main teaching event with abstract nodes, data flow or
a decorative technical dashboard. Avoid repeated tab/chip switching and separate transport
buttons; make the meaningful scene or scientific object the main control.

For every module, specify all of these implementation fields:

- final Simplified Chinese title;
- one-sentence purpose;
- presentation mode;
- exact user operation;
- initial state;
- controls, labels, defaults, and full state space;
- implementation state variable names, types, defaults, and valid values;
- visual regions and reusable drawing elements; include Canvas dimensions/draw order, SVG viewBox or DOM structure as applicable;
- explicit visual encoding from state to position, geometry, path, highlight, curve, distribution, bar, dimension, or output;
- state transitions for the main graphic, controls and feedback, plus any formal view shown on that page;
- exact immediate feedback wording and red/blue/green state colors;
- paper evidence constraining the view;
- exact life-action → paper variable/component → formal relation → prediction/result mapping,
  including source locator, symbol meanings, units and valid conditions;
- where the analogy simplifies or fails, and what the paper actually establishes;
- valid state combinations, prohibited combinations, and the visible explanation for each disabled option;
- dataset, evaluation protocol, unit, and higher-is-better or lower-is-better direction for every displayed result;
- the judgment the learner should form.
- fixed-slide fit and mobile pinch/pan, transformed pointer hit mapping, and keyboard-equivalent behavior when feasible; no mobile stacking inside a slide.

Give core-method chapters meaningful active modules; evidence or boundary chapters may use `modules: []`. Passive autoplay, hover-only explanations,
symbol clicks, and chapter-loader buttons do not count. Implement the planned animated interactions throughout the body per contract.md §3,
including the later application or failure-and-repair scene. Review each stage of the deck
against its own planned theme episodes and scientific state changes. Add operations or
formal views only when they teach a distinct paper question.

Keep the module visually focused: one dominant physical scene, one direct-manipulation target
or a few linked sliders/drag targets,
and concise feedback. Put a formal principle on this page when it clarifies the current
question; a separate scientific or result page may give it more room. Avoid dashboard layouts and unrelated controls.

When a module continues the everyday analogy, keep it inside the anchor theme. Use the objects and related motions needed to teach the concept clearly at slide scale.

When the paper has a nontrivial network structure, add an interactive module that makes its
architectural consequence understandable through a useful life episode or direct manipulation
of the structure and a readable formal representation (such as dimensions, operation or output).
A static diagram alone fails. The learner's operation must change the main view, the
architecture-relevant value or result, and feedback together; do not substitute an abstract
node-flow animation for the explanation.

If the paper has **no** nontrivial network (e.g. `paperType: theoretical`, per `contract.md` §2.2), do not force an architecture diagram — use another active technical module that still satisfies the §3 density floor.

## Step 8: Extract Equations and Symbols

Select only equations essential to understanding. For each equation:

1. Precede it with one plain-language Simplified Chinese sentence.
2. Render simple expressions with HTML; use semantic MathML in a custom scene body for structured equations.
3. Place it where it is legible in the relevant scene, without requiring a fixed formula panel.
4. Explain symbols in nearby readable text or speaker notes; clickable symbol tags are optional.
5. Record each symbol's type, shape or dimension where meaningful, plus sign, normalization, and assumptions that affect interpretation.
6. Include only equations that advance the chapter's explanation.

Maintain a symbol table with the symbol, Simplified Chinese meaning, type or shape, and first chapter of use.

## Step 9: Optional Bilibili Videos

If a relevant video can be found without delaying the tutorial, record its real BVID, title, relevance and any cover/view metadata actually retrieved. Never invent a BVID or metric. Omit the section when lookup is unavailable or nothing suitable is found. Video search and metadata fetch are best-effort and never block Phase 1. Only verified selected entries enter `tutorial.bilibili` in Phase 2.
## Step 10: Build the Temporary PaperSkill

Reuse the exact task-scoped temporary root recorded in Step 1. Under it, create `<paper-short-name>-tutorial/`. Resolve and record the intermediate skill's absolute path.

Safety requirements:

- Do not create the intermediate under `skills/`, the workspace, or another persistent directory.
- Use only the recorded absolute path for subsequent reads and writes.
- Never use an unresolved variable, wildcard, or broad temp root as a cleanup target.

The task root now has this structure:

```text
<task-temp-root>/
|-- source-cache/              <- validated in Step 1; Phase 2 may consult for factual checks
|-- plan-packets/              <- isolated Phase 1 chapter drafts
`-- <paper-short-name>-tutorial/
    |-- SKILL.md
    |-- contract.md            <- copied validator thresholds; not a Phase 2 rule source
    |-- scaffold.js            <- React+TS project scaffolder (copied beside assets/)
    |-- assemble-chapter-packets.js <- single writer for Phase 2 chapter packets + syntax gate
    |-- syntax-check.js        <- shared TypeScript/esbuild syntax gate
    |-- validate-output.js
    `-- assets/
        |-- global-guides/    <- staged parent skill rules for Phase 2 review, not output assets
        |-- layout-gallery/   <- visual references for per-slide planning, not output assets
        `-- react-template/    <- demo-free Vite + React + TS scaffold
```

Before generating the temporary `SKILL.md`:

1. Read `references/intermediate-skill-standard.md`.
2. Read `references/visual-interaction-standard.md` as the universal graphical and interaction standard for the current paper.
3. Confirm that the selected theme and paper-specific justification from Step 3 are locked in task state.
4. Use `templates/skill-template.md` as the canonical generic mirror of that exemplar.

Generate `SKILL.md` with evidence, theme and planned pages before the build instructions. Fully expand all planned chapters; never emit aggregate placeholders or "same as above" shorthand. Describe each page deeply enough to implement it, without a character-count target or repeated per-chapter slots.

Fill every placeholder with the coordinator-approved outputs from Steps 1-9. Include source kind, SHA-256 digest, locator scheme, and selected cached-figure IDs in the paper metadata; never include a temporary absolute path. Run `node scripts/stage-template.js <temporary-paperSkill-directory>` from the parent skill to stage a demo-free `assets/react-template/`, neutral `assets/layout-gallery/`, and the original Markdown rules under `assets/global-guides/`. Copy `contract.md` and `scripts/scaffold.js`, `scripts/assemble-chapter-packets.js`, `scripts/syntax-check.js`, and `scripts/validate-output.js` into the temporary paperSkill. Never copy the mountain demo's widgets or tutorial data into Phase 2. The Phase 2 agent reads the intermediate plan **and** the staged global guides and assets before implementation.

Consider important original method/architecture figures per `contract.md` §11; inclusion remains optional. Record each selected figure's source ID, caption, slide, explanatory purpose and full-image/crop/annotation arrangement in the intermediate plan. When using one, copy the already cached image into the temporary `assets/react-template/public/images/` now and record its `./images/...` relative path. Always keep a leading `./` (never a root-absolute `/images/...`, which 404s under the deployment sub-path). Do not reopen the original source during this step. Images staged here are copied into the final project automatically by `scaffold.js`.

## Step 11: Validate Phase 1

Run the coordinator consistency pass and every Phase 1 check in
`scripts/validation-checklist.md`. `validate-output.js` checks an assembled project, so
run it in Phase 2 rather than against the Phase 1 plan. Fix Phase 1 failures before continuing.

After Phase 1 passes:

1. Keep the exact resolved temporary path in task state.
2. Review the temporary paperSkill's `SKILL.md`, `assets/global-guides/`, `assets/layout-gallery/` and `assets/react-template/` together.
3. Do not send a final response or ask the user to invoke anything.
4. Immediately execute Phase 2.

## Phase 2: Generate the React + TS Project Folder Immediately

Use the temporary paperSkill as the paper-specific slide plan. Before coding, review its staged
`assets/global-guides/SKILL.md`, `contract.md`, relevant `references/` and `scripts/*.md`, the
layout gallery, and React scaffold. Apply global hard constraints from the contract,
paper-specific facts and slide choices from the plan, and runtime fields from `src/types.ts`.
Correct any disagreement in the plan; consult the validated source cache when a factual claim
or locator is unclear.

1. Run `node scaffold.js <outputDir> <packageName> "<titleEn>" "<titleZh>"` from the temporary
   skill directory (scaffold.js sits beside `assets/`). This copies `assets/react-template/` to
   `<outputDir>` (the caller's working directory, named `<paper-short-name>_output`), injects the
   paper title into `package.json` + `index.html`, and ensures `public/images/` exists.
   Then run `npm install` in `<outputDir>` so the template's TypeScript/esbuild is available to the
   syntax gate (step 4) and to the later preview/build. If installation fails, fix the
   environment or report the generation blocked; do not deliver an unparsed project.
2. Create `<task-temp-root>/chapter-work/shared.json` serially with the final `meta`, `hero`, and
   optional `bilibili` objects. Create one isolated directory per packet under
   `chapter-work/packets/<packet-id>/`.
3. Before coding each scene, compare its intermediate `layoutRef` and content plan with the corresponding staged gallery example, then adapt it or use the described `custom` geometry. Do not copy example labels or store `layoutRef` in runtime scene data. For each packet, write `packet.json`, chapter JSON files, and widget TSX files only inside that
   packet directory. `packet.json` has `chapters` (relative JSON paths) and `widgets`; each widget
   entry has `componentId`, `exportName`, and a relative `file` path. Chapter JSON must match
   `ChapterDef`, keep `kind: "chapter"` / `kind: "module"`, give each scene its own composition
   and distinct `componentId`, and use only its assigned chapter IDs.
   Run disjoint packets concurrently when safe parallel task support exists; otherwise produce them
   sequentially with the identical format. Workers never write into `<outputDir>`.
4. After every packet completes, the single coordinator runs
   `node assemble-chapter-packets.js <outputDir> <task-temp-root>/chapter-work`. The helper rejects
   duplicate or missing chapter IDs, duplicate module/widget IDs, path escapes, missing widget
   exports, and unregistered `componentId`s; it alone writes `src/data/tutorial.ts`, copies packet
   widgets, and writes `src/modules/registry.tsx`. It then parses `tutorial.ts`, `registry.tsx`, and
   every copied widget with the project's TypeScript/esbuild and fails on any syntax error, so a
   truncated widget TSX (for example one missing its final brace) can never be assembled.
5. Replace `__METAPHOR_CSS__` inside `src/styles/paper.css` `:root {}` once, after packet assembly,
   with the coordinator-approved paper-specific color overrides (or remove the placeholder line).
6. Use only original figures already staged in `assets/react-template/public/images/` during
   Phase 1. Render them inside the page's paper-specific scene widget, optionally using the
   shared `Figure` helper (`./images/...` relative path — never a root-absolute `/images/...`).
   `SceneDef` has no `figure` field; do not invent one. Apply `contract.md` §11 for original
   method figures, annotations and readable magnification. Omit unsuitable figures. Use the
   validated `source-cache/` only for factual checks; do not introduce unverified figures or claims.
7. Do NOT edit framework files: `src/components/*`, `src/lib/*`, `src/styles/{tokens,components}.css`,
   `App.tsx`, `main.tsx`, config files. Keep all visible explanatory copy in natural Simplified
   Chinese.
8. The app groups the contracted chapter count into independently composed scenes.
   Use the shared top-toolbar/slide-preview player and explicit scene plans per §2.4.
   Videos, when present, follow the teaching scenes.
9. Give every widget one dominant operation; implement the shared Canvas drawing kit once and
   reuse it. Keep the tutorial-wide scene palette and semantic color mapping stable across chapters.
10. Drive each module's paper-relevant graphic, controls and feedback from its specified
    state model. A life illustration changing alone is insufficient.
11. Use the three body type roles in `contract.md` §2.5. Remove redundant labels and give
    explanatory text, the manipulable mechanism and result enough of the body canvas;
    put longer explanations in a deliberate region or another page, not a fixed side card.
12. Run one coordinator review across the assembled page, then run the syntax, structural and build gates and fix
    all failures:
    `node syntax-check.js <outputDir> --require-parser`, `node validate-output.js <outputDir>` and
    `npm run build` in `<outputDir>`.
    `--require-parser` fails with exit code 3 when no TypeScript/esbuild is installed, which guarantees
    the final sources really were parsed instead of silently skipped. The review must check cross-chapter terminology,
    symbol meanings, evidence boundaries, transitions, duplication, theme/color consistency, module
    coverage, and desktop/mobile behavior.
    Recheck the intermediate plan against staged global guides, layout gallery and runtime
    scaffold during final review; the plan alone is not a sufficient validation source.

## Cleanup and Delivery

After validation, or before reporting any blocker:

1. Resolve the recorded task-scoped temporary root, source-cache path, packet-work paths, and intermediate path again.
2. Confirm every child path is inside the exact task root created in Step 1 and that the task root is not a broad system temporary directory.
3. **Debug branch:** if `PAPER_SKILL_DEBUG=true`, skip deletion. Preserve and return the exact task root so a human can inspect the source cache, packet work, and Phase 1 output. The delivered folder is identical.
4. Otherwise, recursively remove only that exact task-scoped root. Do not use wildcards, an unresolved variable, or the system temporary parent as the target.
5. Confirm the task root and all source-cache, packet-work, and intermediate children no longer exist (or, in debug mode, that all are preserved).
6. Deliver only the final `<paper-short-name>_output/` folder path. Do not mention, list, or expose temporary artifacts except the task-root debug path when debug mode is on.

## Presentation integration

Use `references/presentation-standard.md`, `contract.md` §§2.4–2.5 and the actual React
schema for composition, player behavior and rendered acceptance. The intermediate skill
records paper-specific slide decisions; Phase 2 also reads the staged global guides,
layout gallery and scaffold. Do not duplicate the complete player specification here.
