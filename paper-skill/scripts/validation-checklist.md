# Validation Checklist

Run Phase 1 and Phase 2 in the same invocation. Fix every failed item before continuing. Clean up the exact task-scoped temporary root before any final response or blocker report.

The deliverable is a **React + TypeScript (Vite) project folder** `<paper-short-name>_output/`,
not a single HTML file. `scripts/scaffold.js` copies `assets/react-template/` into the caller's
working directory; the generator then fills `src/data/tutorial.ts`, `src/styles/paper.css`,
`src/modules/*`, and `public/images/*`. See `contract.md` §10.

## Phase 1: Temporary PaperSkill

### Canonical Source Cache

- [ ] One task-scoped temporary root was created before reading the paper, and its exact resolved path is recorded.
- [ ] `source-cache/manifest.json`, `content.md`, and `evidence.json` exist beneath that root.
- [ ] `content.md` contains the complete normalized source with stable page markers for PDF input or file/section markers for LaTeX input.
- [ ] `manifest.json` records source kind, origin, SHA-256 digest, locator scheme, page count when applicable, metadata, and a figure inventory.
- [ ] Every exported original figure stays under `source-cache/figures/`; a figure that could not be exported retains its locator and caption with `file: null`.
- [ ] `evidence.json` contains the same claim, locator, conditions, protocol, and allowed wording rows used by the intermediate Skill.
- [ ] `node scripts/validate-source-cache.js <source-cache>` passes before tutorial planning continues.
- [ ] After cache validation, no Phase 1 step reopens or reparses the original paper; all evidence comes from the canonical cache.

### Structure

- [ ] `SKILL.md` exists and is fully populated under the task-scoped temporary paperSkill directory.
- [ ] The temporary directory is outside `skills/`, and the workspace.
- [ ] `assets/react-template/` exists and contains the full Vite + React + TS scaffold (`src/`, `index.html`, `package.json`, `vite.config.ts`, `tsconfig*.json`).
- [ ] `scripts/scaffold.js`, `scripts/assemble-chapter-packets.js`, and `scripts/validate-output.js` are copied beside the temporary `SKILL.md` (they sit beside `assets/` in the intermediate skill directory).
- [ ] `SKILL.md` follows the reference template order exactly: introduction and tree; metadata with source-cache provenance; source-evidence and boundary matrix; unified theme; `chapterCount` detailed chapters; symbol table; Bilibili table (optional); Hero design; project-generation instructions.
- [ ] Every selected original figure was copied from the validated cache into the temporary scaffold's `public/images/`; no figure requires Phase 2 to reopen the paper or source cache.

### Plan Quality

