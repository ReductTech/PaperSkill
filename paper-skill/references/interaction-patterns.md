# Interaction Pattern Library

Give core methods meaningful active learner operations. Evidence or boundary chapters may use `modules: []`. The patterns below are
options, not a checklist or a chapter assignment. Choose the operation that best expresses
the paper's mechanism; vary it when the learning question changes.

All controls must update a paper-relevant graphic or computation **and** explanatory feedback
immediately. Prefer direct manipulation of the paper variable, structure or evidence;
use a clearly sized object within the recurring life scene when that expresses the same
mechanism more clearly. Preserve keyboard equivalents.
Use buttons or chips only when they represent a meaningful choice that cannot be made naturally
inside the scene. Do not add pause, step, reset or repeated tag switches as default controls.

## Design the core method before selecting a control

Start from each central contribution, equation or algorithmic decision. Ask what the learner
could change to discover why it works. Make the method segment predominantly hands-on
mechanism experiments; results-chart interaction is supporting evidence, not method coverage.
This is a content review, not a numeric validator quota or a new runtime schema.

For a core-method module, write one concise **causal specification**:

- **Scientific operation:** the paper input, representation, operator or constraint being manipulated.
- **Executable model:** the small computation or explicit state-transition rule, its assumptions
  and source locator. Use a faithful toy calculation when the real model cannot run locally.
- **Control surface:** the draggable object, selectable part, editable example or linked sliders.
  In a hybrid page, say which theme object embodies which scientific variable.
- **Visible consequence:** show the changed intermediate state and output on the main scene,
  together with the relation and enough prose to explain why. A final score alone is insufficient.
- **Contrasting states:** specify two concrete learner inputs and expected intermediate/output
  states that distinguish the method from its baseline or explain its key behavior.

Apply the test: if the graph, labels and caption were removed, would operating the remaining
scene still expose anything about the method? If it merely selects a prewritten conclusion,
redesign it. Charts can be appropriate outputs of a real mechanism, but repeatedly selecting
datasets, growing benchmark bars or revealing numbers cannot carry the method section.
Also ask whether the same widget could teach an unrelated paper by renaming labels; if so,
make its computation and manipulable representation more specific.

Examples of suitable depth (illustrative, not default themes or mandatory topics):

| Scientific question | Learner operation and computed consequence | Possible theme connection |
| --- | --- | --- |
| Residual addition | Edit a small input and residual correction; reconstruct x + F(x), inspect matching dimensions and compare with F(x) alone | Adjust a planned campsite position by a correction; show both base position and correction rather than just a hiker moving |
| Attention weighting | Move/select a query example; recompute scores, normalized weights and the weighted output from a small declared example | Choose relevant observations while reading a trail map; visible observations embody keys/values, not anonymous moving nodes |
| Iterative optimization | Drag an initial candidate or adjust step size; compute successive updates and expose overshoot or convergence | Correct tent placement on uneven ground, linked to the stated objective and update rule |
| Resource-constrained selection | Place/remove items; recompute feasibility and the paper's actual objective, compare an alternative choice | Pack distinct tools into a backpack; do not claim a generic weight sum implements an unrelated paper |

An introductory life scene may remain simpler. Later method pages must expose the paper's
actual relation; do not stretch the same life action across unrelated contributions. Use
different theme episodes, paper-native experiments or several linked sub-interactions inside
one coherent workbench. Keep a single source of scientific state: scene, calculation and
feedback derive from it. Several independently adjustable inputs may jointly teach one
mechanism; “one dominant operation” does not prohibit that.

## Learn behavior from the assets example

Read `assets/react-template/src/modules/MountainJourney.tsx` and its CSS in Phase 1,
after locking the paper-specific theme. In Phase 2 the same reference source is available at
`assets/layout-gallery/teaching-demo/`; read the relevant functions alongside the gallery.
It is a teaching-quality reference, never runtime content to copy into another paper.

