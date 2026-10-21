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

The tutorial follows the paper's teaching arc. The model chooses the chapter count and
slide count from distinct teaching questions; chapters group slides and are not slides
themselves. For a substantial paper, **about 10–15 teaching slides including the cover**
is a useful planning target. It is not a permitted range or a validation threshold.
Optional video supplements do not count toward the teaching plan. A shorter or longer
deck is appropriate when the paper's evidence and concepts justify it; never split or
repeat material merely to reach the target.

Rules:

- Give each chapter one coherent scientific question and one or more independent slides.
  Split material when the learning objective or fixed canvas needs another page.
- Preserve the broad learning progression: problem → insight → method/mechanism →
  source-backed evidence → limitations. Add training, inference, proof, architecture,
  system details or ablations only where the actual paper makes them central.

### §2.1 Paper-Specific Chapter Arc

Choose chapter questions from the paper's own contribution and prerequisite chain.
The opening establishes the problem and the core method; the ending compares verified
results, applicability and limitations. Between them, choose only supported roles such as
representation, formal rule, algorithm step, training objective, inference procedure,
architecture consequence, proof, ablation, implementation trade-off or robustness.
Do not use a diffusion-style topic sequence as the default for unrelated papers.

### §2.2 Paper-Type Branching

Select one `paperType` in Phase 1 as a planning hint. It does not fix a chapter number or
change the output language or analogy rules.

| `paperType` | Possible key mechanism | Notes |
| --- | --- | --- |
| `generative` | Sampling, representation, conditioning or architecture, if present. | Generation papers vary widely. |
| `theoretical` | Interactive proof idea, bound, optimization or trade-off. | No network diagram is required. |
| `system` | A theme-grounded system decision with linked technical consequences. | Retrieval, infrastructure and pipelines. |
| `rl` | State, action, value, policy or trajectory judgment. | Control and planning papers. |
| `other` | The paper's actual central mechanism. | Do not borrow a role from another paper type. |

When a paper has **no nontrivial network structure**, do not force an architecture
diagram. Use a different active technical module that satisfies §3.

### §2.3 Chapter Narrative

Use introduction, mechanism, experiment, evidence, and recap as optional teaching roles.
They are not a fixed set of page sections or DOM slots. One slide has one objective and a
freely composed body; a chapter may use as many distinct scenes as its paper content needs.

### §2.4 Fixed Slide Canvas (Hard Presentation Contract)

| Field | Value | Meaning |
| --- | --- | --- |
| `slideWidth` | 1600 | Logical design width in CSS pixels. |
| `slideHeight` | 900 | Logical design height in CSS pixels. |

- Cover, every scene, and video pages share this same 16:9 canvas. Chapters are narrative
  groups, NOT pages. Let the paper determine the page count. One scene answers one question with one
  focal visual. Neither document nor scene content may scroll; external navigation/notes may.
- `SlideStage` measures the available area after TOC and navigation, then scales the whole
  canvas by `min(availableWidth / slideWidth, availableHeight / slideHeight)` with a small
  desktop workspace margin; fullscreen uses the entire fitted area. Center it
  with letterboxing. Use a device-width viewport. Mobile keeps the same composition;
  do not stack panels, grow the slide, or use screen media queries inside slide content.
- Keep a device-width viewport with `user-scalable=yes` and no browser zoom cap. The
  bundled `SlideStage` additionally owns local canvas zoom: two-pointer pinch, one-pointer
  panning while magnified, a zoom/reset control, and wheel zoom on compact screens (Ctrl+
  wheel on desktop). This must work in DevTools touch emulation as well as real mobile.
  Only the gesture-owned stage may use `touch-action:none`; do not disable browser zoom
  globally. Do not change the viewport to a fixed width or reflow slide contents to zoom.
  Controls/TOC stay outside the canvas transform. Reserve single-pointer widget controls
  for their own interaction; widgets must yield to multi-pointer stage gestures.
  No-overflow validation applies at fitted scale; magnified content is intentionally
  clipped to the stage and reached by bounded panning. Reset restores the full slide.
