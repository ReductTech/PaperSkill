# Intermediate PaperSkill Standard

The Phase 1 paperSkill must be implementation-ready. Treat the bundled template as a good exemplar: follow its structure, ordering, and level of specificity. The paper-specific theme must already be selected and locked before the exemplar is read. Never copy or adapt the exemplar's theme, objects, actions, chapter scenes, facts, metrics, formulas, colors, or BVIDs into another paper.

The temporary Skill is the paper-specific content and slide plan consumed by Phase 2 **alongside the staged global guides, visual layout gallery, and React scaffold**. It records the scientific content and intended composition for every slide; Phase 2 adapts the chosen reference or builds the specified custom layout. If Phase 2 still needs to invent the teaching relationship, physical event, feedback state, formula explanation or result value, Phase 1 is incomplete.

## Required content and order

Use `templates/skill-template.md` as the section order: frontmatter and purpose; temporary skill directory tree; paper metadata and evidence boundaries; chosen everyday theme and visual kit; fully expanded chapter/slide plans; symbol inventory; optional verified videos; Hero comparison; project-generation instructions. The paper's content determines how much space each section needs. Keep the build instructions after the plans, and retain all six generation steps in the template. Avoid adding duplicate rule sections simply to match an exemplar's length.

The theme section briefly compares candidates and records the paper-specific winner. The chapter plans include a scene-by-scene visual storyboard with selected physical episodes or paper-native experiments, `layoutRef` values or custom geometry, and widget IDs. Review the deck as a contact sheet before implementation.

Add a compact deck-wide scene ledger before the detailed chapter plans. For each slide,
record its teaching role, theme episode or static theme visual and its explanatory link, learner operation, meaningful motion,
linked paper variable or result, and source locator. For a static page, state why it serves
the question and where the related mechanism interaction resumes. Use it to choose
the slide count around `contract.md` §2's planning target when appropriate and to find
long stretches without animated interaction. This is a planning aid, not a runtime
schema or validator quota. Review the early, middle and late sequences separately against
contract.md §3. Plan a late application or failure-and-repair interaction that revisits the
core method through a new episode in the selected theme.

## Chapter planning without repeated slots

Write each chapter in full, but let the paper's questions determine the number, order and form of its slides. Do not repeat an analogy → module → formula → conclusion sequence in every chapter. Specify the scientific objective, view mode (life / hybrid / paper-native), distinctive focal object or episode, page sketch, learner decision, expected visible scientific change, paper claim and source/analogy boundary. Interactive scenes need implementation-level states and feedback. A formula, verified result or limitation appears when it does explanatory work, not because a chapter form has a slot for it.

For every slide, record its scene ID, scientific question, view mode and distinct focal object, `layoutRef: L01…L08` from `assets/layout-gallery/` or `layoutRef: custom`, reason for that choice, paper-specific spatial sketch, approximate relative space for the manipulable mechanism / any life animation / explanation / evidence, visible teaching copy, learner operation and scientific feedback, component ID, source and analogy boundary, and worst-case fit. Record which body text uses each of the three roles in `contract.md` §2.5 and which small labels were omitted. A custom reference requires a clear geometry sketch. The reference is a **planning pointer**, not a runtime `SceneDef` or `outlines.json` property. Phase 2 must inspect the staged gallery, then implement the plan; it may adapt the example rather than reproduce its proportions exactly.

For an animated interactive slide, also specify the motion's initial, intermediate and
result states, how learner input drives the motion, and which scientific value or visual
changes at the same time. Passive motion does not qualify.

The plan is complete when Phase 2 can build each page without inventing the teaching relationship or a major visual action. It need not prescribe a fixed set of cards, panels or headings. Give formal explanation substantial space when the paper concept needs it; a small life animation can be enough.

## Required Module Fields

Core-method modules also record the causal specification from `interaction-patterns.md`:
scientific operation, executable computation or transition rule with source/assumptions,
control surface, visible intermediate and output states, and two contrasting learner inputs
with expected consequences. In the deck ledger identify which core contribution each such
module teaches; mark benchmark controls as supporting evidence. Check method coverage and
depth independently of the animated-page target. Inspect the assets behavior reference
alongside the layout gallery; Phase 2 receives its source in `assets/layout-gallery/teaching-demo/`.

Every interactive module must specify all of these fields:

- **Title:** final Simplified Chinese title using the paper's actual method or concept
  terminology; reserve everyday metaphor wording for the explanation and interaction copy.
- **Purpose:** one sentence describing what judgment the learner should form.
- **Presentation mode:** life introduction, life-plus-paper-principle interaction, or paper-native
  principle/evidence experiment. A technical page retains a compact theme visual linked to its scientific explanation per contract.md §3.
