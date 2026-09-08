# Instructional Design Philosophy

Apply all four principles to the chapter plan and final tutorial project. These are structural requirements, not decoration.

## 1. Unconscious Design

Make the learner's physical operation embody the concept. The interaction should be understandable from the scene and control itself, with little or no instructional copy.

| Concept | Preferred operation |
| --- | --- |
| Distance or similarity | Drag one object toward or away from another |
| Classification boundary | Draw or drag a divider between visible classes |
| Gradient descent | Move one marker or ball along a visible objective surface |
| Denoising | Brush, wipe, or clean a visibly corrupted object |
| Attention | Aim a spotlight or click the person or token being attended to |
| Flow or ODE | Let a leaf or boat follow visible water toward a destination |
| Temperature or randomness | Adjust visible shaking, improvisation, or wandering |
| Guidance strength | Tighten a tow line, follow a recipe, or strengthen navigation |
| Reversibility | Travel a route forward and then retrace it to the origin |
| Self-conditioning | Make an eye inspect the previous result before the next action |

Reject controls that are detached from the concept. For example, do not use a generic slider to teach a classification boundary when the learner can manipulate the boundary directly.

Keep every everyday analogy to one physical verb. Select the anchor activity through the scored, paper-specific process in `metaphor-library.md`, then vary preparation, execution, adjustment, inspection, correction, comparison, and completion actions inside it. No activity mentioned in these references is a default. The paper explanation may be complex; each life animation must remain simple.

## 2. Progressive Concept Disclosure

Use this order unless the paper genuinely requires a small variation:

```text
real-world analogy
  -> learner operates an incomplete or old method
  -> visible limitation
  -> one-sentence insight
  -> paper method demonstration
  -> formal term
  -> interactive equation
  -> optional implementation detail
```

Rules:

1. Never lead with an equation.
2. Introduce one major new concept per chapter.
3. Name a term only after the learner has seen the problem it solves.
4. Keep the full architecture out of Chapter 1. Introduce the paper's key structure in Chapter 8 (or its flexible equivalent per `contract.md` §2.2) — for papers with no nontrivial network, Chapter 8 becomes another active technical module instead.
5. Make each chapter answer a question left by the previous chapter.

## 3. Intuitive Learning

Prioritize information in this order:

1. What problem does the method solve?
2. When should or should not it be used?
3. What is the core intuition in one sentence?
4. What trade-off does it make against related methods?
5. How is it implemented?

By the end of each chapter, the learner should be able to answer:

- What problem did this idea address?
- In what situation would I use it?
- What is its one-sentence core idea?

Include limitations and failure cases. Do not spend most of a chapter walking through pseudocode while leaving the motivation unclear.

## 4. Lightweight Personalization

The standalone HTML cannot maintain a full learner model, so personalize through presentation and pacing:

- Use `.inf` for inference or foundation chapters that everyone should read.
- Use `.trn` for training details that beginners may defer.
- Use `.both` when both audiences benefit.
- Reveal one chapter per screen via the slide layout; the learner continues with the bottom nav bar or the sidebar TOC.
- Update feedback immediately when the learner manipulates a control.
- Change feedback color and wording according to the current state.
- Let learners repeat interactions without an exam or account system.

Do not add login, cloud storage, learning-style stereotypes, or test-like progression. Personalization exists to improve understanding, not to collect data.
