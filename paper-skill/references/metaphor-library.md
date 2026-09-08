# Unified Everyday Theme Library

Choose one familiar everyday activity as the anchor theme for the entire tutorial. All `chapterCount` automatic analogy animations (default 10; per `contract.md` §2) must belong to that activity or setting, while each chapter uses a different simple action inside it.

```text
one tutorial = one paper-specific everyday theme
one chapter = one simple action inside that theme
```

## Contents

1. Anti-default rule
2. Theme selection procedure
3. Candidate activity families
4. Mechanism prompts
5. Semantic colors
6. Ten-chapter theme table
7. Cross-chapter consistency

## Anti-Default Rule

No documented theme is the default. The order, length, or detail of examples in this library conveys no preference. Every listed or newly invented activity enters the same paper-specific scoring process.

Select the theme from the current paper's teaching mechanics. A valid justification names paper-specific concepts and explains why the chosen activity expresses them better than the rejected candidates. Generic claims such as "the method makes progress" or "the model learns through practice" are insufficient.

Do not reuse a theme from an example, template, or recent output unless it wins the selection process below. New paper-specific themes are encouraged.

## Theme Selection Procedure

Before planning chapters:

1. Extract three to five dominant teaching mechanics from the paper, such as iterative correction, sequence construction, routing, comparison, accumulation, selection, transformation, stabilization, memory, or exploration.
2. Generate at least three candidate everyday themes from different activity families. At least one candidate should not be copied verbatim from this library.
3. Sketch 10 distinct simple actions for each candidate.
4. Score each candidate from 1 to 5 on every criterion below.
5. Select the highest-scoring candidate. If scores tie, choose the less recently used and less template-associated theme.
6. Record why the winner fits this paper and why the other two candidates were rejected.

| Criterion | Question |
| --- | --- |
| mechanism fit | Do the paper's key operations map naturally to actions in this activity? |
| ten-action coverage | Can all 10 chapter roles use distinct, simple, related actions? |
| visual clarity | Are subject, verb, and goal readable at `560x140`? |
| technical linkability | Can life actions link cleanly to equations, features, curves, architecture, or results? |
| thematic continuity | Can one setting, drawing kit, and prop family persist across the page? |
| originality | Does the choice avoid copying the nearest template or repeatedly used theme? |

A candidate fails if any of mechanism fit, ten-action coverage, or visual clarity scores below 3.

## Candidate Activity Families

These are balanced examples, not a ranked list. Adapt them or invent another familiar activity.

### Calligraphy or Editing Practice

Useful actions: choose one tool, prepare one page, trace one mark, adjust pressure, follow one guide, correct one deviation, repeat one phrase, inspect one detail, compare two versions, and finish one work.

### Gardening One Plant

Useful actions: choose one seed, prepare one pot, plant, water, adjust light, add one support, prune one branch, inspect one leaf, compare growth, and observe one bloom.

### Music Practice

Useful actions: choose one instrument setting, tune one note, follow one beat, adjust volume, repeat one phrase, correct timing, listen to one layer, compare two performances, stabilize tempo, and finish one passage.

### Cooking One Meal

Useful actions: choose one ingredient, wash it, cut once, measure one amount, stir one pan, adjust heat, taste once, correct seasoning, compare two preparations, and plate one dish. Never turn the meal into a production line.

### One Road Trip

Useful actions: choose one map, prepare the vehicle, follow one sign, adjust speed, choose one route, correct one turn, inspect fuel, compare two routes, handle one detour, and reach one destination. Never turn the trip into delivery logistics or city-scale traffic.

### Running or Fitness Practice

Useful actions: choose equipment, warm up, set pace, follow one marker, adjust stride, repeat one interval, inspect one split, recover, compare two runs, and cross one finish line.

### Pottery or Handcraft

Useful actions: choose material, prepare one tool, center one object, shape one edge, adjust pressure, follow one outline, smooth one defect, inspect symmetry, compare two forms, and complete one piece.

### Mountain Hiking

Useful actions: choose equipment, pack one item, read one map, adjust pace, follow one direction, use one support, check one step, compare two routes, handle one obstacle, and reach one destination.

### Photography Practice

Useful actions: choose one lens, frame one subject, adjust focus, change exposure, move viewpoint, inspect one detail, correct one setting, compare two shots, select one result, and finish one series.

## Mechanism Prompts

Use these prompts to invent candidates rather than as fixed mappings:

- For iterative correction, ask which familiar activity visibly improves one attempt at a time.
- For sequence or generation, ask which activity builds one coherent result through ordered gestures.
- For routing or policy choice, ask which activity makes alternative decisions and consequences visible.
- For representation change, ask which activity changes viewpoint, shape, grouping, detail, or interpretation.
- For guidance or conditioning, ask which activity uses a cue, reference, plan, rhythm, or constraint.
- For stabilization, ask which activity uses balance, support, tuning, calibration, or review.
- For architecture, keep the automatic animation as one life action and place the real structure in a separate active technical module.
- For results, close the same activity with a verified comparison, completion, or evaluation.

## Semantic Colors

These roles are the canonical semantics (exact hex in `contract.md` §5, the single source
of truth). Always preserve these meanings:

- red: corruption, error, danger, unsuitable choice, or harmful state;
- green: repair, correctness, safety, completion, or useful state;
- blue: guidance, conditioning, the model, or current state;
- orange: user-controlled emphasis or threshold;
- purple: auxiliary or special concepts.

## Build the Theme Table

Before writing the temporary paperSkill, create exactly `chapterCount` rows (default 10; per `contract.md` §2):

| Chapter | Paper concept | Theme-related action | Primary subject | One verb | One goal | Static props |
| --- | --- | --- | --- | --- | --- | --- |
| 1-10 | one concept | clearly belongs to the selected theme | one | one | one | zero to two |

Check every row for:

1. **Theme fit:** the action obviously belongs to the same activity as the other nine rows.
2. **Scene simplicity:** the action is understandable without "and then", handoffs, stations, or several independently moving subjects.
3. **Concept fit:** the physical change expresses this paper concept, not merely generic progress.
4. **Action diversity:** preparation, execution, adjustment, inspection, correction, comparison, and completion are used to avoid repeating one literal motion.

## Cross-Chapter Consistency

Preserve continuity through the same activity, setting, drawing kit, background family, stroke style, semantic colors, subject scale, and concise Simplified Chinese labels. Keep one main motion per scene.

Do not create a story in which packages, workers, machines, couriers, or ingredients move through stations. The theme should feel like one coherent life experience, not a disguised data-processing pipeline.
