# Contract — Single Source of Truth

This file is the **canonical** place where the skill's hard numeric constraints and color
semantics are defined. Other instruction files may repeat a human-readable summary only
when they cite the relevant section, but they must not define or validate an independent
value. Automated validators load their thresholds directly from this file. When a number
needs to change, change it here once.

All prose written by the agent into the temporary paperSkill and the final React app stays
in **Simplified Chinese**; this contract and the skill's own instruction files are in
**English**.

---

## §1 How to Use This Contract

- Treat each value below as a load-bearing constraint, not a suggestion.
- When another file needs a number or color, write "per `contract.md` §N". An inline value
  is a readability aid, not another source of truth.
- If an inline summary disagrees with this contract, this contract wins and the summary
  must be corrected. Scripts must read the value from this file rather than hard-code it.

---

## §2 Chapter Structure

The tutorial is organized as a fixed narrative arc, but the **chapter count is flexible**.

| Field                      | Value                |
| -------------------------- | -------------------- |
| `chapterCountDefault`      | 10                   |
| `chapterCountMin`          | 6                    |
| `chapterCountMax`          | 10                   |
| `sectionsPerChapterMax`    | 3                    |

Rules:

- Use 10 chapters for the standard arc. Reduce toward 6 only when the paper is genuinely
  thin, or keep 10 when its structure is rich — the allowed range is 6–10.
- Never reduce below 6 or pad above 10 to hit a quota.
- Each chapter is organized into **at most 3 sections** (see §2.3): 引入节 / 讲解节 / 总结节.
  Do not add a fourth independent section; fold any extra material into one of the three.
- The narrative arc below is the **default ordering** for 10 chapters. When the count
  changes, merge or split adjacent roles rather than reordering the pedagogy
  (problem → insight → mechanism → method → training → results).

### §2.1 Default 10-Chapter Arc

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
| 10      | Results, comparisons, limitations, takeaways      | `both` |

### §2.2 Paper-Type Branching

Select one `paperType` in Phase 1. It only adjusts **which chapters may vary** and how
Chapter 8 is treated — it does not change the output language or the analogy rules.

| `paperType`     | Chapter 8 guidance                                                                 | Notes                                                                 |
| --------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `generative`    | Interactive architecture / structure module is usually appropriate.                 | Diffusion / generation / autoregressive papers.                        |
| `theoretical`   | Chapter 8 may become a key proof, bound, or ablation module instead of a network.   | Theory / optimization / stats papers with no nontrivial network.       |
| `system`        | Chapter 8 should be the interactive system / pipeline module.                       | Systems, retrieval, infra, or multi-component papers.                  |
| `rl`            | Chapter 8 may be the policy / value / trajectory module.                            | Reinforcement learning, control, planning papers.                      |
| `other`         | Follow the default arc; Chapter 8 is a flexible "key technical mechanism" module.   | Anything that does not fit the above.                                  |

For `theoretical` and similar types with **no nontrivial network structure**, do **not**
force an interactive architecture diagram. Replace Chapter 8's architecture module with a
different active technical module (interactive proof, trade-off, or ablation) that still
satisfies the interaction-density contract in §3.

### §2.3 Per-Chapter Section Cap (max 3)

Each chapter renders as at most three coarse sections, in fixed order:

1. **引入节 (Intro)** — `bridge` + `analogy` (+ optional `insight`).
2. **讲解节 (Body)** — `modules[]` (1–2) + optional `formula`.
3. **总结节 (Recap)** — `takeaways` (exactly 3 items).

Treat `bridge` / `analogy` / `insight` as one intro block, `modules` / `formula` as one
body block, and `takeaways` as the recap block. This keeps every chapter within three
visible sections even though it contains more fine-grained elements.

---

## §3 Interaction Density (Hard Minimums)

| Field                          | Value | Meaning                                                              |
| ------------------------------ | ----- | -------------------------------------------------------------------- |
| `activeModulesMin`             | 4     | Total primary active modules across all chapters.                    |
| `dualModuleChaptersMin`        | 1     | At least one chapter should contain **two** primary active modules.  |
| `distinctPatternsMin`          | 6     | Distinct interaction patterns (P1–P8) used across the tutorial.      |
| `p1SliderChaptersMax`          | 4     | Chapters that may use the P1 slider pattern.                         |
| `mathOrHybridModulesMin`       | 4     | Modules using mathematical/technical **or** hybrid views.            |
| `lifeOrHybridModulesMin`       | 4     | Modules using life-metaphor **or** hybrid views.                     |