- `MountainPack`: selectable scene objects change a derived constraint, visible contents and feedback.
- `MountainMap`: an in-scene choice changes a shared calculation and a time-evolving outcome.
- `MountainClimb`: several small controls form one experiment; a calculation drives the main
  animation, visible formula substitution and explanation together.

Transfer these causal relationships, direct operation and readable integration. Replace the
theme, computation, objects and copy with the current paper; do not inherit the demo's
route/time formula, assumptions or page sequence. The L01–L08 gallery supplies composition
options, while this demo supplies behavior. Inspect both; a layoutRef alone is not a design.

## Module Presentation Modes

The required cover and selected analogy animations are life-based. Active body modules
choose the view that exposes the paper mechanism. The modes are:

- **Life scene:** direct manipulation of an object from the unified theme.
- **Life scene with linked paper principle:** the same action changes the physical scene
  and a readable, source-backed quantity, curve, formula, architecture consequence or result.
- **Paper-native experiment:** direct manipulation of a formula term, feature relation,
  architecture choice, constraint, paper figure or verified comparison. Keep a compact
  theme illustration or object linked to its explanation per contract.md §3.

Choose the paper-native mode when a life prop would only repeat a picture or obscure the
scientific relation. Do not add a technical inset to every interaction to meet a quota.

An active module must form this loop:

```text
learner action -> paper-relevant state change -> visible scientific consequence -> immediate feedback -> conceptual judgment
```

Hover-only explanations, passive autoplay, tooltip-only clicks, formula symbol definitions, and chapter-loader buttons do not count as primary active modules.

Read `visual-interaction-standard.md` before assigning patterns. Each module needs one dominant operation and one shared state model. The operation must update the main Canvas or active technical graphic plus the feedback sentence; also update a value, output, dimensions, selected path, or comparison bar whenever the concept has a meaningful quantity.

Prefer one dominant scientific experiment, one direct-manipulation target or a few linked
controls, and concise feedback. Add a life scene only when it helps the current question;
if dynamic, drive it from the same scientific state. Avoid unrelated mini dashboards.

## P1: Real-Time Slider and Canvas

Use for continuous parameters such as noise, temperature, step count, guidance, or learning rate.

Requirements:

- Label the parameter plainly in Simplified Chinese.
- Display the current value beside the label.
- Update on `input`, not only on `change`.
- Change the paper-relevant graphic/value and visible feedback immediately; a photo
  opacity or position change alone does not count.
- Use green for useful, blue for intermediate, and red for harmful ranges.

## P2: Progress Exploration

Use for training, sampling, inference, or forward and reverse motion within one simple activity.

Requirements:

- Let the learner advance through meaningful states by interacting with the scene; add a
  compact next control only when direct manipulation would obscure the concept.
- Show progress only when a discrete sequence is part of the paper mechanism.
- Explain the visible action in one short Simplified Chinese sentence per step.
- Stop at a meaningful completion state.
- Preserve stable Canvas and control dimensions while content changes.
- If this is a life scene, let the learner advance a recognizable event in the chosen activity. On a technical scene, advance the paper's actual state or procedure. Avoid generic processing pipelines.

## P3: Synchronized Before and After

Use for unguided vs guided, old vs new, or ODE vs SDE comparisons.

Requirements:

- Use equivalent starting states and identical Canvas dimensions.
- Animate both sides on the same time basis.
- Mark the weak side red and the effective side green or blue.
- Keep labels visible without covering the scene.
- A draggable divider is acceptable when it directly improves comparison.
- When started by a button, use one shared start timestamp and hold both final states long enough to compare.

## P4: Discrete Choice

Use for method variants, configuration choices, or several discrete modes.

Requirements:

- Prefer choices made on the main scene. Use compact buttons when the choice has no natural scene target; avoid repeated tag or tab switching.
- Make the selected object or configuration visually explicit; no chip row is required.
- Update Canvas, feedback, and any values immediately.
- Use labels that identify the modes without a separate instruction paragraph.

## P5: Clickable Hotspots

Use for meaningful parts of one recognizable scene or a technical structure when direct inspection is necessary.