- Every new chapter has explicit `scenes: SceneDef[]`; see `references/presentation-standard.md`.
  Each scene has stable id, title, goal, summary, interaction, next and speaker notes.
  The model composes each body for its own teaching purpose, optionally adapting a visual
  example from `assets/layout-gallery/` or making a custom composition. Record that choice in
  the intermediate plan only; no runtime layout name, slot schema, page-family count or
  evidence-card placement is required. Give every scene its own paper-specific widget so the same
  scene cannot be silently reused under new titles. Reuse drawing primitives and theme cues.
  Every scene has a registered, paper-specific `componentId` for its body. The old built-in
  `intro`, `formula` and `recap` layouts are removed: they produced small split analogies
  or text-only three-point pages. A formula or takeaway belongs inside a substantive
  visual scene, not on an automatic template slide.
  The shared header occupies x=64,y=42,w=1472,h=184; body x=64,y=246,w=1472,h=622.
  Place the chapter marker at the upper right of that header, opposite the scientific
  title. It must not consume a separate full-width row above the title. Keep a short
  goal line only when it adds a learning question that the title does not already state.
  Compose freely inside the body; do not duplicate headers, player chrome or font rules.
  The old single-page chapter layout is not part of the generation format.
- Required chapter content remains accessible across the chapter's pages, not all on one page.
  Capture page outlines from the same scene data into root `outlines.json`.
- All required content remains accessible. Reserve space for the longest feedback,
  inline explanations, controls, and figures. Formula-symbol hints use a viewport-clamped
  overlay that does not reflow the slide; verify its readability near screen edges. If content does not fit,
  split into another scene, edit copy, recompose, or use meaningful in-place steps.
  Do not hide required blocks, truncate text, shrink fonts to evade overflow, create
  nested scrolling cards, or treat `overflow:hidden` as proof that content fits.
- Widgets use their allocated slot size, not the browser width. Canvas pointer coordinates
  must account for the displayed bounding rectangle after stage scaling. Arrow-key controls
  retain their own keyboard behavior; page shortcuts must not intercept interactive targets.
- Browser validation is mandatory for final presentation fit: cover, every chapter, optional
  videos, TOC expanded/collapsed, laptop and large desktop, portrait and landscape mobile.
  Run bundled `src/lib/slideAudit.ts` `auditSlide()` after fonts/images settle and after
  exercising longest feedback, formula selection, and all reveal/tab states. The result
  must be empty. Inspect screenshots for readability and unintended internal overlap;
  geometry checks cannot judge visual quality. If a browser is unavailable, explicitly
  report presentation validation as incomplete instead of claiming a pass.

### §2.5 On-slide typography and space

- Inside each teaching-page **body**, use no more than three readable type roles:
  28px explanation/control/axis text, 34px local concept headings, and 44px focal
  equations or results. These are design-canvas CSS pixels, not device pixels; use
  the shared `--ppt-body-text`, `--ppt-body-heading`, and `--ppt-body-emphasis` tokens.
  Weight, color and spacing can vary without adding another size. The shared page
  title, optional goal and external player controls are outside this body budget.
- Remove eyebrow labels, repeated method names, redundant captions, decorative tags,
  and tiny source labels when the title, graphic or speaker notes already provide the
  information. A result identifier belongs on the slide only when needed to interpret
  the result; otherwise put it in notes. Do not solve fit by shrinking a fourth tier.
- Compose against the full 1472 × 622 body. An intentionally quiet area can focus
  attention, but a small illustration surrounded by unused space is not a finished
  slide. Enlarge the manipulable mechanism, readable explanation, result, or
  comparison before adding decoration.

---

## §3 Interactive Teaching

**Core-method interaction takes priority over metric exploration.** The main method segment
should predominantly consist of learner-operated mechanisms, with readable explanations
integrated into them. A method page lets the learner change an actual input, intermediate
representation, operator, architecture choice, objective or constraint and inspect a computed
consequence of the paper's rule. Evidence-only pages remain useful for reported results.
Filtering a benchmark, growing bars, revealing a fact or changing a metric label does not
substitute for teaching how the method works, even when it is an active results module.
Review coverage of the paper's central contributions, not just the count of registered modules.

Use `references/interaction-patterns.md`'s core-method design test and the assets teaching
demo when planning and implementing. A life object can be the control surface for the same
scientific state; it must do causal work rather than decorate a chart. Compute a transparent
small example or faithful simplified mechanism when full training/inference is impractical.
Clearly label synthetic demonstrations; never fabricate benchmark changes from controls.

Core-method chapters include meaningful learner operations; add another when it teaches a distinct concept. Evidence or boundary chapters may have no active module and use `modules: []`. An active module changes the main graphic and
immediate feedback from the same state. Passive autoplay, hover-only explanations, tooltip
clicks, and navigation do not count. A chapter may also contain a pure life-story introduction,
a scientific principle scene, or a verified result page without forcing those pages into a
repeated module layout.