- [ ] One immutable shared chapter contract locks evidence boundaries, chapter order and dependencies, terminology, formula symbols, theme/colors, Canvas helpers, state conventions, widget naming, and chapter ownership before any parallel work.
- [ ] Every chapter and `componentId` has exactly one owner; Phase 1 workers wrote only to isolated plan-packet directories and never edited another packet.
- [ ] When parallel execution was unavailable, the same packet format was produced sequentially rather than bypassing isolation.
- [ ] The coordinator reviewed all plan packets for terminology, symbols, evidence wording, transitions, duplication, theme consistency, interaction-pattern coverage, and result coverage before materializing the temporary Skill.
- [ ] Paper title, short name, venue, authors, problem, insight, architecture, training, inference, results, and limitations are recorded.
- [ ] A source-evidence matrix anchors every core tutorial claim to a page plus section, equation, figure, or table when available.
- [ ] Explicit paper statements are separated from interpretation; unsupported causal wording and universal claims have been removed.
- [ ] Architecture choices and interaction states include their dimensional, training, inference, or evaluation preconditions; technically impossible combinations are disabled and explained.
- [ ] Every formula records symbol meaning, type or shape where meaningful, sign, normalization, and assumptions.
- [ ] Every reported result records dataset, split or protocol, baseline, unit, and whether higher or lower is better; incompatible protocols are not compared directly.
- [ ] Major ablations, transfer results, failure cases, and limitations reported by the paper are represented or explicitly scoped out with a reason.
- [ ] One familiar anchor everyday theme is selected for the entire tutorial.
- [ ] At least three candidate themes from different activity families were scored on mechanism fit, ten-action coverage, visual clarity, technical linkability, thematic continuity, and originality.
- [ ] At least one candidate was newly invented rather than copied verbatim from the library, and the winner has a paper-specific justification plus rejection reasons for the other candidates.
- [ ] Theme selection does not cite documentation order, example detail, a previous tutorial, or generic progress. Every candidate is treated equally, and the winner has a concrete paper-specific advantage over the rejected candidates.
- [ ] The winning theme was locked before any paper-specific structural exemplar was read and remained unchanged afterward; no exemplar objects, actions, or scene mappings leaked into the plan.
- [ ] The scene table has `chapterCount` rows (default 10; per `contract.md` §2); every row clearly belongs to the anchor theme and records one related action, one primary subject, one action verb, one visible goal, and no more than two static props.
- [ ] The `chapterCount` actions are meaningfully varied within the theme through preparation, tool use, decisions, practice, safety checks, progress, or results rather than repeating the same literal motion.
- [ ] No planned scene uses packages, conveyors, workstations, factory or kitchen assembly lines, delivery chains, handoffs, or multiple independent actors.
- [ ] The unified-theme section defines one reusable Canvas drawing kit: recurring subject or manipulated object, target motif, shared setting, three to six props, named draw helpers, line weights, label style, and restrained scene palette.
- [ ] A `chapterCount`-row visual interaction storyboard records each analogy action, dominant module operation, main graphic, technical evidence, shared state, and feedback transition.
- [ ] Exactly `chapterCount` chapter plans exist, each with one main concept, badge, scene, active interaction, feedback, and takeaways.
- [ ] Detail floor met per `contract.md` §6: every required field filled, `chapterPlanMinChars` (soft, 600) per chapter, and no global character minimum.
- [ ] No chapter uses shorthand such as "same as above", "follow the schema", or `complete-chapter-N-plan`.
- [ ] At least `activeModulesMin` active modules are fully specified, and at least `dualModuleChaptersMin` chapters contain two modules (per `contract.md` §3).
- [ ] Every module records title, purpose, presentation mode, exact operation, initial state, controls and state space, Canvas composition, state transitions, exact feedback copy and colors, evidence, and learner judgment.
- [ ] Every module also records state variable names and valid values, named Canvas regions, back-to-front draw order, reusable primitives, explicit visual encoding, synchronized outputs, responsive behavior, and pointer or keyboard behavior when applicable.
- [ ] Every module has one dominant operation. That operation updates the main graphic plus feedback and, when meaningful, a value, dimensions, output, active path, curve, distribution, or comparison bar.
- [ ] At least `mathOrHybridModulesMin` (4) modules use mathematical/technical or hybrid views, and at least `lifeOrHybridModulesMin` (4) use life-metaphor or hybrid views (per `contract.md` §3).
- [ ] At least `distinctPatternsMin` (6) interaction patterns are used; P1 appears in no more than `p1SliderChaptersMax` (4) chapters (per `contract.md` §3).
- [ ] Bilibili videos are optional (per `contract.md` §7): when present, three or four real BVIDs are displayed with cover + views; verification of the Bilibili API is NOT required to display them. Selected videos normally exceed 10,000 views; lower-view direct explanations include a written exception reason. If absent, the video section is omitted only because no relevant video exists — this is not a failure.
- [ ] No template placeholder remains.

## Phase 2: Final React + TS Project

### Instructional Design

- [ ] The operation itself expresses the concept.
- [ ] Every chapter exposes a limitation before introducing the solution.
- [ ] Every chapter introduces only one major new concept.
- [ ] Equations appear after analogy and interaction.
- [ ] Every chapter communicates the use case, applicability, and core intuition.
- [ ] All chapter analogies visibly belong to one coherent everyday activity while remaining individually simple and direct.

### File and Project Structure

- [ ] Exactly one `<paper-short-name>_output/` folder is produced in the caller's working directory.
- [ ] `scaffold.js` created the folder from `assets/react-template/`; `package.json` name and `index.html` title reflect the paper.
- [ ] `chapter-work/shared.json` contains the single global `meta`, `hero`, and optional `bilibili` records.
- [ ] Every packet owns disjoint chapter IDs and contains a valid `packet.json`, chapter JSON files, and its own widget TSX files.
- [ ] Workers never wrote directly to the output project; `assemble-chapter-packets.js` was the only writer of `tutorial.ts`, packet widget copies, and `registry.tsx`.
- [ ] Packet assembly completed without duplicate/missing chapter IDs, duplicate module/widget IDs, path escapes, missing exports, or unregistered `componentId`s.
- [ ] No KaTeX, MathJax, CDN, external font, or local media folder is required; the only dependencies are `react` and `react-dom`.
- [ ] The only permitted network-backed feature is the optional Bilibili metadata loader (per `contract.md` §7).
- [ ] `src/data/tutorial.ts` is fully filled: `meta`, `hero`, exactly `chapterCount` (`kind:"chapter"`) entries, and `bilibili` (optional). Every `module` entry has `kind:"module"` and a `componentId` registered in `src/modules/registry.tsx`.
- [ ] The Hero (`tutorial.hero`) contains title metadata and old-vs-new contrast (each side may use a canvas widget and/or a figure).
- [ ] `src/styles/paper.css` overrides the `:root{}` scene colors; the `__METAPHOR_CSS__` placeholder is replaced (or removed if no override is needed).
- [ ] The slide layout works end to end (owned by `App.tsx`): sidebar TOC switches chapters, one chapter per screen, bottom nav bar pins to the viewport; videos (if any) appear as the last slide.

