# Universal Paper Tutorial Visual Interaction Standard

This standard applies to every paper handled by `paper-skill`. It defines a reusable way to turn difficult ideas into coherent life-based animations, active technical graphics, and evidence-backed interactive modules. Apply the principles to the current paper's problem, domain, architecture, equations, experiments, and chosen everyday theme.

The target is a page that feels like one coherent interactive lesson: calm colors, one recurring everyday world, one dominant operation per module, compact technical graphics, and immediate evidence-backed feedback. Theme examples are illustrative only; theme selection must come from the current paper through `metaphor-library.md` and must not copy the nearest example.

Named activities, subjects, props, verbs, and concept mappings in this file are examples, not templates or defaults. Every concrete life scene is replaceable. Determine the actual activity and scenes from the current paper after candidate scoring. Preserve only the interaction relationships, such as one control driving a life view and technical evidence together.

## Contents

1. Tutorial-wide visual world
2. Restrained color grammar
3. Module anatomy
4. State-to-graphic contract
5. Proven interaction compositions and ten tutorial blueprints
6. Hybrid life and technical views
7. Canvas drawing hierarchy
8. Motion and timing
9. Interaction implementation details
10. Clarity gate

## 1. Tutorial-Wide Visual World

Choose one anchor activity and build a small reusable drawing kit before planning chapters. Reuse that kit in the Hero, all `chapterCount` analogy cards (default 10; per `contract.md` §2), and any body module that uses the life metaphor.

The kit must define:

- one quiet Canvas background and one ground, paper, road, track, desk, or terrain layer;
- one recurring protagonist or manipulated object;
- three to six recurring props that belong naturally to the activity;
- one target marker or completed-state motif;
- helper functions for the protagonist, setting, path, target, label, and legend;
- one semantic color map shared by the whole page.

The visual continuity should be obvious without making every chapter repeat the same literal action. Derive varied actions from preparation, execution, adjustment, inspection, correction, comparison, and completion inside the selected activity. Do not let an activity mentioned in documentation become the theme unless it wins the paper-specific candidate scoring process.

Do not introduce a new decorative world for each chapter. Mathematical or technical graphics may vary, but their line weights, labels, borders, and semantic colors must still match the shared kit.

## 2. Restrained Color Grammar

Keep the bundled reference template's page CSS unchanged. Inside paper-specific Canvas drawings, start from this restrained reference grammar and adapt only the scene neutrals when the anchor activity requires it.

> The exact hex values below are mirrored from `contract.md` §5, which is the single
> source of truth. Change a color only there; do not redefine it in this file. The
> semantic roles (red = failure, green = success, blue = guidance, orange = emphasis,
> purple = auxiliary) are invariant across every chapter and Canvas.

| Role                              | Reference color | Use                                                     |
| --------------------------------- | --------------- | ------------------------------------------------------- |
| quiet scene background            | `#f5f8f0`       | Canvas field, never a loud gradient                     |
| light environment                 | `#b8c9a7`       | terrain, paper shadow, track, or passive mass           |
| dark environment                  | `#76906a`       | depth, contour, or secondary environment detail         |
| physical route or support         | `#92400e`       | guide edge, tool handle, track, or stable support       |
| guidance or current state         | `#27446e`       | selected path, active label, model, or neutral progress |
| success or paper method           | `#228d5c`       | repaired route, stable state, best verified result      |
| failure or old method             | `#c43f52`       | degradation, drift, unstable route, harmful state       |
| emphasis or user-controlled value | `#d97706`       | selected marker, parameter emphasis, threshold          |
| auxiliary mechanism               | `#7c3aed`       | secondary method only, used sparingly                   |
| main Canvas text                  | `#21324a`       | labels and headings                                     |
| muted Canvas text                 | `#68778f`       | legend and secondary labels                             |
| technical border or axis          | `#d7deea`       | inset border, axis, inactive path                       |

Use neutrals for most pixels. Semantic colors should explain state, not decorate the page. Keep the same meaning in every chapter: red never becomes success, and green never becomes failure.

## 3. Module Anatomy

Each primary module should read as one framed teaching tool with this order:

```text
short module title
one-sentence purpose
one dominant Canvas or synchronized comparison
one compact control row or one obvious direct-manipulation target
one stable value or detail region when needed
one immediate feedback bar
optional evidence table or metrics below the interaction
```

