# Simple Everyday Canvas Scene Library

Every chapter analogy must communicate one paper concept through one familiar everyday action. The reader should recognize the subject, action, and outcome within about two seconds.

Do not design a miniature world, workplace, logistics system, or complete process. The animation is a visual verb, not an animated architecture diagram.

All chapter analogies must still belong to the paper-specific anchor theme selected through `metaphor-library.md`. Vary the action, not the world. The scene examples below are atomic motion patterns, not preferred tutorial themes; their order conveys no priority.

This life-scene contract applies to automatic analogy animations and the cover comparison.
Active body modules may add readable coordinate grids, feature maps, equations, architecture
consequences, or paper plots as linked evidence. On a hybrid scene, drive the life motion and
formal view from the same learner-controlled state. A paper-native scene may instead animate
a changing scientific structure or result directly, paired with a compact theme visual per
contract.md §3. An
abstract diagram with decorative motion alone is not a teaching scene.

Before drawing selected life scenes, read `visual-interaction-standard.md` and define one
shared Canvas drawing kit. Reuse setting primitives, label style, semantic colors and line
weights where useful, but vary the focal object and action. Do not solve continuity by
repeating one protagonist or recoloring unrelated scenes.

Plan animated interactions across the deck, not only on the cover. Follow contract.md §3: learner-driven animation is the main body-page form, with distinct
theme episodes recurring in the early, middle and late stages. Vary life episodes and paper-native
motions so each reveals a different causal step. Preserve room for direct technical
interaction, derivation and evidence pages.

Use a shared visual vocabulary on selected life scenes while changing the physical episode, focal object, learner action and framing to suit the paper concept. Paper-native pages keep a compact, concept-relevant theme illustration or object per contract.md §3.

## Everyday-story scene contract

Choose the recurring activity from the current paper. On life scenes, show its real setting and objects clearly enough to identify the activity without reading labels. Vary episode, action, camera framing and interaction across those slides while retaining recognizable visual cues. Do not force an episode onto a page whose main object should be a scientific diagram, formula or result. For a hiking theme, packing a bag, inspecting a map, climbing and viewing a summit are related but materially different scenes; these are illustrations, not a default theme.

People, tools, terrain and several causally related motions are welcome when they make the activity legible. Do not impose a one-person, one-verb, two-prop or single-loop quota. Simplify by visual hierarchy and fitted-slide readability. Let the learner act on objects in the scene when possible; sliders are useful when the paper's mechanism is continuous.

Do not use abstract dots, paths, node graphs, boxes, conveyor systems or data-flow diagrams as a substitute for a life scene. A route line or graph may support a recognizably real activity, but cannot be the whole analogy. No exact example from this library should be copied into every paper.

Scientific content need not appear in a separate card on each slide. The introduction may be pure story; later slides can reveal the paper's variables, equations, architecture or results in the same scene, in a large dedicated region, or on a distinct result page. Source locators and analogy boundaries belong in the evidence matrix and speaker notes; show a discreet attribution on a slide only when the viewer needs it to interpret an exact figure or number.

## Shared Animation Contract

For every animated Canvas, SVG or DOM scene:

1. Draw at stable intrinsic coordinates; Canvas uses `setupCanvas` for device-pixel ratio,
   while SVG uses a fixed `viewBox`.
2. Give the scene its own state, animation function, and animation ID when applicable.
3. Use `observeCanvas` or equivalent visibility handling to pause work off-screen.
4. Draw the initial state promptly; a Canvas is visible by default and needs no readiness class.
5. Keep motion continuous and physically legible.
6. Respect `prefers-reduced-motion` when practical.
7. Do not add replay instructions or a shared global render loop.
8. Keep the environment mostly neutral and reserve semantic colors for state (exact hex in `contract.md` §5): red failure, blue guidance or current state, green repair or success, orange controlled emphasis, and purple auxiliary mechanisms.
9. Use a stable back-to-front draw order appropriate to the actual setting; keep labels outside the main action when possible.
10. Keep ambient motion gentle and never reset learner-controlled module state. Continuous gestures, short episodes and responsive transitions are all valid.

## Shared Primitive Kit

The intermediate paperSkill should name reusable scene primitives for its selected theme.
They may be Canvas helpers, SVG components or DOM elements; choose only those its activity needs:

- `clearScene(ctx, w, h)` for the quiet field and shared ground;
- a recurring actor or manipulated-object helper;
- `drawSetting(...)` for the road, page, track, desk, garden, slope, or other shared environment;
- reusable environment and object helpers chosen for the actual theme;
- text and feedback helpers where the scene actually needs them.

Use simple Canvas primitives for the main subject so it remains consistent across platforms. Emoji may be a small target or outcome cue, not the only graphical explanation.

## Scene Selection Guide

Choose the action **after** selecting the paper-specific anchor theme. For each chapter,
derive an action from that activity which makes its paper concept visible; do not choose a
brush, cup, road or other object merely because an example above maps it to a familiar ML
term. Reuse recurring objects and scenery, but vary the physical verb, composition and
learner decision. A new page cannot reuse the previous page's SVG/Canvas path or gesture
with only colors, labels or formula text changed. Repetition is justified only for a
controlled comparison and must be called out in the scene storyboard.
