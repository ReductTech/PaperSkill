# Universal Paper Tutorial Visual Interaction Standard

This standard applies to every paper handled by `paper-skill`. It defines a reusable way to turn difficult ideas into coherent life-based animations, active technical graphics, and evidence-backed interactive modules. Apply the principles to the current paper's problem, domain, architecture, equations, experiments, and chosen everyday theme.

The target is a page that feels like one coherent interactive lesson: calm colors, a recurring everyday world when useful, one dominant operation per module, substantial readable technical graphics, and immediate evidence-backed feedback. Theme examples are illustrative only; theme selection must come from the current paper through `metaphor-library.md` and must not copy the nearest example.

Named activities, subjects, props, verbs, and concept mappings in this file are examples, not templates or defaults. Every concrete life scene is replaceable. Determine the actual activity and scenes from the current paper after candidate comparison. Preserve only the interaction relationships, such as one control driving a life view and technical evidence together.

## Contents

1. Tutorial-wide visual world
2. Restrained color grammar
3. Module anatomy
4. State-to-graphic contract
5. Interaction composition decisions
6. Hybrid life and technical views
7. Canvas drawing hierarchy
8. Motion and timing
9. Interaction implementation details
10. Clarity gate

## 1. Tutorial-Wide Visual World

Choose one anchor activity and build a reusable drawing kit before planning chapters. Reuse its visual cues throughout the deck. Static and paper-native pages include a small, clearly legible theme illustration or object linked to their scientific content per contract.md §3.

The kit must define:

- recognizable settings and objects from the chosen activity;
- recurring drawing treatments for people, tools, surroundings and outcomes as needed;
- helper functions for repeated visual elements rather than generic path and target markers;
- one semantic color map shared by the whole page.

The visual continuity should be obvious without making every chapter repeat the same literal object. Derive varied actions where the life activity helps, and choose direct technical manipulation where the analogy would obscure the paper. Do not let an activity mentioned in documentation become the theme unless it is the best fit for the paper after comparing alternatives.

Do not introduce a new decorative world for each chapter. Mathematical or technical graphics may vary, but their line weights, labels, borders, and semantic colors must still match the shared kit.

## 2. Restrained Color Grammar

Use the semantic color roles and their state colors from `contract.md` §5; its environment colors are replaceable theme examples. Phase 1 copies those values into the temporary skill; this reference does not maintain a second color table. Use neutrals for most pixels, reserve red for failure, green for success, blue for guidance/current state, orange for a controlled emphasis and purple for an auxiliary mechanism. Do not recolor a state with the opposite meaning between chapters.
## 3. Module Anatomy

Each primary module should have a clear focal event and one dominant learner operation. A
large physical scene may fill the body; a few linked controls can surround one experiment;
a method or result visual can dominate when the paper content warrants it. Use the shared
page heading and avoid another generic framed header. Place formal material where it helps
the current question, without a permanent evidence column.

Size Canvas, SVG or DOM artwork to the available scene body (1472 × 622 design pixels).
Choose the aspect ratio to make the action large and readable. A comparison can use two
aligned scenes when needed; the analogy may itself be a full-page scene.

Do not turn a module into a dashboard. Avoid several unrelated charts, nested cards, floating annotations, or multiple control clusters. One operation may update several linked views, but the learner should still be able to name that operation with one verb: adjust, choose, click, step, drag, compare, or start.

## 4. State-to-Graphic Contract

Every active module must define one state model that drives all visible outputs. A control must never change only a label or only a decorative animation. It must change a paper-relevant variable, component, constraint or measured comparison. A slider that merely fades or sharpens a recurring photo is decorative unless a corresponding scientific representation changes in a source-grounded way.

For every meaningful operation, update at least:

1. the paper-relevant main graphic, active path, selected component, calculation or result; and
2. the feedback sentence.

Also update a value label, dimension, output, metric, or comparison bar whenever the concept has a meaningful quantity.

Specify these states in the intermediate paperSkill:

- **Initial:** the old method, neutral baseline, first step, or unselected architecture state visible before input.
- **Exploration:** one or more intermediate settings that visibly change geometry, motion, path, distribution, curve, or values.
- **Failure or trade-off:** a red or orange state with a precise reason, when supported by the paper.
- **Success or paper method:** a green state with the mechanism and result made visible.
- **Completion:** disabled, selected, or final state for step-through and race interactions.

Ambient `requestAnimationFrame` motion may make the scene feel alive, but the conceptual state comes from learner input. Use a pure or nearly pure `render(state, time)` function so Canvas, value labels, and feedback cannot drift out of sync.

## 5. Living-scene interaction compositions

Use a recognizable everyday event as the main visual when a slide teaches through analogy. The scene can
contain several connected effects, but it should read as one physical situation. The user
acts on an object in that scene: turns a knob, moves a tool, places an item, traces a path,
changes pace, or chooses where to act. Avoid separate transport buttons, step/reset bars,
dense tag switching, small charts or abstract node-and-flow explanations.

| Learning purpose | Direct scene operation | Main visible consequence | Paper principle or evidence after the introduction |
| --- | --- | --- | --- |
| Expose a limit | manipulate the familiar tool under the old condition | the same subject visibly misses its goal | one verified quantity or short note |
| Show an improvement | repeat the same action with the paper method | motion reaches the goal or changes in an evidence-backed way | compact result near the scene |
| Explore a magnitude | turn, drag or move the physical control | distance, fill, speed, stability or quality changes continuously | one linked value or curve |
| Compare conditions | change an object or condition in place | the same setting visibly changes without a new dashboard | brief paired evidence |
| Explain a mechanism | operate the scene and watch one cause propagate physically | the goal, subject and environment remain recognizable | a legible source-backed formula or rule with symbols mapped to the scene |
| Inspect a boundary | push the operation to a valid extreme | the scene makes failure or trade-off visible | precise boundary wording |
| Review a result | perform the final everyday action | the narrative reaches a meaningful outcome | verified metric or result table where needed |

