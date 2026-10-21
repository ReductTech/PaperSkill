# Slide composition gallery

This gallery is a **visual starting point**, not a runtime layout system. Open `index.html` and compare its slide thumbnails before planning pages. The fixed PPT player supplies the title/header and a 1472 × 622 body; build each body as a paper-specific React widget. `layoutRef` belongs only in the intermediate planning script, never in `SceneDef`, `outlines.json`, or the rendered UI.

Choose by the page's scientific question and the amount of explanation it needs. Blue illustration regions may become a theme-specific animation **or a paper-native manipulable mechanism**; they are not placeholders that must contain the same life image. Replace sample shapes and copy with the selected paper's variables, structure, evidence and selected everyday episodes. Combine or alter compositions freely; record `custom` when none fits. These examples are deliberately different in hierarchy, not a set of slots to fill.

| ID | Composition | Good for | Animation / explanation balance |
| --- | --- | --- | --- |
| `L01` | Immersive event with a small anchored principle | Opening, a decisive physical outcome | Large scene; only the needed short explanation |
| `L02` | Explanation-led with a compact manipulable inset | Derivation, assumptions, scientific mechanism | Small paper variable; generous readable prose and formula |
| `L03` | Linked workbench | Several sliders or drag targets changing one paper-relevant result | Medium mechanism, compact controls, substantial interpretation |
| `L04` | Matched comparison | Old/new method, ablation, controlled conditions | Two comparable live views with one shared conclusion |
| `L05` | Story sequence | Distinct moments of one physical event | Three broad moments plus a clear scientific link |
| `L06` | Evidence focus | Verified figure, statistical comparison or limitation | Numerical result tables usually become readable charts; compact comparison control when useful |
| `L07` | Mechanism bridge | Mapping a physical action to a formal rule | Medium life view and medium formula/technical view, visibly linked |
| `L08` | Annotation canvas | Explaining parts of an architecture or process | One large manipulable diagram with a few spacious anchored explanations |

The gallery includes large, medium and small visual footprints so the model has no reason to fill every slide with a giant illustration. Scientific explanations may lead the hierarchy on `L02`, `L06`, or a custom page. On mechanism pages, the visual must change the paper-related state; a photo with an opacity or clarity slider and a changing caption is insufficient. A page should contain enough visible teaching text to explain the paper relation whenever that is its learning goal. Speaker notes hold provenance and analogy limits, not the only explanation of the paper. Apply the three body type roles from `contract.md` §2.5 and remove small decorative labels.

## Behavior references, not just silhouettes

Before implementing mechanism pages, inspect the runnable example's `MountainPack`,
`MountainMap` and `MountainClimb` in `../react-template/src/modules/MountainJourney.tsx`
and the adjacent CSS. In a staged temporary skill these exact reference files are under
`teaching-demo/` instead. They demonstrate direct scene operation, derived constraints,
and several linked controls driving one animation plus a visible calculation. They are
reference-only; choose the current paper's own theme and computation rather than importing
the demo. Follow the core-method design test in `references/interaction-patterns.md`
(staged under `assets/global-guides/`).

Choose L03 for a linked method workbench, L04 for a controlled mechanism comparison,
L07 for shared-state life/formal views, and L08 for manipulating an actual structure.
These are suggestions, not fixed assignments. L06 or an animated chart is appropriate
for results but cannot replace the central method experiments. For each method page,
record the operation and computed intermediate/output change as well as its layout.

## Whole-deck composition

For **each slide**, first name its scientific question and choose a life, hybrid or paper-native view. Then inspect the gallery and write `layoutRef: L01…L08` or `layoutRef: custom` with a one-sentence reason. Record the intended positions/sizes of the main manipulable mechanism, any life animation, explanation, controls and evidence; these can diverge from the example. If `custom`, sketch the geometry in words. Two pages may share a reference only when their actual compositions are meaningfully different. Review sketches side by side: repeated photo, repeated gesture, excessive empty area and tiny labels indicate a planning problem.

Review the gallery choices as a whole deck, not one slide at a time. In a typical
10–15-slide plan, let meaningful animated interactions recur through the method pages,
while explanation-led and evidence-focused pages retain enough room for the science.
The target and mix are editorial guidance, not a validator limit. A new page needs a
new learning question, operation or verified result; changing only the layout reference
does not make a repeated interaction useful.

The theme is a **world of related activities** carried through every page per contract.md §3, using varied operable episodes or compact static illustrations according to the concept. A hiking theme, for example, could introduce equipment choice and ascent, while a technical page directly manipulates the paper's optimization landscape. The example is not a default and no activity sequence is required. Pick the actual theme from the paper's mechanism; vary the episode, focal object, learner operation, scale and viewpoint where life scenes help.