Prefer one `1080 x 280` intrinsic Canvas. Use two equal smaller Canvases only for a true synchronized comparison. Keep the `560 x 140` analogy Canvas separate from the primary module.

Do not turn a module into a dashboard. Avoid several unrelated charts, nested cards, floating annotations, or multiple control clusters. One operation may update several linked views, but the learner should still be able to name that operation with one verb: adjust, choose, click, step, drag, compare, or start.

## 4. State-to-Graphic Contract

Every active module must define one state model that drives all visible outputs. A control must never change only a label or only a decorative animation.

For every meaningful operation, update at least:

1. the main Canvas state, active path, selected component, or technical graphic; and
2. the feedback sentence.

Also update a value label, dimension, output, metric, or comparison bar whenever the concept has a meaningful quantity.

Specify these states in the intermediate paperSkill:

- **Initial:** the old method, neutral baseline, first step, or unselected architecture state visible before input.
- **Exploration:** one or more intermediate settings that visibly change geometry, motion, path, distribution, curve, or values.
- **Failure or trade-off:** a red or orange state with a precise reason, when supported by the paper.
- **Success or paper method:** a green state with the mechanism and result made visible.
- **Completion:** disabled, selected, or final state for step-through and race interactions.

Ambient `requestAnimationFrame` motion may make the scene feel alive, but the conceptual state comes from learner input. Use a pure or nearly pure `render(state, time)` function so Canvas, value labels, and feedback cannot drift out of sync.

## 5. Proven Interaction Compositions

Use the following compositions as a reusable library. Adapt them to the paper instead of assigning them mechanically by chapter number.

| Composition                                    | Learner operation                                      | Main graphic                                                                   | Technical evidence                                                                         | Immediate feedback                                           |
| ---------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Continuous stress plus repair                  | adjust one parameter, then toggle the paper method     | difficulty, route, or object visibly worsens and recovers                      | curve, error bar, confidence, or measured value                                            | names the threshold and why repair works                     |
| Clickable progression                          | click one of three to six landmarks                    | recurring subject moves to the selected position                               | stable inset changes from pixels to edges, states to features, or local to global evidence | names the selected level and its representation              |
| Synchronized old/new                           | press one shared start button                          | equal-size panels begin from the same state and time basis                     | comparable path length, output, loss, or error                                             | states the observed difference, not just the winner          |
| Physical magnitude plus mathematical magnitude | adjust one parameter                                   | stream width, step size, slope, beam, fill level, or stability changes         | linked gradient, curve, distribution, or scalar changes at the same time                   | explains the mechanism represented by the physical cue       |
| Mode chips plus trade-off                      | choose among two to four discrete methods              | route, tool, configuration, or architecture visibly changes                    | parameters, accuracy, compute, dimensions, or ablation bars update                         | identifies the recommended trade-off with evidence           |
| Step-through route                             | previous, next, or reset                               | one recurring subject advances through a stable route                          | current tensor shape, stage name, equation term, or output appears in place                | one short sentence per step; final control disables cleanly  |
| Parameter plus curve                           | adjust a learning or inference setting                 | life cue shows too weak, useful, and harmful ranges                            | a linked loss, quality, probability, or stability curve changes                            | uses red/orange/green ranges grounded in evidence            |
| Interactive architecture map                   | click a stage or switch a variant                      | selected node and active path highlight in the same stable graph               | output shape, block count, parameter count, or rationale updates in a fixed detail region  | tells what the selected component does and why it exists     |
| Inspect and compare                            | click a sample, freeze state, or switch modes          | two aligned distributions, feature maps, or outputs become directly comparable | center, spread, score, or activation statistics update                                     | names what became stable, sparse, aligned, or robust         |
| Verified result race                           | press a comparison button and optionally switch metric | competitors move from one shared baseline on one axis                          | verified table and compact metrics remain visible below                                    | explains metric direction and the evidence-backed conclusion |

Hover pause may support inspection, but it is not the primary operation. Supply an explicit button, chip, click target, step control, or drag path when a module must count as active.

### Ten Universal Tutorial Blueprints

Use these blueprints for the standard `chapterCount`-chapter narrative (default 10; range
6–10 per `contract.md` §2). They apply to vision, language, audio, generative modeling,
reinforcement learning, graphs, 3D, optimization, and other machine-learning papers.
Adapt the operation and evidence to the paper instead of forcing a particular metaphor or
network type. When `chapterCount` is not 10, merge or split adjacent roles rather than
reordering the pedagogy.