- **Exact operation:** direct manipulation, a few linked sliders or drag targets, an in-scene
  choice, or a result-start action; avoid detached transport and repeated tag switches.
- **Initial state:** visible objects, selected mode, initial values, and initial feedback before input.
- **Controls and state space:** control labels, discrete options or numeric range, defaults, and disabled/completed states.
- **State variables:** implementation names, types, defaults, and valid values that drive the complete module.
- **Visual composition:** allocated body regions and major objects; Canvas draw order, SVG viewBox or DOM structure as applicable.
- **Visual encoding:** the explicit mapping from each controlled paper quantity or discrete state to position, path, geometry, color, curve, distribution, bar, dimension, or output. A cosmetic photo effect alone is not a scientific encoding.
- **State transitions:** what changes in the main graphic, controls and feedback for every meaningful user action, plus any technical view on that page.
- **Immediate feedback:** exact Simplified Chinese wording for poor, intermediate, and successful states when applicable, with red/blue/green semantics.
- **Evidence:** paper equation, architecture fact, ablation, or result that constrains the visualization.
- **Principle mapping:** record how the scene action relates to the paper variable or component,
  including the source and limits; specify an equation, prediction or measured result when that page teaches it.
- **Analogy boundary:** what the physical scene simplifies or cannot establish about the paper.
- **Learner judgment:** the conclusion the operation should make obvious.
- **Responsive and access behavior:** fixed-canvas fit and mobile pinch/pan, transformed pointer hit mapping, keyboard equivalent when feasible, and stable dimensions; no mobile stacking inside the slide.

Avoid vague instructions such as "make it interactive", "show an animation", "display architecture", or "update feedback". Phase 1 must say exactly what the user does and exactly what changes.

## Interactive Presentation Modes

The cover, selected analogies and interactive body modules remain connected by one recognizable
everyday story. The selected theme needs a scene-beat map for the pages where it clarifies
the science; mark other pages as paper-native technical experiments. Plan a recognizable,
concept-relevant theme visual for every page, including compact static illustrations for
technical or evidence pages per contract.md §3. Do not fill the
deck with the same literal image or motion. The opening may be pure animation, but it ends
by naming the paper's core method.
After that, choose how to integrate readable scientific content:

### Life Metaphor

The learner operates a theme-related object through an action chosen from the paper-specific winning theme, such as adjusting pressure, pace, focus, balance, rhythm, amount, or direction. Use this when the physical operation directly embodies the concept.

### Technical Evidence Within the Life Scene

The learner operates the life scene; a readable formula, architecture fact, curve, quantity or
verified result responds from the same state. The formal principle is a teaching element, not
a tiny decorative footnote. Do not make an abstract node graph, data flow or dashboard the
main teaching image.

### Hybrid Linked Views

One user action updates the physical scene and adjacent technical mechanism or evidence.
Give each enough space to read on a projected slide; do not create two unrelated passive
illustrations or many mini widgets. A separate principle/evidence slide may use a different
balance when needed.

Integrate paper-specific mathematical/technical mechanisms and evidence where the learning questions require them, so the tutorial does not hide the actual paper behind metaphor. Life/hybrid modules state their mapping to the selected theme and its boundary. Paper-native modules retain a compact theme visual linked to their explanation; choose its size to preserve scientific readability per contract.md §3.

## Interaction Density

Review core-method coverage and the suggested deck-wide mix in `contract.md` §3; there is no per-chapter module quota:

- meaningful interactive coverage of core methods; evidence or boundary chapters may have no module;
- a continuing everyday story with distinct physical episodes where analogy helps;
- interaction patterns chosen for the paper's mechanism rather than to fill a quota;
- every module changes its main visual and immediate feedback from the learner's action;
- passive autoplay, hover-only explanation, formula symbol clicks, and chapter-loader buttons do not count toward the active-module total.

## Visual Interaction Completeness

Apply the staged `visual-interaction-standard.md` in Phase 2; the intermediate plan records only its paper-specific application, not a copied universal rule block. The unified-theme section must contain:

- considered candidate themes, paper-specific winner justification, and the main alternative's weakness;
- one restrained scene palette with stable semantic colors (per `contract.md` §5);
- the quiet Canvas background, environment treatment, line weights, and label style;
- recurring settings, objects and named drawing helpers that suit the selected activity;
- a scene-by-scene storyboard with selected life episode or paper-native focal mechanism, layout reference or custom geometry, dominant learner operation, main graphic, shared state, and feedback transition;
- a one-sentence explanation of how visual continuity survives on technical pages without forcing a repeated prop.

Every module must have one dominant operation and a single source of truth for rendering. The operation must update the main Canvas or active technical graphic plus feedback. When a meaningful quantity exists, it must also update a value, dimensions, output, active path, curve, distribution, or comparison bar.

