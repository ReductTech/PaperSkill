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

Extract this planning record:

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
- Provide lightweight personalization through badges, pacing, and immediate feedback.

## Step 3: Select One Unified Everyday Theme

Read `references/metaphor-library.md`. Extract the paper's dominant teaching mechanics, then generate at least three candidate anchor activities from different families. At least one candidate must be newly invented rather than copied verbatim from the library.

For each candidate, sketch 10 related actions and score mechanism fit, ten-action coverage, visual clarity, technical linkability, thematic continuity, and originality from 1 to 5. Reject any candidate scoring below 3 on mechanism fit, ten-action coverage, or visual clarity. Select the highest total; break ties in favor of the less recently used and less template-associated theme.

No example theme is a default, preferred, or discouraged choice. Select only from the current paper's scored fit. Whichever candidate wins, record a paper-specific reason that distinguishes it from at least two rejected candidates; generic claims about progress, learning, transformation, or process are not sufficient.

Record all candidate scores, rejection reasons, the selected anchor theme, its paper-specific justification, shared setting, recurring objects, Canvas background, drawing style, and semantic colors. Define a tutorial-wide drawing kit with a recurring subject or manipulated object, one target motif, three to six theme props, stable line weights, Canvas label style, and named helper functions for the scene, subject, path or support, target, label, and legend.

For every planned chapter, record:

- the one paper concept being visualized;
- one primary subject;
- one physical action verb;
- one visible goal or completed state;
- zero to two static supporting props;
- the shared background and semantic colors.

All 10 rows must clearly belong to the same anchor theme. If a concept does not map naturally to the literal central action, use a related preparation, tool, decision, safety check, practice, or result from the same activity. Never replace the theme with a factory, conveyor, delivery chain, package route, or multi-station process.

## Step 4: Plan `chapterCount` Chapters (Flexible, Default 10)

Adapt the paper to the narrative arc in `contract.md` §2 (default 10 chapters; range
6–10). Pick a `paperType` from `contract.md` §2.2 to decide how Chapter 8 is treated:

- `generative`, `system`, `rl`, `other`: Chapter 8 is the interactive architecture / key
  technical module.
- `theoretical` (no nontrivial network): Chapter 8 becomes an interactive proof, bound,
  trade-off, or ablation module instead of a network diagram.

Default 10-chapter arc (merge/split adjacent roles when `chapterCount` differs):

| Chapter | Default role                                      | Badge  |
| ------- | ------------------------------------------------- | ------ |
| 1       | Problem and core loop                             | `inf`  |
| 2       | Input representation or embedding                 | `inf`  |
| 3       | Key insight or reversibility                      | `inf`  |
| 4       | Core mathematical framework                       | `both` |
| 5       | Conditioning or guidance                          | `both` |
| 6       | Inference or sampling                             | `inf`  |
| 7       | Training objective                               | `trn`  |
| 8       | Architecture innovation **or** key technical module | `trn`  |
| 9       | Practical techniques or auxiliary mechanisms      | `trn`  |
| 10      | Results, comparisons, limitations, and takeaways  | `both` |

Introduce one main concept per chapter. Reserve the final chapter for results. Never drop
below 6 or pad above 10 to hit a quota.

## Step 5: Assign Animation Scenes and Interactions

Read `references/animation-library.md`, `references/interaction-patterns.md`, and `references/visual-interaction-standard.md`.

For every chapter, record:

| Chapter | Analogy subject and action               | Dominant module operation                                   | Main graphic                           | Technical evidence                                                                              | Shared state and feedback                  |
| ------- | ---------------------------------------- | ----------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1-10    | One familiar subject, one verb, one goal | One of adjust, choose, click, step, drag, compare, or start | Life, technical, or linked hybrid view | Curve, distribution, feature view, bars, dimensions, architecture, or verified data when useful | State variables and exact visible response |

Requirements:

1. Pass the `one subject + one verb + one goal` test for every chapter analogy.
2. Keep one independently moving subject and no more than two static supporting props.
3. Reject any scene that needs "then", several stations, handoffs, or multiple independent motions to describe it.
4. Keep all scenes inside the selected anchor theme while varying their actions and recurring objects.
5. Give each chapter an active user operation.
6. Use at least `distinctPatternsMin` (6) distinct interaction patterns (per `contract.md` §3).
7. Use P1 sliders in no more than `p1SliderChaptersMax` (4) chapters.
8. Use P7 only as a supporting animation, never as the chapter's sole interaction.
9. Reuse the tutorial-wide drawing kit and exact semantic color meanings (per `contract.md` §5) across the Hero, analogies, and life-metaphor modules.
10. Give every module one dominant operation and one shared state model that drives the graphic and feedback.
11. Use compact technical evidence only when it clarifies the mechanism. Link it to the same state instead of placing an unrelated passive chart beside the metaphor.
12. Prefer the proven compositions in the visual standard: stress plus repair, clickable progression plus inset, synchronized old/new, physical magnitude plus mathematical magnitude, chips plus trade-off bars, step-through route, interactive architecture map, inspect-and-compare, and verified result race.

### Step 5A: Lock the Shared Chapter Contract Before Parallel Work

Before expanding any chapter, write one immutable shared contract in task state containing:

- the ordered chapter list, each chapter's role, prerequisites, and allowed evidence rows;
- canonical Chinese and English terminology plus one meaning for every formula symbol;
- the selected theme, semantic colors, reusable Canvas helpers, widget naming rules, and state conventions;
- global metadata, Hero comparison, result protocols, Bilibili selection, and selected figure paths;
- the chapter JSON schema and deterministic ownership of every chapter and `componentId`.

Partition the chapters into disjoint packets. If safe parallel task execution is available, process packets concurrently with bounded concurrency; otherwise process the same packets sequentially. A packet may read the validated source cache, shared contract, and its assigned chapter plans, but it must write only inside its own packet directory. It must never edit another packet, the output project, `tutorial.ts`, `registry.tsx`, or `paper.css`.

Steps 6-8 below are applied per assigned chapter packet. After all packets return, the coordinator checks chapter transitions, terminology, symbols, evidence wording, duplicated explanations, interaction-pattern coverage, visual consistency, and result coverage. Fix all cross-packet disagreements before Step 9. Parallel execution is an optimization only; it cannot relax any content or validation requirement.

## Step 6: Design Each Analogy Card

For each chapter, specify:

1. A `560x140` Canvas scene.
2. One primary subject and at most two static props.
3. One action verb and one visible goal.
4. One continuous looped motion with no handoff or station sequence.
5. A short Simplified Chinese title and one or two sentences of copy.

Run analogy animations automatically and pause them off-screen with `IntersectionObserver`. Do not add replay controls or operation instructions.

If an analogy can be described as a package or item passing through workstations, discard it. Replace it with one direct action performed by a subject or object that naturally belongs to the selected theme, such as writing, watering, tuning, stirring, pacing, filling, driving, illuminating, shaping, or rolling.

## Step 7: Design Problem-First Interactive Modules

Read `scripts/chapter-template.md`. Use this sequence:

```text
old method or missing capability
  -> learner operates it and experiences the limitation
  -> one-sentence insight names the need
  -> learner operates the paper's method
  -> formal term and equation appear
```

Choose one presentation mode for every module:

1. `life metaphor`: the learner operates an object from the unified everyday theme;
2. `mathematical/technical`: the learner operates coordinate grids, feature maps, vectors, equations, charts, architecture nodes, or verified data;
3. `hybrid linked views`: one operation updates a life-metaphor view and a mathematical or technical view together.

Coordinate grids, technical diagrams, feature maps, vectors, and mathematical plots are allowed inside active body modules. They remain prohibited as substitutes for the required life-based automatic analogy animation.

For every module, specify all of these implementation fields:

- final Simplified Chinese title;
- one-sentence purpose;
- presentation mode;
- exact user operation;
- initial state;
- controls, labels, defaults, and full state space;
- implementation state variable names, types, defaults, and valid values;
- Canvas dimensions, named stable regions, back-to-front draw list, and reusable drawing primitives;
- explicit visual encoding from state to position, geometry, path, highlight, curve, distribution, bar, dimension, or output;
- state transitions for the main graphic, technical evidence, values, controls, and feedback after every meaningful operation;
- exact immediate feedback wording and red/blue/green state colors;
- paper evidence constraining the view;
- valid state combinations, prohibited combinations, and the visible explanation for each disabled option;
- dataset, evaluation protocol, unit, and higher-is-better or lower-is-better direction for every displayed result;
- the judgment the learner should form.
- responsive stacking, pointer hit mapping, and keyboard-equivalent behavior when feasible.