| Tutorial role                            | Automatic life-based animation                                                                                                                             | Active module construction                                                                                                                | Technical or mathematical evidence                                                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Problem and limitation                | one familiar action becomes visibly harder, noisier, slower, less stable, or less accurate as one condition changes                                        | a slider, drag, or discrete choice stresses the baseline; a comparable control then applies the paper's solution under the same condition | error, loss, quality, confidence, compute, or failure frequency changes from the same state                                                         |
| 2. Input and representation              | one subject changes viewpoint, detail level, shape, wording, sound, or grouping within the shared activity                                                 | clicking three to six positions, regions, tokens, samples, or stages updates one fixed detail inset                                       | pixels, patches, tokens, embeddings, features, waveforms, points, nodes, or latent coordinates update without moving the layout                     |
| 3. Core insight                          | the same goal is attempted through an old route and a paper-method route                                                                                   | one shared start button or mode switch compares equivalent initial states and time bases                                                  | active paths, outputs, errors, retained information, or reversibility are shown side by side                                                        |
| 4. Mathematical mechanism                | an invisible quantity is represented by one intuitive physical magnitude such as distance, pressure, tension, width, pace, angle, fill level, or stability | one control changes the physical cue and the formal graphic together                                                                      | probability, gradient, energy, objective term, similarity, norm, derivative, or vector geometry updates from the same variable                      |
| 5. Method choices or conditioning        | one everyday tool, route, ingredient, guide, or support changes among a few meaningful alternatives                                                        | two to four chips switch variants while the main geometry and recommendation state update                                                 | ablation values, parameter cost, compute, dimensions, quality, guidance strength, or trade-off bars change immediately                              |
| 6. Inference, sampling, or execution     | one subject progresses through a single coherent action toward a visible completion state                                                                  | previous, next, reset, or direct stage selection advances through a stable route                                                          | current tensor shape, token state, sample quality, action, timestep, node state, or output is shown for each step                                   |
| 7. Training and optimization             | pace, pressure, repetition, correction size, or another theme-related training cue moves through weak, useful, and harmful ranges                          | one parameter control or short training sequence changes the life cue and learning behavior together                                      | loss curve, gradient magnitude, reward, accuracy, stability, or convergence speed responds with evidence-based ranges                               |
| 8. Architecture or system structure      | the automatic analogy remains one simple activity-related action rather than a miniature network                                                           | a separate architecture module lets the learner click stages, switch variants, step through propagation, or reconnect a meaningful path   | selected nodes, active path, tensor dimensions, block counts, parameter counts, receptive field, routing, or output update in a fixed detail region |
| 9. Practical mechanisms and robustness   | one safety check, review, stabilization, correction, or preparation action continues the shared activity                                                   | an explicit chip, click, freeze, sample selector, or drag compares the technique on and off or across conditions                          | distributions, feature maps, attention, normalization statistics, calibration, robustness, auxiliary losses, or implementation rules update         |
| 10. Results, trade-offs, and limitations | a finish, evaluation, comparison, or completion scene closes the same everyday journey                                                                     | one button starts a metric-correct comparison; optional chips switch verified metrics or datasets                                         | exact result tables, compact metrics, ablations, efficiency, limitations, and metric direction remain visible after motion ends                     |

Two rules apply to every paper. First, automatic analogy animations must remain simple life actions even when a chapter teaches equations or architecture; place detailed mathematical and structural graphics in active body modules. Second, hover pause alone does not count as an active module; add an explicit learner operation.

### Cross-Domain Adaptation

- **Vision:** link viewpoint, crop, region, patch, scale, or feature hierarchy to actively selected image evidence.
- **Language:** link reading, writing, revising, highlighting, or arranging phrases to tokens, attention, embeddings, context, decoding, or evaluation.
- **Generative models:** link drawing, sculpting, cleaning, filling, or route refinement to noise, latent state, score, guidance, sampling steps, or quality.
- **Reinforcement learning:** link navigation, practice, choice, balance, or pacing to state, action, reward, policy, value, exploration, or trajectory.
- **Graphs and 3D:** link grouping, connecting, viewing, assembling, or measuring to nodes, edges, neighborhoods, points, poses, or geometry.
- **Audio:** link listening, tuning, filtering, rhythm, or volume to waveform, spectrum, tokens, features, alignment, or synthesis.
- **Optimization and theory:** link distance, slope, tension, balance, filling, or correction to objective geometry, gradients, constraints, bounds, and convergence.