Across the chosen chapter and slide count, vary actions and learning questions within one
continuous story: limitation, input, insight, magnitude, choice, execution, optimization,
structure, robustness and result are possible roles, not a mandatory repeated template.
On life/hybrid pages, technical evidence stays legible and causally connected to the
physical action. Paper-native pages may directly animate or manipulate the scientific
representation without a life prop. Count an active body module when the learner's action
changes the main visual and immediate feedback; update any linked formal representation
when that page includes one. Hover pause and autoplay alone do not count. Explicitly mark
where a physical analogy stops explaining the paper.

### Cross-Domain Adaptation

- **Vision:** link viewpoint, crop, region, patch, scale, or feature hierarchy to actively selected image evidence.
- **Language:** link reading, writing, revising, highlighting, or arranging phrases to tokens, attention, embeddings, context, decoding, or evaluation.
- **Generative models:** link drawing, sculpting, cleaning, filling, or route refinement to noise, latent state, score, guidance, sampling steps, or quality.
- **Reinforcement learning:** link navigation, practice, choice, balance, or pacing to state, action, reward, policy, value, exploration, or trajectory.
- **Graphs and 3D:** link grouping, connecting, viewing, assembling, or measuring to nodes, edges, neighborhoods, points, poses, or geometry.
- **Audio:** link listening, tuning, filtering, rhythm, or volume to waveform, spectrum, tokens, features, alignment, or synthesis.
- **Optimization and theory:** link distance, slope, tension, balance, filling, or correction to objective geometry, gradients, constraints, bounds, and convergence.

## 6. Hybrid Life and Technical Views

Use a hybrid view when the metaphor explains the intuition and a source-backed formal view
teaches the mechanism. Neither the analogy nor a diagram alone proves the paper's result.
The views share one state model (which may contain several linked variables) and update together; the formal view must be readable at
presentation scale.

Good pairings include:

- controllable task difficulty plus an error or quality curve;
- selected viewpoint, phrase, sound, object region, or stage plus a representation inset;
- pressure, tension, distance, width, fill level, or balance plus a mathematical magnitude;
- selected tool, route, condition, or method plus dimensions and trade-off bars;
- pace, correction size, repetition, or temperature plus a training or inference curve;
- selected activity stage plus architecture dimensions and an active path;
- a stability or safety cue plus aligned distributions or robustness evidence;
- progress toward completion plus verified benchmark values.

Do not place an unrelated chart beside an animation merely to satisfy a technical-graphics quota. The learner must be able to state the correspondence between the two views in one sentence. If the analogy requires more explanation than the paper mechanism, remove it from that page and let the paper-native view lead.

## 7. Canvas Drawing Hierarchy

Draw in this back-to-front order unless the scene requires another explicit order:

1. quiet background;
2. environment or axes;
3. inactive objects or comparison baselines;
4. selected objects or technical marks;
5. recurring protagonist or manipulated object;
6. outcome and current value;
7. only the labels and legends needed to interpret the scene at fitted size.

Keep Canvas text sparse and large enough to read after slide fitting. Put paragraphs in DOM
text outside the drawing; use labels only for objects, values or symbols that must be located
inside the scene. Choose the number of labels and legend entries by clarity, not a quota.

Keep labels away from moving objects and dense curves. Use a stable white inset with a `#d7deea` border when detailed technical marks need their own area. Preserve margins around the drawing. The active state should be visible through at least two cues, such as color plus stroke width, fill plus outline, or position plus label.

Draw primary actors with reusable Canvas primitives, SVG components or DOM elements as appropriate. Emoji may appear as a small target or outcome cue, but should not carry the whole explanation.

## 8. Motion and Timing

- Choose timing for the scene and allow enough time to inspect important transitions. Keep linked comparisons on one clock; hold learner-triggered outcomes long enough to read.
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
- exact mapping from manipulated object to paper variable/component and from state to formal
  prediction or verified result, with source locator, units, valid conditions, and analogy limit;
- fixed-slide fit, pinch/pan behavior, and pointer hit mapping for comparisons, controls,
  labels, and tables; do not stack or reflow slide contents at mobile widths.

For clickable architecture Canvas regions, pair the Canvas with DOM chips or buttons when keyboard access would otherwise be weak. For sliders, listen to `input`. For drags, use pointer events and clamp the state to the valid domain.

## 10. Clarity Gate

Reject or redesign a module when any answer is no:

1. Can the learner identify the one dominant operation in two seconds?
2. Does that operation visibly change the mechanism rather than decorative motion?
3. If technical evidence is shown on this page, does it use the same state as the main scene?
4. Is the active or selected state unmistakable without reading a paragraph?
5. Does the feedback explain why the state matters?
6. Are all values constrained by the paper rather than invented for spectacle?
7. Does the module still make sense with the analogy text hidden, and would the interaction still teach a paper principle if the life artwork were removed?
8. Does the fitted slide remain usable on desktop and mobile, with pinch zoom for detail?
9. Does the chapter still feel part of the tutorial-wide activity and palette?
10. Is the result simpler than a general-purpose dashboard?