Give every chapter at least one primary active module. Meet the density floor in `contract.md` §3: at least `activeModulesMin` active modules total and at least `dualModuleChaptersMin` chapters with two modules. Passive autoplay, hover-only explanations, symbol clicks, and chapter-loader buttons do not count. Also meet the mode split in §3 (`mathOrHybridModulesMin` and `lifeOrHybridModulesMin`, each 4).

Keep the module visually compact: one dominant Canvas or true synchronized comparison, one compact control row or direct-manipulation target, one stable detail region when needed, and one feedback bar. Avoid dashboard layouts and unrelated control clusters.

When a module continues the everyday analogy, keep it inside the anchor theme. The module is not restricted to the analogy card's one-moving-subject limit when additional interactive objects are needed to teach the concept clearly.

When the paper has a nontrivial network structure, add an interactive architecture module. It may use the life metaphor, a mathematical/technical graph, or linked hybrid views. A static diagram alone fails this requirement. The learner must perform at least one meaningful operation, such as clicking a component, switching a route, stepping through propagation, or dragging an edge. That operation must immediately update the highlighted component plus at least one of the active path, dimensions, values, output, or `.feedback`.

If the paper has **no** nontrivial network (e.g. `paperType: theoretical`, per `contract.md` §2.2), do not force an architecture diagram — give Chapter 8 a different active technical module that still satisfies the §3 density floor.

## Step 8: Extract Equations and Symbols

Select only equations essential to understanding. For each equation:

1. Precede it with one plain-language Simplified Chinese sentence.
2. Render it with Unicode and HTML only.
3. Put it in `.formula-explain`.
4. Make each symbol a clickable `.sym` with a matching `.sym-desc`.
5. Record each symbol's type, shape or dimension where meaningful, plus sign, normalization, and assumptions that affect interpretation.
6. Limit each chapter to one or two core equations.

Maintain a symbol table with the symbol, Simplified Chinese meaning, type or shape, and first chapter of use.

## Step 9: Find High-View Bilibili Videos (Optional, Best-Effort — Attempt Every Run)

Video recommendations are an **optional enrichment**, not a blocking requirement (see
`contract.md` §7), but they are a visible, expected part of the tutorial (the Bilibili
strip renders at the **end of the last chapter**). **Always attempt this step on every
run** — do not skip it by default. Never invent a BVID.

- If **no relevant video exists at all** (a thorough search found nothing on-topic), omit the
  `bilibili` array in `src/data/tutorial.ts`. But if any relevant video is found, **always
  include and display it** (video + cover + views) — do NOT omit the strip just because the
  Bilibili API or metadata fetch failed or authenticity could not be verified. Bake the
  `cover` and `views` you can obtain; if the fetch is blocked, the card still shows the video
  link + title with a gradient cover fallback instead of disappearing.
- When reachable, search for candidates using the paper title, method name, authors,
  field, tutorial, lecture, and implementation terms.
- Extract BVIDs in the `BV` plus ten alphanumeric character format from search results,
  video pages, or playlists. **Verification of the API is best-effort, not required**: if the
  `view` API (or an equivalent metadata source) is reachable, use it to read the title/views
  and bake them; if it is blocked (anti-crawl / no network), still write the real BVID you
  found and display the card — do not drop it for lack of verification.
- **Capture the `pic` field from the response** (the cover image URL) and convert it to
  `https://`. Bake it into each `bilibili` entry as `cover` so the thumbnail renders even
  when the runtime metadata fetch fails (Bilibili's unsigned `view` API is often rejected
  in end-user browsers). Without a baked-in `cover`, videos may appear with an empty
  placeholder instead of a real thumbnail.
- **Capture `stat.view`** and bake it as `views` (formatted, e.g. `41.5万播放`) so 播放量
  shows without the runtime fetch. The framework's `formatViews` rule: `>=1e8` → `x.x亿播放`,
  `>=1e4` → `x.x万播放`, else raw `n播放`.
- Record title, BVID, current views (when obtainable), and relevance. A verification date is
  optional and not required to display the video.