### Framework File Integrity

- [ ] Framework files are NOT edited by the generator: `src/components/*`, `src/lib/*`,
  `src/styles/tokens.css`, `src/styles/components.css`, `App.tsx`, `main.tsx`,
  `vite.config.ts`, `tsconfig*.json`, `package.json` (beyond the scaffold-time injection).
- [ ] `src/data/tutorial.ts` is the single content source; no JSX/HTML is hand-written for chapter
  content.
- [ ] Every `componentId` referenced in `tutorial.ts` exists in `src/modules/registry.tsx`; an
  unknown id degrades gracefully (the `Module` component shows a notice) but should still be
  registered for a complete tutorial.
- [ ] Optionally, paper-specific widgets live under `src/modules/*` and are registered in
  `registry.tsx` via `widgetRegistry['id'] = Component`.
- [ ] `src/data/tutorial.ts` and `src/modules/registry.tsx` were assembled once by the coordinator; no parallel worker modified either file or `src/styles/paper.css`.

### UI and Responsive Behavior

- [ ] Design tokens and component CSS load unchanged (imported by `main.tsx`); paper overrides come from `paper.css` only.
- [ ] The DOM shell is rendered by the bundled components: slide layout with sidebar TOC and bottom nav, Hero as the cover slide with one `.hero-inner`, compact comparison-panel headers, and the original component class hierarchy (`chap`, `chap-title`, `module`, `analogy-card`, `formula`, `takeaway`, `dl-related-section`, etc.).
- [ ] Chapters retain the white surface, border, radius, shadow, spacing, and numbered serif title accent from `components.css`.
- [ ] Every `.module` retains its muted header band, white body, border, and bundled padding; paper overrides do not redesign shared components.
- [ ] The video section uses `.dl-related-section`, is outside the chapter count, and keeps the four-item horizontal strip / two-item narrow-screen strip.
- [ ] Body text and component text retain the enlarged typography from the source assets.
- [ ] Hover, active, and `focus-visible` states remain available for interactive elements.
- [ ] Transitions use the provided duration and easing tokens.
- [ ] Canvas widgets fade in through an `is-ready` style after their first successful draw.
- [ ] Paragraphs contain one to three Simplified Chinese sentences and avoid walls of text.
- [ ] Semantic colors remain red for error, green for repair, blue for guidance, orange for emphasis, and purple for auxiliary concepts.
- [ ] Canvas scenes use one restrained tutorial-wide palette and reusable drawing primitives rather than ten unrelated visual styles.
- [ ] Layout does not overflow or overlap on desktop or mobile.

### Interaction

- [ ] Every chapter includes an active operation, not only passive animation.
- [ ] The project contains at least `activeModulesMin` primary active modules, with at least `dualModuleChaptersMin` chapters containing two (per `contract.md` §3).
- [ ] At least `distinctPatternsMin` (6) P1–P8 patterns are used, with P1 in no more than `p1SliderChaptersMax` (4) chapters (per `contract.md` §3).
- [ ] Every control updates values, canvas state, or feedback immediately.
- [ ] Every primary module completes `learner action -> visible state change -> immediate feedback -> conceptual judgment`.
- [ ] Each module has one dominant operation and a compact composition: one main Canvas or synchronized comparison, one control row or direct-manipulation target, one stable detail region when needed, and one feedback bar.
- [ ] The main graphic, technical evidence, value labels, selected controls, and feedback are driven by the same state; no decorative animation sits beside an unrelated chart.
- [ ] Automatic analogy animations are life-based; body modules may use the unified life metaphor, mathematical/technical views, or linked hybrid views.
- [ ] Coordinate grids, feature maps, vectors, architecture graphs, equations, curves, and charts appear only when actively operated or linked to an active control, not as passive filler.
- [ ] Feedback color matches good, intermediate, and poor states.
- [ ] Buttons, chips, and custom hit targets remain keyboard accessible where feasible.
- [ ] The page contains no visible operation tutorial, replay instruction, or next-section instruction copy.

### Canvas / Widget Implementation