Notes:

- A "primary active module" requires a learner operation that updates the main graphic
  **and** feedback immediately. Autoplay-only, hover-only, tooltip-only, formula-symbol
  clicks, and chapter-loader buttons **do not count**.
- The one-moving-subject limit applies to **automatic analogy animations**, not to active
  body modules.
- `activeModulesMin` is deliberately light: a strong tutorial can carry one rich module per
  chapter and add a second only where it sharpens the problem→solution contrast (the
  reference good example uses ~11 modules with one dual-module chapter). Quality comes from
  focused, well-specified modules, not from hitting a high count.

---

## §4 Analogy Contract

| Field                | Value                       |
| -------------------- | --------------------------- |
| `analogyCanvasSize`  | `244 x 130`                 |
| `subjects`           | exactly one primary subject |
| `verbs`              | one physical action verb    |
| `goals`              | one visible goal            |
| `staticPropsMax`     | 2                           |
| `movingSubjects`     | 1 (or 1 per panel in a direct before/after comparison, or the Chapter 10 race) |

Pass the `one subject + one verb + one goal` test for every analogy. Prohibited patterns
(packages through workstations, conveyors, assembly lines, handoffs, multi-stage
processes, abstract particle/heat/grid fields) are listed in
`references/animation-library.md` and must never appear.

---

## §5 Color Semantics (Restrained Palette)

These meanings are **stable across every chapter and every Canvas**. Semantic color
explains state, not decoration. Neutrals (`#f5f8f0`, `#b8c9a7`, `#76906a`) cover most
pixels.

| Role                              | Hex       | Meaning                                            |
| --------------------------------- | --------- | -------------------------------------------------- |
| quiet scene background            | `#f5f8f0` | Canvas field; never a loud gradient                |
| light environment                 | `#b8c9a7` | terrain, paper shadow, passive mass                |
| dark environment                  | `#76906a` | depth, contour, secondary detail                   |
| physical route / support          | `#92400e` | guide edge, tool handle, stable support            |
| guidance or current state (blue)  | `#27446e` | selected path, active label, model, progress       |
| success or paper method (green)   | `#228d5c` | repaired route, stable state, best verified result |
| failure or old method (red)       | `#c43f52` | degradation, drift, harmful state                  |
| emphasis / user value (orange)    | `#d97706` | selected marker, parameter emphasis, threshold     |
| auxiliary mechanism (purple)      | `#7c3aed` | secondary method only, used sparingly              |
| main Canvas text                  | `#21324a` | labels and headings                                |
| muted Canvas text                 | `#68778f` | legend and secondary labels                        |
| technical border / axis           | `#d7deea` | inset border, axis, inactive path                  |

Invariants:

- red never means success; green never means failure.
- blue = guidance / current state; orange = user-controlled emphasis; purple = auxiliary.
- Inside CSS, `--blue`, `--green`, `--red`, `--orange`, `--purple` in
  `assets/react-template/src/styles/tokens.css` map to these roles. Do not repurpose
  `--accent` for a different role — it aliases orange (emphasis), not blue.

---

## §6 Detail Floor (Soft, Field-Completeness Based)

The previous hard global character minimum (24,000–60,000 chars) encouraged tail padding
and token bloat. Replace it with **field completeness**:

- Every chapter plan must contain **all** required fields listed in
  `references/intermediate-skill-standard.md` and `scripts/chapter-template.md`.
- `chapterPlanMinChars` (soft): **600** characters of real, paper-specific implementation
  detail per chapter. Below this, the plan is almost certainly under-specified.
- There is **no** global character minimum. Length is a symptom, not a quality gate. The
  automated `scripts/validate-output.js` checks field completeness and structure, not raw
  length.

---

## §7 Bilibili Policy (Optional, Best-Effort)

Video recommendations are an **optional enrichment**, not a blocking requirement.

- **Verification is NOT a gate.** If a relevant video exists, always include and display it
  (video + cover + views) — do not omit the strip just because the Bilibili API or metadata
  fetch failed, or because authenticity could not be verified. Only omit the `bilibili` array
  entirely when genuinely **no relevant video exists** (a thorough search found nothing
  on-topic). Never block the pipeline on video lookup.
- Whenever possible, **bake the cover (`pic`) and views (`stat.view`)** into each entry
  (convert `pic` to `https://`). The unsigned `view` API is often rejected in end-user
  browsers, so baking is what makes the thumbnail and 播放量 reliably appear; the runtime
  `useBiliVideos` loader only enriches when it happens to succeed. If the metadata fetch is
  blocked during generation, still include the card (it shows the video link + title with a
  gradient cover fallback) rather than dropping the whole section.
