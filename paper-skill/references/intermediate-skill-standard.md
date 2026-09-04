# Intermediate PaperSkill Standard

The Phase 1 paperSkill must be implementation-ready. Treat the bundled template as a good exemplar: follow its structure, ordering, and level of specificity. The paper-specific theme must already be selected and locked before the exemplar is read. Never copy or adapt the exemplar's theme, objects, actions, chapter scenes, facts, metrics, formulas, colors, or BVIDs into another paper.

The temporary Skill is the complete build specification consumed by Phase 2. If Phase 2 still needs to invent a scene, interaction, feedback state, Canvas layout, formula explanation, result value, or section order, Phase 1 is incomplete.

## Required Top-Level Order

Use this order exactly:

1. YAML frontmatter.
2. `# <Paper Title> Interactive Tutorial Generator`.
3. One-paragraph purpose and standalone-output statement.
4. Complete directory tree with all six bundled resources.
5. Horizontal separator.
6. `## Paper Metadata` with a fully populated table, including source kind, source SHA-256, locator scheme, and selected cached-figure IDs.
7. Horizontal separator.
8. `## Source Evidence and Boundary Matrix` with claim locators, conditions, evaluation protocols, metric directions, and approved wording.
9. Horizontal separator.
10. `## Unified Everyday Theme: <theme>`.
11. Three-candidate theme scoring record, winner justification, and rejection reasons.
12. Theme mapping table.
13. Paper-specific CSS token overrides.
14. Canvas background and recurring visual motifs.
15. Reusable Canvas drawing kit and exact scene palette.
16. `<chapterCount>`-row visual interaction storyboard (default 10; per `contract.md` §2).
17. Horizontal separator.
18. `## <chapterCount>-Chapter Detailed Plan` (default 10; range 6–10 per `contract.md` §2).
19. That many fully expanded `### §N ...` chapter sections in numerical order.
20. Horizontal separator.
21. `## Formula and Symbol Inventory`.
22. Horizontal separator.
23. `## Verified Bilibili Recommendations`.
24. Horizontal separator.
25. `## Hero Two-Panel Canvas Design`.
26. Horizontal separator.
27. `## Project Generation Instructions` with ordered steps to scaffold the folder, create an immutable shared chapter contract, produce isolated chapter/widget packets, assemble shared files once, add optional figures, enforce hard rules, and validate the folder.

Do not move the generation instructions before the chapter plans. Do not omit separators, the directory tree, Hero specification, or the final six-step procedure.

## Required Chapter Order

Every chapter must follow this internal order:

1. Chapter heading with `§N`, Simplified Chinese title, and badge markup.
2. `Core concept` in one precise sentence.
3. `Chapter role` explaining why it appears here and what question it resolves.
4. `Animation scene` describing the life-based automatic Canvas animation.
5. `Interaction patterns` naming P1-P8 assignments.
6. `Analogy card (560x140)` with animation content, title, and final Simplified Chinese copy.
7. `Interactive Module N.1` with every implementation field below.
8. `Insight bar` after the learner experiences the limitation, when the narrative uses problem-to-solution disclosure.
9. `Interactive Module N.2` for the paper method or a complementary judgment. At least `dualModuleChaptersMin` chapters must contain this second module (per `contract.md` §3).
10. `Formula` after intuition and interaction when the chapter needs math. If no equation is needed, state why instead of inventing one.
11. `Chapter takeaway` with exactly three icon-title-description items.

Never replace a chapter with a short paragraph, a table row, or an aggregate placeholder.

## Required Module Fields

Every interactive module must specify all of these fields:

