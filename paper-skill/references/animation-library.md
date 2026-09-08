# Simple Everyday Canvas Scene Library

Every chapter analogy must communicate one paper concept through one familiar everyday action. The reader should recognize the subject, action, and outcome within about two seconds.

Do not design a miniature world, workplace, logistics system, or complete process. The animation is a visual verb, not an animated architecture diagram.

All 10 analogies must still belong to the paper-specific anchor theme selected through `metaphor-library.md`. Vary the action, not the world. The scene examples below are atomic motion patterns, not preferred tutorial themes; their order conveys no priority.

This life-scene contract applies to automatic analogy animations and the Hero comparison. It does not prohibit coordinate grids, feature maps, vectors, charts, equations, architecture graphs, or mathematical plots inside active body modules. Those modules may be technical or linked to the life metaphor, but they must respond to user input.

Before drawing any chapter, read `visual-interaction-standard.md` and define one shared Canvas drawing kit. Reuse the same protagonist or manipulated object, setting primitives, target marker, label style, semantic colors, and line weights throughout the tutorial. Do not solve visual continuity by merely recoloring ten unrelated scenes.

The successful reference pattern is a small visual vocabulary used many ways: one setting, a few recognizable props, a recurring subject, and compact technical evidence. Each chapter changes the physical verb or decision while retaining that vocabulary.

## Single-Action Contract

Every analogy Canvas must satisfy all of these rules:

1. Use one primary subject: one brush, plant, instrument part, utensil, runner, car, ball, cup, hand, flashlight, or similarly familiar object from the selected theme.
2. Show one action verb: write, water, tune, stir, run, wipe, pour, drive, roll, stack, shine, or shape.
3. Show one visible goal: complete one mark, stabilize one note, prepare one dish, grow one plant, cross one line, fill one cup, reach one destination, or reveal one target.
4. Use no more than two static supporting props. A road and finish flag are acceptable; five stations and several machines are not.
5. Keep only one independently moving subject. A before-versus-after comparison may use one subject per panel, synchronized on the same time basis.
6. Use one continuous motion or one short repeated gesture. Do not chain several actions with "then", "next", or "at each station".
7. Keep labels outside the drawing. Prefer ZERO in-Canvas labels — the action itself speaks; allow at most one label of no more than 6 Simplified Chinese characters when it is truly indispensable.
8. Make the action readable at `560x140`; avoid tiny people, dense annotations, or miniature machinery.

Apply this sentence test before accepting a scene:

```text
one subject + one verb + one goal
```

Good: `one brush writes one character`.

Good: `one hand waters one plant to the marked level`.

Reject: `a package passes through several workstations and changes at every station`.

If the scene cannot be described without "and then", split it or choose a simpler action.

## Prohibited Scene Patterns

Never use these as chapter analogy animations:

- packages, parcels, or data items traveling through workstations;
- conveyor belts, factory assembly lines, kitchen production lines, or multi-stage logistics;
- multiple workers, couriers, machines, or agents handing objects to one another;
- an object entering a sequence of labeled boxes or rooms;
- a full network architecture animated as many processing stations;
- several unrelated objects moving on independent loops;
- abstract particle clouds, arrow grids, heat maps, vector fields, or mathematical waves;
- a static chart presented as if it were a life analogy.

A formal architecture diagram must appear later inside an interactive module when the paper has a nontrivial network structure. It must be visually separate from the chapter's simple everyday analogy and must respond to user input; a static diagram is not sufficient.

## Shared Animation Contract

For every Canvas:

1. Draw at the Canvas's intrinsic coordinate size and use `setupCanvas` for device-pixel ratio handling.
2. Give the Canvas its own state, animation function, and animation ID.
3. Use `observeCanvas` or an equivalent `IntersectionObserver` to pause work off-screen.
4. Add `is-ready` after the first successful frame.
5. Keep motion continuous and physically legible.
6. Respect `prefers-reduced-motion` when practical.
7. Do not add replay instructions or a shared global render loop.
8. Keep the environment mostly neutral and reserve semantic colors for state (exact hex in `contract.md` §5): red failure, blue guidance or current state, green repair or success, orange controlled emphasis, and purple auxiliary mechanisms.
9. Use a stable back-to-front draw order: background, environment, inactive path, active path, subject, target, then no more than two short labels and one compact legend.
10. Use gentle 2.4-3.6 second loops. Ambient looping must never reset learner-controlled module state.

## Shared Primitive Kit

The intermediate paperSkill must name the reusable drawing helpers for its selected theme. At minimum define paper-specific equivalents of:

- `clearScene(ctx, w, h)` for the quiet field and shared ground;
- `drawSubject(ctx, x, y, time, stateColor)` for the recurring actor or object;
- `drawSetting(...)` for the road, page, track, desk, garden, slope, or other shared environment;
- `drawPathOrSupport(...)` for the route, guide, bridge, trace, rope, or support;
- `drawTarget(...)` for the visible goal;
- `drawSceneLabel(...)` and `drawLegend(...)` for consistent typography.

Use simple Canvas primitives for the main subject so it remains consistent across platforms. Emoji may be a small target or outcome cue, not the only graphical explanation.

## S1: Moving Along One Incline

Use for optimization, difficulty, progress, local minima, or controlled step size when this action belongs to the selected theme.

- Draw one walker or ball, one incline, and one goal marker. Choose ascending, descending, or settling for the scene, not several motions.
- Move only the primary subject.
- Map step length to update size, slope to difficulty, and the marker to the objective.
- For a direct support or alternate path, keep the same subject and one visible detour. Do not add checkpoints or stations.

## S2: Running

Use for inference speed, iteration count, convergence, throughput, or method comparison.

- Draw one runner moving toward one finish line.
- Tie speed or distance directly to the paper concept.
- For old-versus-new comparison, use one runner per panel or at most two runners on one track.
- Do not add teams, relay handoffs, crowds, or multiple obstacles.

## S3: Calligraphy

Use for generation, denoising, sequence construction, prediction, or repeated practice.

- Draw one brush and choose exactly one action for the scene: writing, tracing, or wiping one character.
- Reveal or remove one stroke at a time as one continuous gesture.
- Use one copybook outline as the optional guide.
- Do not animate several writers, pages, ink stations, or tool handoffs.

## S4: Pouring Water

Use for confidence, probability, loss, capacity, accumulation, or thresholds.

- Draw one hand or jug and choose filling or draining for the scene, not both.
- Move the water stream and waterline; keep the cup stationary.
- Tie fill level directly to the controlled quantity.
- Use two cups only for a direct before-versus-after comparison.

## S5: Driving One Route

Use for guidance, routing, sampling paths, policy choice, or shortcuts.

- Draw one car, one road, and one destination.
- Move only the car.
- Show a weak route as a bend or detour and a strong route as a clearer path.
- Do not build a city, delivery network, traffic simulation, or checkpoint sequence.

## S6: Flashlight on a Page

Use for attention, feature selection, saliency, masking, or review.

- Move one flashlight beam across one fixed page or object.
- Reveal one target detail inside the light.
- Keep the unattended context dim but visible.
- Do not use multiple lights unless the chapter explicitly compares two attention heads; even then, keep the rest static.

## S7: Shaping Clay

Use for representation change, feature transformation, embeddings, or reconstruction.

- Draw one hand shaping one lump of clay into one recognizable form.
- Morph only the clay outline; keep tools and table static.
- Use one start shape and one target shape.
- Do not show a pottery production sequence or several intermediate machines.

## S8: Rolling or Bouncing a Ball

Use for momentum, stability, gradients, energy, recurrence, or error propagation.

- Draw one ball moving on one slope, track, or short stair.
- Choose one motion type for the scene: rolling, bouncing, or settling.
- Mark one resting target.
- Do not add many balls unless a direct two-method comparison requires exactly two.

## S9: Stacking Books or Blocks

Use for depth, layers, capacity, or architecture size.

- Draw one hand adding one book or block to one stack.
- Animate only the currently added item; existing items stay still.
- Keep the stack to a few large readable pieces.
- Use a separate simplified interactive module for detailed architecture. Let the learner click components, switch routes, or drag a connection and immediately update highlighting, the active path, output, and feedback. Do not turn the stack into processing stations.

## S10: Simple Result Race

Use only for Chapter 10 verified benchmark comparisons.

- Start two to four runners or progress bars from the same baseline after one user action.
- Derive progress from verified metrics without falsifying scale.
- Keep all competitors on one shared axis and avoid decorative crowds or ceremonies.
- Add a trophy only when the verified metric supports the win.

## Scene Selection Guide

| Chapter concept | Prefer |
| --- | --- |
| corruption or denoising | one brush wipes one mark |
| representation change | one hand shapes one clay object |
| optimization or training | one subject adjusts pace, pressure, correction size, or movement on one incline |
| depth or direct connection | one subject uses one visible support, or one hand adds one block |
| guidance or sampling | one car follows one route |
| generation | one brush writes one character |
| attention or review | one flashlight reveals one target |
| confidence, loss, or capacity | one cup fills or drains |
| stability or momentum | one ball rolls or bounces |
| speed or convergence | one runner reaches one finish line |
| results | one simple race with verified values |

Choose the action that makes the chapter's concept easiest to understand while remaining inside the tutorial's anchor everyday theme. Reuse recurring objects and scenery, but vary the chapter action. Consistency comes from both the shared life theme and the shared drawing style; simplicity comes from showing only one action at a time.