- Prefer real BVIDs with higher view counts when relevance is comparable; aim for
  `>= 10,000` views, but a uniquely relevant low-view video is acceptable with a written
  reason.
- The final React app must tolerate **zero, one, or several** videos.
  `assets/react-template/src/lib/useBiliVideos.ts` and `src/components/BiliVideos.tsx` treat
  an empty `bvid` as nullable: a card with no BVID is hidden, and a failed fetch shows a
  graceful fallback instead of a permanent loading state.
- The only permitted network-backed feature in the final app is this optional Bilibili
  metadata loader.

---

## §8 Validation

Run `scripts/validate-output.js` on the generated project folder as a hard gate (in addition
to the agent self-checklist in `scripts/validation-checklist.md`). The script checks:

- `kind: "chapter"` count (in `src/data/tutorial.ts`) is within `[chapterCountMin,
  chapterCountMax]` (§2).
- `kind: "module"` count `>= activeModulesMin` (§3), and `>= dualModuleChaptersMin` chapters
  have two modules.
- No leftover template placeholders (`__…__`, `__METAPHOR_CSS__`, `TBD`, `TODO`) in
  `src/data/tutorial.ts`, `src/styles/paper.css`, or `src/modules/*`.
- Optional: Bilibili entries either have a real `bvid` (`BV…`) or are omitted.
- Best-effort: the key framework files (`App.tsx`, `types.ts`, `src/styles/tokens.css`) exist
  and `src/data/tutorial.ts` parses as TypeScript.

---

## §9 Debug Switch

Support an environment flag `PAPER_SKILL_DEBUG=true`:

- When set, the exact task-scoped temporary root containing `source-cache/`, packet work, and the
  temporary paperSkill is **preserved** after generation, and its absolute path is returned to the
  caller alongside the final project folder. This lets a human inspect source extraction, isolated
  chapter work, and Phase 1 output.
- When unset (default), that exact task-scoped root is deleted after validation.
- The final project folder delivered to the end user is identical in both modes.

---

## §10 Output Format (React + TypeScript Project Folder)

The deliverable is a self-contained **Vite + React 18 + TypeScript** project folder named
`<paper-short-name>_output/`, not a single HTML file. `scripts/scaffold.js` copies
`assets/react-template/` into the caller's working directory and injects the paper title.

The app is **data-driven**: it renders entirely from one `src/data/tutorial.ts` object typed
by `src/types.ts`. The generator (Phase 2) rewrites ONLY these files:

- `src/data/tutorial.ts` — the `tutorial` object; replace every `__XXX__` placeholder.
- `src/styles/paper.css` — paper-specific `:root {}` overrides; replace `__METAPHOR_CSS__`.
- `src/modules/*` — paper-specific Canvas widgets, registered in `src/modules/registry.tsx`.
- `public/images/*` — optional original figures (see §11).

Framework files (`src/components/*`, `src/lib/*`, `src/styles/{tokens,components}.css`,
`App.tsx`, `main.tsx`, config files) are copied verbatim by `scaffold.js` and are **never
edited** by the generator. This keeps token cost low and preserves the shared UI.

Hard rules for the output:

- No runtime CDN, external font, or KaTeX/MathJax. The only dependencies are `react` and
  `react-dom`; the only optional network feature is the Bilibili metadata loader (§7).
- All visible tutorial prose, labels, and feedback stay in Simplified Chinese.
- The user runs `npm install && npm run dev` locally to view it; no `dist/` build is committed
  by the generator (source-folder delivery only).

---

## §11 Original Figures (Optional, Best-Effort)

The tutorial **may** embed the paper's original figures. This is optional, never required.

- To include a figure, copy the image into `public/images/` (e.g. `fig1.png`) and reference it
  from the data via a `figure` field using a path **under `/public`** (e.g. `/images/fig1.png`)
  or an absolute URL.
- `figure` may appear on a Hero side (`hero.oldMethod.figure` / `hero.newMethod.figure`), an
  analogy card (`analogy.figure`), or a module (`module.figure`). It is rendered by
  `src/components/Figure.tsx`; when the field is undefined the figure is simply absent and the
  canvas widget (if any) or the text stands alone.
- When no suitable figure exists, omit the field — do not fabricate figures. A best-effort PDF
  figure extraction may place images under `public/images/`, but the absence of figures is
  never a failure.