- **Title:** final Simplified Chinese title.
- **Purpose:** one sentence describing what judgment the learner should form.
- **Presentation mode:** `life metaphor`, `mathematical/technical`, or `hybrid linked views`.
- **Exact operation:** click, chip switch, previous/next step, pointer drag, direct manipulation, or a result-start command.
- **Initial state:** visible objects, selected mode, initial values, and initial feedback before input.
- **Controls and state space:** control labels, discrete options or numeric range, defaults, and disabled/completed states.
- **State variables:** implementation names, types, defaults, and valid values that drive the complete module.
- **Canvas composition:** dimensions, named stable regions, back-to-front draw list, reusable primitives, objects or mathematical marks, labels, and color roles.
- **Visual encoding:** the explicit mapping from each controlled quantity or discrete state to position, path, geometry, color, curve, distribution, bar, dimension, or output.
- **State transitions:** what changes in the main graphic, technical evidence, values, controls, and feedback for every meaningful user action.
- **Immediate feedback:** exact Simplified Chinese wording for poor, intermediate, and successful states when applicable, with red/blue/green semantics.
- **Evidence:** paper equation, architecture fact, ablation, or result that constrains the visualization.
- **Learner judgment:** the conclusion the operation should make obvious.
- **Responsive and access behavior:** mobile stacking, pointer hit mapping, keyboard equivalent when feasible, and stable dimensions.

Avoid vague instructions such as "make it interactive", "show an animation", "display architecture", or "update feedback". Phase 1 must say exactly what the user does and exactly what changes.

## Three Allowed Interactive Presentation Modes

The automatic analogy animation remains life-based and inside the unified theme. Interactive body modules may use any of these modes:

### Life Metaphor

The learner operates a theme-related object through an action chosen from the paper-specific winning theme, such as adjusting pressure, pace, focus, balance, rhythm, amount, or direction. Use this when the physical operation directly embodies the concept.

### Mathematical or Technical

The learner operates coordinate grids, feature maps, architecture nodes, curves, bars, vectors, equations, or verified result charts. Use this when technical structure is clearer than metaphor. Coordinate grids, mathematical marks, and architecture graphs are explicitly allowed here.

### Hybrid Linked Views

Place a life-metaphor view beside a mathematical or technical view. One user action must update both views so the correspondence is visible. Do not create two unrelated passive illustrations.

The model chooses the mode per module. At least four modules should use mathematical/technical or hybrid views so the tutorial does not hide the actual paper behind metaphor. At least four modules should use life-metaphor or hybrid views so the unified theme remains useful beyond the analogy cards.

## Interaction Density

Meet the density minimums defined in `contract.md` §3 (the authoritative numbers):

- `chapterCount` life-based analogy animations (one per chapter, default 10; range 6–10);
- at least `activeModulesMin` active modules total (per `contract.md` §3);
- at least `dualModuleChaptersMin` chapters with two modules (per `contract.md` §3);
- at least `distinctPatternsMin` (6) distinct P1-P8 patterns;
- no more than `p1SliderChaptersMax` (4) P1 slider chapters;
- every module changes Canvas state, a value, an active path, an output, or feedback immediately;
- passive autoplay, hover-only explanation, formula symbol clicks, and chapter-loader buttons do not count toward the active-module total.

## Visual Interaction Completeness

Inline the universal visual grammar from `visual-interaction-standard.md` into each module spec; do not leave a reference for Phase 2 to follow. The unified-theme section must contain:

- at least three scored candidate themes, one newly invented candidate, paper-specific winner justification, and rejection reasons;
- one restrained scene palette with stable semantic colors (per `contract.md` §5);
- the quiet Canvas background, environment treatment, line weights, and label style;
- the recurring subject, target, three to six theme props, and named drawing helpers;
- a `<chapterCount>`-row storyboard with analogy action, dominant learner operation, main graphic, technical evidence, shared state, and feedback transition;
- a one-sentence explanation of how every chapter still belongs to the same activity.

Every module must have one dominant operation and a single source of truth for rendering. The operation must update the main Canvas or active technical graphic plus feedback. When a meaningful quantity exists, it must also update a value, dimensions, output, active path, curve, distribution, or comparison bar.

Technical graphics are evidence, not decoration. A curve, feature map, vector, distribution, bar, architecture graph, or table must either respond directly to the learner-controlled state or remain as a precise evidence record below the active comparison. Do not place an unrelated passive chart beside a life animation.

## Detail Floor

The generated temporary `SKILL.md` must satisfy all of these checks (see `contract.md` §6):