## 6. Hybrid Life and Technical Views

Use a hybrid view when the metaphor explains the intuition and a technical inset proves the mechanism. The two views must share one state variable and update together.

Good pairings include:

- controllable task difficulty plus an error or quality curve;
- selected viewpoint, phrase, sound, object region, or stage plus a representation inset;
- pressure, tension, distance, width, fill level, or balance plus a mathematical magnitude;
- selected tool, route, condition, or method plus dimensions and trade-off bars;
- pace, correction size, repetition, or temperature plus a training or inference curve;
- selected activity stage plus architecture dimensions and an active path;
- a stability or safety cue plus aligned distributions or robustness evidence;
- progress toward completion plus verified benchmark values.

Do not place an unrelated chart beside an animation merely to satisfy a technical-graphics quota. The learner must be able to state the correspondence between the two views in one sentence.

## 7. Canvas Drawing Hierarchy

Draw in this back-to-front order unless the scene requires another explicit order:

1. quiet background;
2. environment or axes;
3. inactive route, nodes, or comparison baselines;
4. active route or selected technical marks;
5. recurring protagonist or manipulated object;
6. target and current value;
7. at most two short in-Canvas labels and one compact legend.

**In-Canvas text limits (per `contract.md` §3):** a module Canvas carries at most
`canvasLabelMaxCount` (2) short labels of at most `canvasLabelMaxChars` (8) chars each, plus at
most one legend of `canvasLegendMaxItems` (3) entries. Show the result value as a bare number
(`0.87`), never with a prefix (`value = 0.87`). Explanatory prose NEVER lives inside the Canvas:
it belongs in the DOM (`.module-desc` before the Canvas, `.feedback` below the controls). If a
fact cannot be shown by color, shape, size, position, or one number, state it in the feedback
line instead of drawing it.

Keep labels away from moving objects and dense curves. Use a stable white inset with a `#d7deea` border when detailed technical marks need their own area. Preserve margins around the drawing. The active state should be visible through at least two cues, such as color plus stroke width, fill plus outline, or position plus label.

Primary actors should be drawn with simple Canvas primitives so they match across platforms. Emoji may appear as a small target or outcome cue, but should not carry the whole explanation.

## 8. Motion and Timing

- Use gentle loop durations around 2.4-3.6 seconds for analogy cards.
- Use 1.2-3 seconds for a learner-triggered comparison, then hold the final state long enough to inspect it.
- Avoid constant camera motion, shaking, particle decoration, and several independent loops.
- Use easing for starts and stops; keep physical motion legible.
- Pause off-screen loops with `IntersectionObserver` and respect reduced motion when practical.
- Do not reset a learner-selected state merely because an ambient loop repeats.

## 9. Interaction Implementation Details

The intermediate paperSkill must specify, not leave Phase 2 to invent:

- state variable names and allowed values;
- control IDs, final Simplified Chinese labels, defaults, and disabled states;
- Canvas intrinsic dimensions and named visual regions;
- the back-to-front draw list and reusable drawing helpers;
- pointer hit regions and CSS-to-intrinsic coordinate conversion for Canvas clicks or drags;
- keyboard-equivalent controls for Canvas hotspots when feasible;
- exact initial, intermediate, failure, success, and completion feedback;
- which paper equation, architecture fact, ablation, or result constrains every displayed value;
- mobile behavior for split comparisons, controls, labels, and tables.

For clickable architecture Canvas regions, pair the Canvas with DOM chips or buttons when keyboard access would otherwise be weak. For sliders, listen to `input`. For drags, use pointer events and clamp the state to the valid domain.

## 10. Clarity Gate

Reject or redesign a module when any answer is no:

1. Can the learner identify the one dominant operation in two seconds?
2. Does that operation visibly change the mechanism rather than decorative motion?
3. Do the main scene and technical evidence use the same state?
4. Is the active or selected state unmistakable without reading a paragraph?
5. Does the feedback explain why the state matters?
6. Are all values constrained by the paper rather than invented for spectacle?
7. Does the module still make sense with the analogy text hidden?
8. Does the module remain readable at desktop and narrow mobile widths?
9. Does the chapter still feel part of the tutorial-wide activity and palette?
10. Is the result simpler than a general-purpose dashboard?
