# Chapter Narrative Template

Plan and implement `chapterCount` chapters (default 10; range 6–10 per `contract.md` §2)
with the same internal order. Write all visible chapter copy in natural Simplified Chinese.

## Required Element Order

In the React model, each chapter is one `ChapterDef` entry in `src/data/tutorial.ts`. Each
chapter renders as one slide (one chapter per screen, ordered by `App.tsx`); the same
internal order applies to every chapter:

```text
ChapterDef (kind: "chapter")
- id, title (Simplified Chinese), badge (inf | trn | both), badgeLabel
- bridge       -> rendered as .chap-bridge ("本节作用")
- analogy      -> AnalogyCard (560x140 canvas animation OR an optional figure)
- modules[]    -> one or two ModuleDef (kind: "module"); each has title, desc, componentId
- insight?     -> InsightBar (optional, shown after the learner experiences the limit)
- formula?     -> Formula (Unicode, clickable symbols)
- takeaways[]  -> exactly three items (icon + title + desc)
```

These elements are grouped into **at most 3 sections** per chapter (引入 / 讲解 / 总结),
per `contract.md` §2.3: `bridge`+`analogy`(+`insight`) form the intro section, `modules[]`
(+`formula`) form the body section, and `takeaways` form the recap section. Never present a
fourth standalone section; fold extra material into one of the three.

The Hero is the cover slide (slide 0 in `App.tsx`); the optional Bilibili strip
(`.dl-related-section`) is the last slide. The app must contain exactly `chapterCount` (6–10)
chapters — entries with `kind: "chapter"` in `src/data/tutorial.ts`. `validate-output.js`
counts them.

## Element Contracts

### Chapter Bridge

- State where the learner is and why this chapter is needed.
- Connect to the unresolved question from the previous chapter.
- Use one or two Simplified Chinese sentences, never more than three.

### Analogy Card

- Fix Canvas dimensions at `560x140`.
- Animate one recognizable everyday action selected specifically for this chapter.
- Use one primary subject, one action verb, one visible goal, and at most two static supporting props.
- Keep only one independently moving subject.
- Loop automatically and pause off-screen.
- Prefer a simple action that belongs to the selected paper-specific theme, such as a brush writing, hand watering, musician tuning, spoon stirring, runner pacing, cup filling, car turning, flashlight scanning, clay being shaped, or ball rolling. This list is illustrative, not ranked.
- Reject packages through workstations, conveyors, assembly lines, handoffs, and multi-stage processes.
- Use one or two Simplified Chinese sentences and no more than two bold terms.
- Keep every scene inside the tutorial's one anchor everyday theme. Vary related actions and recurring objects rather than switching to an unrelated activity.
- Draw with the tutorial-wide helper kit, recurring protagonist or object, target motif, line weights, label style, and scene palette defined in the temporary paperSkill.
- Keep the Canvas mostly neutral. Use red, blue, green, orange, and purple only for their fixed semantic roles.

### Module N.1: Expose the Problem

- Choose `life metaphor`, `mathematical/technical`, or `hybrid linked views` as the presentation mode.
- Let the learner actively attempt the task without the paper's contribution.
- Make the limitation visible through the result, motion, or feedback.
- Update feedback in real time: red for failure, blue for an intermediate state, green for success.
- Avoid explaining the answer before the learner experiences the problem.
- Specify the exact initial state, control labels and ranges, Canvas composition, state transitions, and final Simplified Chinese feedback strings in the temporary paperSkill.
- Give the module one dominant operation and one shared state model. The operation must update the main graphic plus feedback, and a meaningful value or technical view when one exists.
- Keep the small-font explanatory text to exactly two places: the module description before the Canvas and the feedback line below the controls. Do not add hint rows, hint bars, or extra annotations anywhere else in the module. Prefer state color over additional words.
- Name the Canvas regions, back-to-front draw list, reusable primitives, and visual mapping from state to geometry, path, curve, distribution, values, or output.

### Insight Bar

- Use one plain Simplified Chinese sentence.
- Name the need revealed by Module N.1.
- Introduce the paper's contribution naturally, without a formula.

### Module N.2: Demonstrate the Solution