- every required field in this standard and `scripts/chapter-template.md` is filled — no aggregate placeholders;
- `chapterPlanMinChars` (soft, 600) characters of real, paper-specific implementation detail per chapter;
- every analogy card has final animation content, title, and copy;
- every module contains all required module fields;
- the shared Canvas kit, exact scene palette, and `<chapterCount>`-row visual storyboard are complete;
- every module names its state variables, visual encoding, synchronized outputs, and responsive behavior;
- all visible labels and feedback copy are specified in Simplified Chinese;
- result values and formulas are evidence-backed, protocol-aware, and dimensionally consistent;
- architecture controls contain only valid state combinations, with unavailable choices explained;
- no `{{...}}`, `__...__`, `TBD`, `TODO`, "same as above", or `complete-chapter-N-plan` remains.

There is **no global character minimum**. Length alone is not quality; the automated
`scripts/validate-output.js` checks structure and field completeness, not raw length.
Repetition, generic narration, pseudocode padding, and duplicated requirements do not
satisfy the detail floor.

## Architecture Requirement

Every nontrivial network structure must be taught through an active module. The module may be life-metaphor, technical, or hybrid, but a static architecture diagram alone is invalid.

If the paper has **no** nontrivial network structure (e.g. `paperType: theoretical`, per `contract.md` §2.2), do not force an architecture diagram. Replace Chapter 8's architecture module with another active technical module (interactive proof, trade-off, or ablation) that still satisfies the `contract.md` §3 density floor.

Require a meaningful operation such as:

- click a component and update both its highlight and downstream active path;
- switch architecture variants and update dimensions, parameter counts, or output shape;
- step through propagation and update the currently active nodes and tensors;
- drag or reconnect an edge when that operation expresses the paper's structural insight.

Tooltip-only clicks do not count. The module must update highlighting plus at least one of active path, values, output, or explanatory feedback.

## Portability Contract

The intermediate skill is the only artifact Phase 2 reads. It must be self-contained:

- Do not instruct Phase 2 to read `contract.md`, `references/`, `scripts/*.md`, `templates/`, or the parent `SKILL.md`.
- Do not instruct Phase 2 to reopen the original paper or read the Phase 1 `source-cache/`. Embed all required evidence and source boundaries in the intermediate skill, and stage selected cached figures in `assets/react-template/public/images/` before Phase 2.
- Inline every general rule Phase 2 would otherwise need: visual grammar (from `visual-interaction-standard.md`), interaction patterns, color semantics (from `contract.md` §5), chapter order, and hard thresholds.
- The copied `assets/react-template/` directory plus `scaffold.js` and `assemble-chapter-packets.js` supplies and assembles the project; Phase 2 reads those files but no original paper-skill document.
- Phase 2 follows the embedded per-module specs and runs `validate-output.js` as the structural gate.

## Parallel Chapter Packet Contract

Parallel work begins only after the complete evidence matrix, chapter order, terminology,
symbol table, theme, semantic colors, Canvas kit, state conventions, and widget naming rules are
locked. Record these as one immutable shared contract inside the intermediate Skill.

- Give every chapter and `componentId` exactly one owner.
- Let workers read the shared contract and their assigned chapter plans, but write only to their
  isolated packet directories. They never edit the output project or another packet.
- Store shared `meta`, `hero`, and optional `bilibili` data once in `shared.json`.
- Give each packet a `packet.json` listing relative chapter JSON paths and widget entries with
  `componentId`, `exportName`, and relative TSX file path.
- Make every chapter JSON conform to `ChapterDef`; make every widget export the exact named React
  component declared by its packet.
- Use `assemble-chapter-packets.js` as the only writer for `src/data/tutorial.ts`, packet widget
  copies, and `src/modules/registry.tsx`.
- When parallel task support is unavailable, generate the identical packets sequentially rather
  than falling back to direct shared-file edits.

After assembly, one coordinator must review terminology, formula symbols, evidence boundaries,
chapter transitions, duplicated explanations, theme/color consistency, interaction coverage, and
result coverage before the normal validation gate.

## Final Phase 1 Gate

Before executing Phase 2, compare the generated temporary Skill against this standard and the exemplar only for structure, explicitness, and implementation detail. Reject and expand it if it is shorter, less explicit, differently ordered, or leaves more implementation decisions unresolved. Also reject it if reading the exemplar changed the locked theme or introduced its objects, actions, or scene mappings.
