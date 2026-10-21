# Scene-based presentation standard

## Benchmark and scope

Format reference: [ReductTech creator-skill](https://github.com/ReductTech/intuitive-deep-learning/blob/7807ef6a17067d2d189c8159622416fa0d76aa3e/creator-skill/SKILL.md),
its shared SceneDeck player and Typography system, inspected 2026-10-09.
This is an independent adaptation of its presentation format, not a vendored runtime.
Do not import its telemetry, backend, account identity, asset services or confirmation workflow.
Preserve paper-skill's continuous two-phase generation and standalone local React output.

## Preserve animation-based interactive teaching

The benchmark governs page format and navigation. The teaching identity remains paper-skill:
one coherent everyday metaphor, animated physical analogies, paper-specific interactive
experiments, immediate visual feedback, and the original interaction-density requirements
in contract.md §§3–4. Read animation-library.md, interaction-patterns.md and
visual-interaction-standard.md alongside this format guide. Inline their concrete animation
and interaction specifications into the temporary skill; do not replace them with a slide outline.

The opening may use pure life animation to pose the problem. Use the comparison and its final
sentence to name the paper's core method, then move promptly from intuition to mechanism.
Choose life episodes only where their physical action helps explain the question. Other pages
may center a paper-native diagram, formula, architecture, figure, table or interactive
calculation; include a compact theme illustration or object tied to that page's explanation,
comparison conditions or conclusion per contract.md §3.
Do not duplicate one photo, prop or animation across the deck with changed captions or
controls. When life and formal views share a page, connect them through the same learner
state. A dedicated principle or evidence page retains a small, clearly legible theme visual related to its scientific content. Avoid making
every slide animation with a tiny technical footnote or a grid of small charts. A fixed
canvas is not a static image. Only the sidebar thumbnail is a
screenshot. Never substitute a GIF/video/autoplay loop, decorative entrance animation,
click-to-reveal text or static diagram for a required active module.

Place every primary module on a named scene where it teaches the chapter's question.
Prefer a dedicated module scene (`componentId`, `moduleId`) so the actual registered widget
is mounted. A custom composition that embeds a module must declare its `moduleId` and render
that module, including controls and feedback; a descriptive mention in notes does not count.
Use the paper's official English title (`meta.titleEn`) as the cover's main heading; keep
the Chinese teaching title for navigation or supporting copy. Do not invent an English title.
The cover itself must show the original and paper methods as live animations. Register both
`hero.oldMethod.componentId` and `hero.newMethod.componentId`. Cover widgets read the shared
`useCoverPlayback()` clock (progress 0–1 and playing), use identical inputs and aligned visual
scales, and show each method's actual mechanism and outcome through the same life situation.
Set `hero.oldMethod.title` and `hero.newMethod.title` to the compared method or concept names
from the paper; the generic panel labels are only a legacy fallback. Keep the animated panel
descriptions in plain language.
Keep descriptions short so both animations remain prominent. End the cover with one visible
core-method sentence derived from the paper (`meta.coreInsight`), without pretending the
analogy itself establishes a scientific result. The shared clock is internal;
do not add play/pause, step, reset or tab controls to the cover. Widgets must not start
independent timers. Figures or text alone cannot replace either cover animation.
Ground comparisons in the paper and label explanatory examples.

Implement each cover widget inside its available panel body (currently 664×324 design pixels).
Import `useCoverPlayback` from `../components/CoverPlayback`, read `progress`, and derive all
object positions and visible feedback from that value. `moduleId` is `oldMethod` or `newMethod`
so one comparison component may implement both sides. Do not render another title/control bar
inside the widget; those belong to PresentationCover. Reserve room for the longest outcome text.

For each active module, specify the learner's decision, directly manipulable scientific or scene object or
small set of coordinated controls, state variables, animation timeline, visual encoding,
initial/intermediate/final states,
immediate feedback, paper evidence and failure/boundary case. Write an explicit mapping:
learner action → paper variable or component → source-backed equation/rule → visible
prediction/result. Name where the analogy stops being faithful. The learner must be able
to explain the paper principle from the formal representation, not only retell the animation.
Prefer manipulating the scientific object directly when that expresses the mechanism clearly.
A life-scene drag, linked sliders, architecture choice or evidence comparison can all work
if inputs jointly drive the same experiment, formal representation and outcome; avoid disconnected mini-demos,
repeated tag/tab switching and transport buttons. One large coherent interaction may have
several linked effects, but they should read as one scientific question, not many miniature
widgets. Automatic physical analogies should remain recognizable and readable at fitted size. Honor reduced motion, cancel animation timers on unmount, and mount only the active
scene. Keep single-pointer manipulation usable while yielding multi-touch to stage pinch zoom.

Validation must operate every module and observe its main graphic and feedback change together. Check any technical representation when that page includes one. Check that a source locator supports each paper-specific formula,
mechanism and result, and that the life-to-paper mapping and its limits are stated correctly.
For dynamic pages inspect initial, intermediate, boundary and longest-feedback states. Static screenshot
or component registration alone cannot establish an interactive-teaching pass. The opening
may use a large automatic life animation; an evidence page may use a paper figure or table as
its dominant visual. Do not emit a text-only recap, three takeaway columns, or a small analogy
beside a single line of copy. Required teaching modules remain functional and visible.

## Numerical experiment results

When a paper reports a numerical experiment table, make its meaningful comparisons visible with statistical charts rather than reproducing a dense table or a collection of number cards. Choose freely by the scientific question: bars or dot plots for model/ablation comparisons, lines for ordered sampling steps or training budgets, and scatter plots for quality–cost or quality–diversity trade-offs. Do not connect unordered model categories with a line or use a pie chart for unrelated scores. A few isolated numbers need no artificial chart; retain a table when exact lookup or mixed, incomparable fields are the actual teaching objective.

Select coherent rows/columns and preserve the source values, dataset, protocol, units and metric direction. Separate metrics with different scales or meanings into readable panels; do not combine BLEU, latency and parameter count on one axis. Use a zero baseline for bars, consistent scales within a comparison, direct value labels and readable axes/legends per contract.md §2.5. Show uncertainty when the paper supplies it and it matters to the conclusion; never invent missing values, error bars or intermediate curve points. If a plotted metric has uncertainty omitted for readability, preserve the exact uncertainty and its meaning in notes. Keep a concise visible interpretation and relevant comparison conditions; provenance and the complete selected data can remain in speaker notes. All plotted values must be recoverable through visible labels or accessible details, including on touch.

Record the selected table rows, chart form, axis domain, grouping, uncertainty handling and intended conclusion in the per-slide plan. Charts may be static; add interaction only when it helps inspect a substantive comparison. Result-chart controls remain supporting evidence and do not replace core-method experiments. A toy interaction must never change a chart labeled as measured paper results.

## Plan scenes, not long chapter cards

Chapter count and canvas dimensions come from contract.md §2. Chapters group the narrative;
pages are independent units. Use the contract's soft page-count target, adjusting for the paper
rather than padding. Typical progression: question → intuition → mechanism → operation →
evidence → boundary. Do not mechanically repeat that sequence in every chapter.

Review the ordered early, middle and late page sequences before coding, following
contract.md §3. Carry meaningful learner-driven motion and distinct theme episodes through
the method, result interpretation and applicability sections. Integrate quieter derivation
or evidence pages with a planned return to the related mechanism interaction. A CSS entrance, endlessly looping background or animated image
effect does not count. The suggested mix guides editing; no page count or animation
proportion is enforced by the structural validator.

Each scene must have a stable globally unique ID and exact title, goal, summary, interaction,
next transition and notes. Give every scene one learning goal and one dominant graphic.
Use the paper's normal technical vocabulary in chapter, module and scene titles: name the
method, mechanism, formal relation, experiment or finding. Avoid colloquial questions and
life-action titles such as "pack the backpack". Put the life-story wording in `goal`,
animation prompts, feedback and notes. The Chinese tutorial title should be a faithful
technical rendering of the paper title or central method, not a new metaphor title.
Select only the chapter content needed for that page. Extended explanations go in speaker
notes; important claims and evidence still appear in the visible teaching sequence.
Cover all required chapter modules, analogy, formula (when present) and conclusions across
pages. Keep takeaway text brief and attach it to an animated outcome, live experiment or
substantial source evidence; do not make a standalone bullet-summary slide.

## Runtime schema and composition

### Compose for the learning question

The model chooses the geometry of each slide after deciding what the learner should see and do. Inspect `assets/layout-gallery/catalog.md` and `index.html`; record `layoutRef: L01…L08` or `custom` **in the intermediate slide plan** and adapt the visual reference to the paper. There is no runtime layout family field, quota or mandatory evidence position. Compose inside the fixed body with paper-specific CSS. A scene may fill nearly the whole body, host several linked controls around one physical situation, compare two conditions, prioritize substantial explanation with a small live inset, or make a verified paper figure the focal point. Scientific material may be embedded in the action, occupy a distinct slide, or appear in speaker notes when it is only provenance. Do not repeatedly place a small animation left and a generic evidence card right.

Before coding, review page sketches side by side. Recompose repeated silhouettes, repeated photos and repeated physical gestures; visual variety must reflect a real change in scientific question and learner operation. Reuse the chosen world's cues without cloning its literal scene. No numerical diversity metric substitutes for this review.

### Living experiments at the scale the concept needs

Use a recognizable interactive life event only at the scale needed to explain the concept.
An introductory event may occupy most of the body; a derivation or results page may use a
paper-native experiment with no life inset. A composite page can place compact controls
near a medium scene, with its scientific relation and interpretation given equal weight.
Use controls only where they make distinct paper variables or choices testable. Avoid a
four-card dashboard, decorative node/edge diagram, repeated tabs or many small labels.
Build the composition around the scientific action and let its consequences carry the explanation.

Specify the scene's subject, action, goal, manipulation target, state, resulting motion,
comparison and longest feedback before coding. Specify which term, curve, formal relation or
verified metric changes when the learner adjusts each physical object or compact control,
including units and valid
range. Make the manipulation target generous and visually obvious on desktop and touch. Give
the formal principle enough space and type size to read at presentation scale; it must not be
an optional tiny caption. Count actual learning modules, not physical props or
layout panels. Check initial, moving, success, failure and parameter-boundary states for fit.
Change page composition when the content requires it; do not force every chapter into the
same panel template. Split only when the learning question or density warrants it.

Add `scenes: SceneDef[]` to every new chapter. The type in `src/types.ts` is authoritative.
Every scene uses `componentId`: a paper-specific page body registered in
`src/modules/registry.tsx`, using WidgetProps. Set `moduleId` when the scene teaches an
existing chapter module. Use a different scene widget for each page. The packet assembler
rejects legacy `focus` scenes and repeated scene widgets. Build a large
life action, linked principle or substantial evidence visual for each page instead of
selecting a preset intro, formula or recap layout.

`ScenePage` owns the title/subtitle header; body components own a fixed region whose geometry
is defined in contract.md §2.4. Use Grid, Flex or absolute placements within that region.
Keep one large visual and a clearly legible formal relationship where needed, with only a
few large supporting annotations. Reduce tiny icons, tags,
labels and text blocks. Avoid equal-sized dashboard cards, repeated framed module headers,
multi-level containers and tab navigation as the primary teaching action. Two-column layouts
are optional, not mandatory. Leave breathing space and use alignment to establish hierarchy.

Use the shared page title and goal typography in the header. Within each teaching body use
the three roles from `contract.md` §2.5 via CSS tokens; do not introduce tiny eyebrow text,
footers or a fourth widget-label size. Remove a label when it only repeats a title or
number already visible. Position the chapter marker at the far right of the header rather
than above the title. Inspect each slide for excessive empty area and enlarge meaningful
graphics or explanation instead of filling it with decoration. Preserve semantic
color roles from contract.md §5. Render mathematical structure correctly using the existing
local formula support or semantic MathML in a page component; no fake matrix/LaTeX plain text.

## Player format

- White top toolbar: course title, previous/current/next, notes, fullscreen.
- Light left rail: 16:9 static page previews, page numbers, readable 16px labels, blue selection.
- Dotted gray workspace, centered white slide, restrained corner radius and shadow.
- Notes in an external inspector; slides do not scroll. Fullscreen fits the entire slide.
- Small-screen rail is a dismissible drawer. Preserve local pinch, bounded pan and zoom/reset;
  no fixed-width viewport trick or responsive reflow inside the canvas.
- Keyboard paging yields to all interactive controls. Buttons have labels and focus indicators.

Do not clone the player into paper modules. Do not mount all widgets in thumbnail previews.
Provide local screenshots in `public/thumbnails/` and set scene.thumbnail to a page-relative URL
such as `./thumbnails/scene.jpg`; use `./thumbnails/cover.jpg` for a local cover screenshot. The player uses a
textual preview while an image is absent; that is a fallback, not a screenshot of the page.
Capture at `?capture=1&slide=<scene-id>` with a 1600×900 viewport after fonts/images settle.
If screenshot tooling is unavailable, explicitly report missing thumbnails and visual validation.

## Assembly and acceptance

The assembler validates explicit scenes and writes `outlines.json` with title and ordered
pages (id, chapterId, title, goal, summary, interaction, next, snippet). `snippet` comes from
notes. It is a derived artifact; edits go into chapter packets, never a second outline copy.

Run TypeScript/build, syntax and output gates. Inspect every rendered scene at fitted scale,
including the longest feedback/reveal state, and run the browser geometry audit. Check title
wrapping, canvas boundaries, overlap, readable visual hierarchy, interactive controls, keyboard
paging, notes, fullscreen, deep links, desktop rail and mobile drawer/zoom. A clipped page is
a failure even if the outer document has no scrollbar. Split dense content into another page.