- Choose the clearest presentation mode independently from Module N.1. Coordinate grids, feature maps, mathematical plots, architecture graphs, and hybrid linked views are allowed here.
- Present the same or directly comparable task using the paper's method.
- Make the improvement easy to perceive.
- End in a green success state when appropriate.
- Specify the exact operation and every meaningful visible state change; "make it interactive" is not an implementation plan.
- When using a hybrid view, drive both the life scene and technical evidence from the same state variable. Do not place an unrelated chart beside the metaphor.

### Interactive Module Density

- Give every chapter at least one primary active module.
- Meet the density floor in `contract.md` §3: at least `activeModulesMin` active modules across the `chapterCount` chapters, and at least `dualModuleChaptersMin` chapters with a second active module.
- Use at least `mathOrHybridModulesMin` (4) mathematical/technical or hybrid modules and at least `lifeOrHybridModulesMin` (4) life-metaphor or hybrid modules.
- Do not count autoplay animations, hover-only explanations, tooltip-only clicks, formula symbol definitions, or chapter-loader buttons.
- The one-moving-subject restriction applies to automatic analogy animations, not to active body modules.
- Keep each module to one dominant Canvas or true synchronized comparison, one compact control row or direct-manipulation target, one stable detail region when needed, and one feedback bar.
- Prefer restrained graphics and a few strong marks over dense dashboards, nested cards, or many unrelated mini charts.

### Interactive Formula

- Add one plain-language Simplified Chinese sentence before the equation.
- Use Unicode plus HTML only.
- Give each symbol a `.sym` element and matching `.sym-desc`.
- Include no more than one or two core equations in a chapter.

### Takeaway

- Use exactly three concise items.
- Use `.embed-takeaway` for constructive progression.
- Use `.reversibility-takeaway` for a trade-off or spectrum.
- Give each item an icon, short title, and one Simplified Chinese sentence.

## Narrative Variants

### Problem to Solution

Best for Chapters 1, 3, and 5:

`analogy -> failed attempt -> insight -> paper method -> equation -> takeaways`

### Process or Sequence

Best for Chapters 2, 6, and 7:

`analogy -> step-through interaction -> per-step feedback -> process insight -> equation -> takeaways`

### Architecture

Best for Chapter 8 when the paper has a nontrivial network (default arc). For papers with
no such network (e.g. `paperType: theoretical`, per `contract.md` §2.2), replace this with
another active technical module (interactive proof, trade-off, or ablation):

`single-action analogy inside the selected anchor theme, such as arranging one familiar tool used by that activity -> separate simplified interactive architecture module -> learner clicks, switches, steps, or drags -> active components and paths update -> output and feedback update -> design rationale -> key computation -> takeaways`

### Results

Best for Chapter 10:

`competition analogy -> user-started result race -> verified table -> key metrics -> strengths and limitations`

## Planning Record for Each Chapter

Fill every field before filling `src/data/tutorial.ts` (and any paper-specific widget in `src/modules/*`):

```text
Chapter N
- Simplified Chinese title:
- badge: inf | trn | both
- one core concept:
- bridge from previous chapter:
- analogy subject, one action verb, one goal, and at most two static props:
- anchor-theme connection and recurring objects:
- analogy title and copy:
- Module N.1 title and purpose:
- Module N.1 presentation mode:
- Module N.1 exact operation and initial state:
- Module N.1 controls, defaults, and state space:
- Module N.1 state variables and valid values:
- Module N.1 Canvas dimensions, named regions, back-to-front draw list, and reusable primitives:
- Module N.1 visual encoding and synchronized state transitions:
- Module N.1 exact feedback copy and semantic colors:
- Module N.1 paper evidence and learner judgment:
- Module N.1 responsive, pointer, and keyboard behavior:
- one-sentence insight:
- Module N.2 title and purpose, or evidence-backed omission reason:
- Module N.2 presentation mode:
- Module N.2 exact operation and initial state:
- Module N.2 controls, defaults, and state space:
- Module N.2 state variables and valid values:
- Module N.2 Canvas dimensions, named regions, back-to-front draw list, and reusable primitives:
- Module N.2 visual encoding and synchronized state transitions:
- Module N.2 exact feedback copy and comparison:
- Module N.2 paper evidence and learner judgment:
- Module N.2 responsive, pointer, and keyboard behavior:
- interaction pattern P1-P8:
- optional equation, plain-language lead-in, and symbol meanings:
- three takeaway items:
- failure case or applicability judgment:
```
