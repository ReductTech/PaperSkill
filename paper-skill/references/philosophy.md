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

Select the anchor activity through the paper-specific comparison in `metaphor-library.md`, then vary useful episodes inside it as concepts warrant. Let other pages manipulate the paper mechanism directly. No activity mentioned in these references is a default. Keep each life scene visually legible without reducing the whole tutorial to one abstract gesture or repeating a single prop.

## 2. Progressive Concept Disclosure

Use this progression for the opening when it helps. Later pages follow their teaching question; do not repeat this sequence in every chapter:

```text
real-world analogy
  -> learner operates an incomplete or old method
  -> visible limitation
  -> one-sentence insight
  -> name the paper's core method and formal term
  -> paper method demonstration with its formula/rule updating from the same action
  -> optional implementation detail
```

Rules:

1. Establish motivation in the opening. A later derivation or mechanism page may lead with its equation when the terms are already introduced.
2. Introduce one major new concept per chapter.
3. Use paper-grounded method or concept terms in headings. Reveal their meaning after the
   learner sees the problem they solve; do not use colloquial titles in place of terminology.
4. Introduce architecture or a technical structure only after the learner has the concepts
   needed to understand its role. If the paper has no nontrivial network, teach its actual
   proof, objective or system decision instead.
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

The standalone React tutorial does not need a learner account; personalize through presentation and pacing:

- Put optional training or implementation detail in speaker notes or clearly motivated extra scenes; do not add unsupported audience classes or hidden chapter modes.
- Reveal one scene per screen; chapters group several pages. The learner continues with the top transport controls or slide-preview rail, using the shared scene-based presentation format.
- Update feedback immediately when the learner manipulates a control.
- Change feedback color and wording according to the current state.
- Let learners repeat interactions without an exam or account system.

Do not add login, cloud storage, learning-style stereotypes, or test-like progression. Personalization exists to improve understanding, not to collect data.