- Select up to four videos, preferring higher view counts when relevance is comparable and
  aiming for `>= 10,000` views; a uniquely relevant low-view video is acceptable with a
  written reason.
- Use the roles: broad overview, method deep dive, implementation or application, and
  author talk or related extension.
- Emit the `## Verified Bilibili Recommendations` section in the intermediate skill
  (per `references/intermediate-skill-standard.md`) with the selected BVIDs, and map them
  into `tutorial.bilibili` during Phase 2 (see Step 10/Phase 2). The order here is the
  strip order shown at the end of the last chapter.

Do not trade away relevance merely to increase views. Never block the pipeline on video
lookup.

## Step 10: Build the Temporary PaperSkill

Reuse the exact task-scoped temporary root recorded in Step 1. Under it, create `<paper-short-name>-tutorial/`. Resolve and record the intermediate skill's absolute path.

Safety requirements:

- Do not create the intermediate under `skills/`, the workspace, or another persistent directory.
- Use only the recorded absolute path for subsequent reads and writes.
- Never use an unresolved variable, wildcard, or broad temp root as a cleanup target.

The task root now has this structure:

```text
<task-temp-root>/
|-- source-cache/              <- validated in Step 1; never read by Phase 2
|-- plan-packets/              <- isolated Phase 1 chapter drafts
`-- <paper-short-name>-tutorial/
    |-- SKILL.md
    |-- scaffold.js            <- React+TS project scaffolder (copied beside assets/)
    |-- assemble-chapter-packets.js <- single writer for Phase 2 chapter packets
    |-- validate-output.js
    `-- assets/
        `-- react-template/    <- full Vite + React + TS scaffold