Plan the **deck-wide mix** before building pages. Aim for about three quarters of body pages
(excluding the cover) to use theme-grounded, learner-driven animated interactions. The learner
operates a recognizable object or action from the selected everyday theme, changing the
paper-relevant state and visible motion together. Review these pages separately from purely
paper-native interactions and static pages in the slide ledger. This is a planning target.
Distribute them through the introduction, main method, result interpretation and
applicability/limitations. Carry the selected everyday theme through the
early, middle and late parts with distinct, paper-relevant physical episodes. Vary their
scale: a full-body event, several linked small interactions, or a compact live scene beside
substantial scientific explanation. Include a late application or failure-and-repair scene
that lets the learner use the core method again.
Each operation changes meaningful motion or a time-evolving scene, a linked paper-relevant
state, and immediate feedback. Use animated paper-native manipulation where a physical
analogy would obscure the mechanism.

Individual derivations, original figures and numerical evidence pages may be static when
that better serves their question. Every page retains a recognizable theme visual: on static
or paper-native pages, add a modest, clearly legible theme illustration, object or vignette
related to that page's concept, comparison condition or conclusion. Compose it beside the
explanation or result so the science stays readable. Vary the object and its state with the
question. Record the visual and its explanatory link in the page plan; static theme icons
remain static pages when reviewing animated-interaction coverage. Give each static page a
teaching reason and plan where the related mechanism interaction resumes. Preserve reported chart values; any adjacent animated
teaching example uses its own clearly identified state. Review the ordered early, middle and
late sequences separately for continuity, meaningful operations and varied theme episodes.
An animated interaction does not mean a decorative entrance, looping background, moving
photo, or autoplay scene with no learner control. Record the action, motion, scientific
state change, feedback, and source/analogy limit together.

Both cover methods mount live animations through registered componentIds and share the
CoverPlayback clock. The cover may introduce an everyday story; later pages may use a
related life episode, a hybrid scene, or a paper-native technical experiment. Every page
shows a concept-relevant visual from the selected theme, with the size and amount of motion
chosen for that page's scientific question. Use small static illustrations for quieter pages
and varied operable episodes for the animated pages.
Put formal material where it answers that question, not in a generic evidence panel.
In active modules, learner input must change a paper-relevant variable, component,
constraint or measured comparison and a visible scientific consequence. Changing only a
photo's opacity, sharpness, position or decorative motion does not meet this requirement,
even if a feedback sentence or formula label changes. Directly manipulate the meaningful
diagram, curve, feature relation, architecture choice, calculation or evidence when it
teaches better than a life scene. Keep labels legible at fitted slide size.

---

## §4 Analogy Contract

| Field                | Value                       |
| -------------------- | --------------------------- |
| `analogyCanvasSize`  | chosen for the scene; an analogy may be small, medium or near full-body according to the teaching question |
| `setting`            | one recognizable everyday activity with recurring visual cues |
| `actions`            | varied physical episodes related to that activity |
| `readability`        | scene and operation legible at fitted slide size |

The theme can contain people, tools, surroundings and related motions when they make the
real-world activity recognizable. Avoid generic dots, paths, boxes and process flows as the
main analogy. Choose visual complexity by legibility, not a prop or moving-object quota.

---

## §5 Color Semantics (Restrained Palette)

These semantic meanings are **stable across every chapter and drawing**. Semantic color
explains state, not decoration. Choose quiet theme-specific environment colors; the
background, terrain and support colors below are examples, not a mandatory green landscape.

| Role                              | Hex       | Meaning                                            |
| --------------------------------- | --------- | -------------------------------------------------- |
| quiet scene background            | `#f5f8f0` | Canvas field; never a loud gradient                |
| light environment                 | `#b8c9a7` | terrain, paper shadow, passive mass                |
| dark environment                  | `#76906a` | depth, contour, secondary detail                   |
| physical route / support          | `#92400e` | guide edge, tool handle, stable support            |
| guidance or current state (blue)  | `#27446e` | selected path, active label, model, progress       |
| success or paper method (green)   | `#228d5c` | repaired route, stable state, best verified result |
| failure or old method (red)       | `#c43f52` | degradation, drift, harmful state                  |
| emphasis / user value (orange)    | `#f07e47` | selected marker, parameter emphasis, threshold     |
| auxiliary mechanism (purple)      | `#7c3aed` | secondary method only, used sparingly              |
| main Canvas text                  | `#21324a` | labels and headings                                |
| muted Canvas text                 | `#68778f` | legend and secondary labels                        |
| technical border / axis           | `#d7deea` | inset border, axis, inactive path                  |

Invariants:

- red never means success; green never means failure.
- blue = guidance / current state; orange = user-controlled emphasis; purple = auxiliary.
- Inside CSS, `--blue`, `--green`, `--red`, `--orange`, `--purple` in
  `assets/react-template/src/styles/tokens.css` map to these roles. `--accent`
  aliases blue (guidance / current state), matching `--ui-accent` from the Shared
  UIKit; orange emphasis is exposed as `--orange` / `--ui-accent-alt`.