Requirements:

- Give clickable regions a pointer cursor and keyboard-equivalent controls when feasible.
- Highlight the selected part with a clear outline or other visible state.
- Place substantial explanations in the page composition without shifting the mechanism; no fixed below-Canvas panel is required. Brief symbol definitions may use the shared tooltip.
- Keep hit testing aligned with CSS-scaled pointer coordinates.
- Require a meaningful state change, not a tooltip-only click. Selecting a component must update its highlight and the active path, values, output, or feedback.
- Use a compact control only when directly selecting or dragging the scene part would be less clear.
- Do not animate packages, data, or ingredients through stations.
- Pair Canvas-only hotspots with a keyboard-operable DOM control when feasible. Reserve room for changing explanations so selections do not shift the slide layout.

## P6: Drag to Explore

Use for distance, similarity, boundaries, paths, movable tools, or 2D parameter exploration.

Requirements:

- Make the draggable object visually obvious.
- Use grab and grabbing cursor states.
- Support pointer events so mouse and touch follow one path.
- Clamp motion to the Canvas.
- Update the scene and feedback during the drag.
- Make the drag operation itself express the concept.

## P7: Auto-Play with Hover Pause

Use only as a supporting demonstration or analogy animation.

Requirements:

- Pause on hover when that helps inspection.
- Pause off-screen with `IntersectionObserver`.
- Resume without a visible play or replay instruction.
- Never use P7 as a chapter's only interaction.
- Count it as an active module only when learner input changes the paper mechanism and a visible consequence. Adding a transport button alone does not qualify.

## P8: Result Race (supporting evidence only)

Use for source-verified benchmark comparisons on a results page.

This pattern does not cover a core-method teaching question. Do not use races or benchmark
selectors as the main interaction across the method pages. Keep reported values fixed to
their actual protocol; learner input cannot imply an unmeasured benchmark improvement.

Requirements:

- Start after a clear learner action on the comparison scene or a compact control.
- Animate verified values from zero or a shared baseline.
- Stagger growth or travel slightly for readability.
- Highlight the paper's method without hiding competitors.
- Show a trophy only when the verified metric supports the win.
- Let the learner start a new comparison through the scene when needed; do not add a dedicated replay bar.

## Choosing an operation

Pick from these patterns only when the paper concept warrants them. Several linked controls can form one large experiment; one directly manipulated scene can carry a full page. Review the deck for repeated controls and layouts, then change only those whose operation no longer teaches a distinct idea.

## Formula symbol explanations

Explain symbols at their occurrence in each teaching formula, including custom slide bodies;
chapter-level `formula.symbols` alone does not annotate a custom component. Use the scaffold's
`src/components/SymbolHint.tsx`:

```tsx
import { SymbolHint } from '../components/SymbolHint';
<strong>
  <SymbolHint meaning="x：残差块的输入特征；与分支输出形状相同。">x</SymbolHint>
  {' + '}
  <SymbolHint meaning="F(x)：残差分支学习的修正量，与输入逐元素相加。">F(x)</SymbolHint>
</strong>
```

Give each meaningful variable, indexed term or operator a source-grounded, context-specific
Chinese explanation; include units or dimensions when useful. Keep composite terms intact
and avoid matching letters inside ordinary words. `Formula` annotates its supplied symbol
inventory; custom HTML/MathML uses `SymbolHint` around the actual term. For SVG/Canvas formulas,
prefer an aligned HTML/MathML formula overlay with these focusable triggers instead of relying
on SVG `<title>` or inaccessible Canvas pixels. Do not add a duplicate symbol-chip row.

Hover and keyboard focus reveal a nearby overlay. Click/tap pins it; a second tap, outside
click or Escape dismisses it. Keep the explanation brief and readable. The shared tooltip is
portaled outside the scaled slide, clamped to the viewport, and does not change slide geometry.
Do not put essential teaching content only in a tooltip, or count symbol hints as core method
interactions. Verify a long definition near the slide edge, keyboard dismissal and mobile tap.