```

Before generating the temporary `SKILL.md`:

1. Read `references/intermediate-skill-standard.md`.
2. Read `references/visual-interaction-standard.md` as the universal graphical and interaction standard for the current paper.
3. Confirm that the selected theme, candidate scores, and paper-specific justification from Step 3 are locked in task state.
4. Use `templates/skill-template.md` as the canonical generic mirror of that exemplar.

Generate `SKILL.md` with the same top-level and per-chapter order as the exemplar. Copy its detail level, not its paper facts. Fully expand all `chapterCount` chapters; never emit aggregate placeholders, "same as above", or `complete-chapter-N-plan` shorthand. The detail floor is **field-completeness, not raw length** (per `contract.md` §6): every required field filled, `chapterPlanMinChars` (soft, 600) of real detail per chapter, and **no global character minimum**.

Fill every placeholder with the coordinator-approved outputs from Steps 1-9. Include source kind, SHA-256 digest, locator scheme, and selected cached-figure IDs in the paper metadata; never include a temporary absolute path. Copy this skill's complete `assets/` directory (which contains `react-template/`) and `scripts/scaffold.js`, `scripts/assemble-chapter-packets.js`, and `scripts/validate-output.js` into the temporary paperSkill (the helpers sit beside `assets/` in the intermediate skill directory).

When the tutorial will use an original paper figure, copy the already cached image into the temporary `assets/react-template/public/images/` now and record its `/images/...` path in the intermediate skill. Do not reopen the original source during this step. Images staged here are copied into the final project automatically by `scaffold.js`.

## Step 11: Validate Phase 1

Run the coordinator consistency pass and every Phase 1 check in `scripts/validation-checklist.md`. Where possible, also dry-run
`scripts/validate-output.js` against the planned structure (chapter count, module count,
placeholders). Fix failures before continuing.

After Phase 1 passes:

1. Keep the exact resolved temporary path in task state.
2. Read the temporary paperSkill's `SKILL.md` and assets.
3. Do not send a final response or ask the user to invoke anything.
4. Immediately execute Phase 2.

## Phase 2: Generate the React + TS Project Folder Immediately

Follow the temporary paperSkill exactly.

1. Run `node scaffold.js <outputDir> <packageName> "<titleEn>" "<titleZh>"` from the temporary
   skill directory (scaffold.js sits beside `assets/`). This copies `assets/react-template/` to
   `<outputDir>` (the caller's working directory, named `<paper-short-name>_output`), injects the
   paper title into `package.json` + `index.html`, and ensures `public/images/` exists.
2. Create `<task-temp-root>/chapter-work/shared.json` serially with the final `meta`, `hero`, and
   optional `bilibili` objects. Create one isolated directory per packet under
   `chapter-work/packets/<packet-id>/`.
3. For each packet, write `packet.json`, chapter JSON files, and widget TSX files only inside that
   packet directory. `packet.json` has `chapters` (relative JSON paths) and `widgets`; each widget
   entry has `componentId`, `exportName`, and a relative `file` path. Chapter JSON must match
   `ChapterDef`, keep `kind: "chapter"` / `kind: "module"`, and use only its assigned chapter IDs.
   Run disjoint packets concurrently when safe parallel task support exists; otherwise produce them
   sequentially with the identical format. Workers never write into `<outputDir>`.
4. After every packet completes, the single coordinator runs
   `node assemble-chapter-packets.js <outputDir> <task-temp-root>/chapter-work`. The helper rejects
   duplicate or missing chapter IDs, duplicate module/widget IDs, path escapes, missing widget
   exports, and unregistered `componentId`s; it alone writes `src/data/tutorial.ts`, copies packet
   widgets, and writes `src/modules/registry.tsx`.
5. Replace `__METAPHOR_CSS__` inside `src/styles/paper.css` `:root {}` once, after packet assembly,
   with the coordinator-approved paper-specific color overrides (or remove the placeholder line).
6. Use only original figures already staged in `assets/react-template/public/images/` during
   Phase 1 and reference them via the `figure` field (`/images/...`). Omit any figure that does
   not fit. Do not reopen the original paper or read `source-cache/` in Phase 2.
7. Do NOT edit framework files: `src/components/*`, `src/lib/*`, `src/styles/{tokens,components}.css`,
   `App.tsx`, `main.tsx`, config files. Keep all visible explanatory copy in natural Simplified
   Chinese.
8. The app renders exactly `chapterCount` (6–10) chapters in a slide layout (chapter switching
   is owned by `App.tsx`): a fixed left sidebar TOC, one chapter per screen, and a full-width
   bottom nav bar. Videos (if any) appear as the last slide.
9. Give every widget one dominant operation; implement the shared Canvas drawing kit once and
   reuse it. Keep the tutorial-wide scene palette and semantic color mapping stable across chapters.
10. Drive each module's canvas/technical evidence, values, selected controls, and feedback from its
   specified state model.
11. Minimize small-font explanatory text: each module keeps small-font explanatory text to the
   description before the Canvas and the feedback line below the controls — no extra hint rows,
   hint bars, or annotations. Inside the Canvas, draw at most `canvasLabelMaxCount` (2) labels of
   `canvasLabelMaxChars` (8) chars and one legend of `canvasLegendMaxItems` (3) entries; show
   result values as bare numbers. Express state through color and shape, not additional words
   (per `contract.md` §3 and `references/visual-interaction-standard.md` §7).
12. Run one coordinator review across the assembled page, then run `validate-output.js <outputDir>`
    as the hard structural gate and fix all failures. The review must check cross-chapter terminology,
    symbol meanings, evidence boundaries, transitions, duplication, theme/color consistency, module
    coverage, and desktop/mobile behavior.
    Do not re-read original paper-skill documents — the intermediate skill plus its
    `assets/react-template/`, `scaffold.js`, and `assemble-chapter-packets.js` are sufficient for Phase 2.

## Cleanup and Delivery

After validation, or before reporting any blocker:

1. Resolve the recorded task-scoped temporary root, source-cache path, packet-work paths, and intermediate path again.
2. Confirm every child path is inside the exact task root created in Step 1 and that the task root is not a broad system temporary directory.
3. **Debug branch:** if `PAPER_SKILL_DEBUG=true`, skip deletion. Preserve and return the exact task root so a human can inspect the source cache, packet work, and Phase 1 output. The delivered folder is identical.
4. Otherwise, recursively remove only that exact task-scoped root. Do not use wildcards, an unresolved variable, or the system temporary parent as the target.
5. Confirm the task root and all source-cache, packet-work, and intermediate children no longer exist (or, in debug mode, that all are preserved).
6. Deliver only the final `<paper-short-name>_output/` folder path. Do not mention, list, or expose temporary artifacts except the task-root debug path when debug mode is on.