---

## §6 Chapter Plan Completeness

Describe each planned page sufficiently to implement its objective, focal visual, learner
operation if any, state changes, feedback and paper boundary. Do not pad a chapter to meet a
character count or repeat the same fields for pages that serve different purposes. The
automated validator checks project structure and syntax; the agent must review scientific
accuracy, teaching quality and rendered slides separately.

---

## §7 Bilibili Policy (Optional, Best-Effort)

Video recommendations are an **optional enrichment**, not a blocking requirement.

- Include a video only when its real BVID and relevance can be established. Never invent a
  BVID, cover or view count. If lookup is unavailable or no relevant video is found, omit
  `bilibili` without blocking tutorial generation.
- Whenever possible, **bake the cover (`pic`) and views (`stat.view`)** into each entry
  (convert `pic` to `https://`). The unsigned `view` API is often rejected in end-user
  browsers, so baking is what makes the thumbnail and 播放量 reliably appear; the runtime
  `useBiliVideos` loader only enriches when it happens to succeed. If the metadata fetch is
  blocked during generation, still include the card (it shows the video link + title with a
  gradient cover fallback) rather than dropping the whole section.
- Prefer relevance over popularity; do not use a view-count threshold.
- The final React app must tolerate **zero, one, or several** videos.
  `assets/react-template/src/lib/useBiliVideos.ts` and `src/components/BiliVideos.tsx` treat
  an empty `bvid` as nullable: a card with no BVID is hidden, and a failed fetch shows a
  graceful fallback instead of a permanent loading state.
- The only permitted network-backed feature in the final app is this optional Bilibili
  metadata loader.

---

## §8 Validation

Run `scripts/syntax-check.js` and `scripts/validate-output.js` on the generated project folder,
in addition to the review in `scripts/validation-checklist.md` and an actual `npm run build`.
`assemble-chapter-packets.js` also checks syntax during assembly.

Check essential project files, at least one chapter, component ID registration and source syntax. `syntax-check.js <folder> --require-parser` requires the project's
TypeScript/esbuild parser; install dependencies before the final check.

Report chapter and slide counts for review. Review module coverage, possible placeholders,
optional video links, headings, scene fields and available outlines. Check scientific coverage,
visible copy and source accuracy, and correct issues where appropriate.

Use the bundled template as the default starting point. Confirm compatibility, interactions
and slide fit through an actual build and browser operation.

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
- `src/modules/*` — paper-specific page bodies and widgets, registered in `src/modules/registry.tsx`.
- `outlines.json` — derived scene outline, emitted by the packet assembler.
- `public/thumbnails/*` — local screenshots of finalized scenes.
- `public/images/*` — optional original figures (see §11).

Framework files (`src/components/*`, `src/lib/*`, `src/styles/{tokens,components,presentation}.css`,
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

- During planning, consider important method overviews, architecture diagrams and algorithm illustrations when the original clarifies the paper better than a new drawing. Select by teaching value and legibility, not a figure quota. Record the chosen figure ID, source locator, caption and intended slide in the intermediate plan; omission is valid when extraction or readable placement is impractical.
- An original-method figure may lead a dedicated explanation slide, appear after a life-based introduction, or support a nearby mechanism interaction. Preserve its scientific relationships and aspect ratio. Use local magnification or clearly marked crops/overlays when necessary; retain access to the full figure and do not remove context that changes its meaning. Separate added Chinese annotations from original labels, and explain the key scientific relation visibly rather than inserting an unexplained image. Put full provenance in speaker notes and a concise figure credit where useful.
- Original figures are supporting scientific material, not a replacement for the deck's core-method interactions. Do not count a static figure, decorative highlight or image zoom alone as a core-method experiment. Existing text inside an original figure may remain unchanged, but it must be readable at the intended viewing scale; enlarge relevant regions or select a different presentation instead of shrinking the figure to fit.
- To include a figure, copy the image into `public/images/` (e.g. `fig1.png`) and reference it
  from a paper-specific scene widget using a **page-relative path** (e.g. `./images/fig1.png`)
  so it works when the tutorial is served from a repository sub-path.
- A paper-specific scene widget may use the reusable `src/components/Figure.tsx` helper to
  display the staged original figure. The cover still requires both live, synchronized method animations.
- When no suitable figure exists, omit it — do not fabricate figures. A best-effort PDF
  figure extraction may place images under `public/images/`, but the absence of figures is
  never a failure.