- [ ] Automatic analogy animations and Hero animations use recognizable real-world objects rather than abstract fields, grids, heat maps, particle clouds, or mathematical wave plots.
- [ ] Every analogy can be described as `one subject + one verb + one goal`.
- [ ] Every analogy uses no more than two static supporting props and only one independently moving subject, except one subject per panel in a direct comparison and the Chapter 10 result race.
- [ ] Motion is one continuous action from the selected paper-specific theme, such as writing, watering, tuning, stirring, running, pouring, driving, shining, shaping, rolling, or stacking; the list is illustrative rather than a theme preference.
- [ ] No analogy contains packages through workstations, conveyors, assembly lines, delivery chains, multiple workers or machines, labeled-box sequences, or multi-stage handoffs.
- [ ] Every nontrivial network structure appears in a dedicated interactive module rather than only as a static diagram. The module may be life-metaphor, mathematical/technical, or hybrid.
- [ ] The architecture module supports a meaningful click, switch, step, or drag operation and immediately updates component highlighting, the active path, values or output, and feedback.
- [ ] Widgets use `canvasKit.ts` (`setupCanvas` / `observeCanvas`) for sizing and off-screen pausing; each widget has independent state.
- [ ] Every Canvas/widget adds `is-ready` after its first successful draw.
- [ ] No widget draws replay instructions.
- [ ] Canvas drawing order keeps background, environment or axes, inactive paths, active paths, subject or selected component, target or value, and sparse labels visually legible.
- [ ] Active states use at least two visible cues such as color plus stroke, fill plus outline, or position plus label; semantic meaning does not rely on color alone.
- [ ] Technical curves, distributions, feature views, bars, dimensions, and architecture marks are evidence-backed and respond to an active state unless they are exact result records below the interaction.

### Content and Figures

- [ ] Visible explanatory prose is natural Simplified Chinese.
- [ ] Formula cards use Unicode and HTML, with clickable symbols and matching descriptions.
- [ ] Results and limitations match the paper and are not invented.
- [ ] Core claims retain the scope and boundary recorded in the source-evidence matrix; analogy language does not overstate causality or applicability.
- [ ] Architecture controls expose only technically valid combinations and explain unavailable choices.
- [ ] Formula symbols, dimensions, signs, normalization, and assumptions match the paper.
- [ ] Result labels include the correct protocol and metric direction; higher-is-better and lower-is-better comparisons use the correct visual and verbal conclusion.
- [ ] When the paper reports them, major ablations, cross-task transfer results, failure cases, and limitations are covered rather than replaced by a single headline benchmark.
- [ ] Bilibili videos are optional: when present, every `bvid` is real and displayed with a baked-in `cover` and `views` (the runtime `useBiliVideos` loader is best-effort enrichment only, since the unsigned `view` API is often rejected in end-user browsers). Verification of accessibility is not required to display. When absent, the video section is simply omitted because no relevant video exists.
- [ ] Original paper figures are optional (per `contract.md` §11): when included, the image lives in `public/images/` and is referenced via a `figure` field (`/images/...` path or absolute URL); when omitted, no figure is fabricated.
- [ ] Every local original figure came from the validated Phase 1 cache and was already staged in the temporary scaffold before Phase 2 began.
- [ ] No unnecessary template or implementation comments remain in `src/data/tutorial.ts`.

## Automated Validator Gate

Run `scripts/validate-output.js` against the produced project folder as a hard gate (in addition
to the self-checks above):

```bash
node scripts/validate-output.js <path-to>/<paper-short-name>_output
```

- [ ] `kind: "chapter"` count is within `[chapterCountMin, chapterCountMax]` (6–10) per `contract.md` §2.
- [ ] `kind: "module"` count `>= activeModulesMin`; `>= dualModuleChaptersMin` chapters have two modules (per `contract.md` §3).
- [ ] No leftover template placeholders (`__…__`, `__METAPHOR_CSS__`, `TBD`, `TODO`) in `src/data/tutorial.ts`, `src/styles/paper.css`, or `src/modules/*`.
- [ ] Every Bilibili entry (if any) has a real `bvid` (`BV…`) or is omitted.
- [ ] `src/data/tutorial.ts` and `src/styles/paper.css` exist and parse without a leftover placeholder.

The script exits non-zero on any failure; treat that as a blocker.

## Cleanup Gate

- [ ] The recorded task root, source-cache path, packet-work paths, and intermediate path were resolved again before cleanup.
- [ ] The source cache, plan packets, chapter-work packets, and intermediate skill were confirmed as children of the exact task-scoped root created before source parsing.
- [ ] Only that exact task-scoped root was recursively removed; no wildcard, unresolved variable, or broad system temporary directory was used.
- [ ] The task root, source cache, packet work, and temporary paperSkill no longer exist.
- [ ] The final response exposes only the project folder, never the intermediate path or contents.