Technical graphics are evidence, not decoration. A curve, feature map, vector, distribution,
bar or table must respond directly to the learner-controlled state or remain a precise, compact
evidence record. Do not place an unrelated chart or node diagram beside the life animation.

## Detail Floor

The generated temporary `SKILL.md` must satisfy all of these checks (see `contract.md` §6):

- every required field in this standard and `scripts/chapter-template.md` is filled — no aggregate placeholders;
- each planned life scene has enough detail to implement its animation or interaction;
- every module contains all required module fields;
- the shared drawing kit, exact semantic palette, and scene-by-scene storyboard are complete;
- every module names its state variables, visual encoding, synchronized outputs, and responsive behavior;
- all visible labels and feedback copy are specified in Simplified Chinese;
- result values and formulas are evidence-backed, protocol-aware, and dimensionally consistent;
- architecture controls contain only valid state combinations, with unavailable choices explained;
- no `{{...}}`, `__...__`, `TBD`, `TODO`, "same as above", or `complete-chapter-N-plan` remains.

There is **no character minimum**. Length alone is not quality; the automated
`scripts/validate-output.js` checks structure, not scientific or pedagogical completeness, and
`scripts/syntax-check.js` parses every generated source with TypeScript/esbuild.
Repetition, generic narration, pseudocode padding, and duplicated requirements do not
satisfy the detail floor.

## Architecture Requirement

Every nontrivial network structure must be taught through an active module. Use a recognizable
theme-related action when it clarifies the architecture, or let learners directly manipulate
the paper's structure. Link the action to a readable technical consequence; a static
architecture diagram alone is invalid.

If the paper has **no** nontrivial network structure (e.g. `paperType: theoretical`, per `contract.md` §2.2), do not force an architecture diagram. Teach its actual central mechanism through an active proof, trade-off, or ablation module that still satisfies the `contract.md` §3 density floor.

Require a meaningful learner operation in the recurring life scene or the scientific structure
itself. Its effect must reveal an architecture choice and update a relevant quantity, outcome,
or concise explanatory feedback. A tooltip-only click does not count. Keep architecture
evidence readable without turning the page into node-and-edge flow animation.

## Global Review Contract

The intermediate skill must be complete on paper-specific evidence, theme, every slide's content and layout decision, and interactive states. It does **not** need to duplicate all general rules. Phase 2 reads these sources together before implementation:

- `SKILL.md` in the temporary paperSkill for the paper-specific plan;
- `assets/global-guides/SKILL.md`, `contract.md`, and relevant `references/` and `scripts/*.md` for the full skill's rules and checks;
- `assets/layout-gallery/` for visual composition references;
- `assets/react-template/`, especially `src/types.ts`, for the actual runtime schema and framework;
- the validated task `source-cache/` only when a paper fact or locator needs checking.

The global contract owns hard dimensions and colors; the intermediate plan owns paper facts and scene choices; the scaffold type definitions own runtime fields. Correct a conflicting intermediate instruction before generating code. Stage selected cached figures in `assets/react-template/public/images/` before Phase 2. Run `syntax-check.js <outputDir> --require-parser` after `npm install` and `validate-output.js` as the structural gate; assembly parses every widget during generation.

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
  copies, and `src/modules/registry.tsx`; it syntax-checks the assembled sources before returning.
- When parallel task support is unavailable, generate the identical packets sequentially rather
  than falling back to direct shared-file edits.

After assembly, one coordinator must review terminology, formula symbols, evidence boundaries,
chapter transitions, duplicated explanations, theme/color consistency, interaction coverage, and
result coverage before the normal validation gate.

## Final Phase 1 Gate

Before executing Phase 2, check that the generated temporary skill identifies the paper's theme, claims, planned pages, interactions, evidence boundaries and validation steps clearly enough to build without inventing core teaching relationships. Do not expand it merely to match an exemplar's length or sequence. Reject any scene copied from the source demo or an unrelated paper.

## Presentation integration

Use `presentation-standard.md` and the actual `SceneDef` schema for fixed-canvas layout,
shared header, player behavior, thumbnails and browser acceptance. The intermediate plan
records each page's content, layout reference, geometry and interaction states; it does not
repeat the complete player specification.

## Formula hint planning

For each slide with a formula, identify the visible terms to annotate and their concise
Simplified Chinese meanings in context (units/shapes where relevant). Reuse the canonical
symbol inventory without changing meanings. Record whether the body uses `Formula` or custom
`SymbolHint` annotations; a chapter symbol table does not automatically annotate its widget.
Follow `interaction-patterns.md` for hover, focus and tap behavior; this is supporting help,
not a replacement for the slide's scientific explanation or active mechanism.
