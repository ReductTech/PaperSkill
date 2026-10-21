# Chapter planning guide

Plan chapters in a paper-specific teaching order. A chapter groups independently composed
fixed-size slides. For a substantial paper, about 10–15 teaching slides including the cover
is a useful starting point; the model may choose otherwise when the material warrants it.
Titles use the paper's ordinary scientific terms; its recurring everyday activity appears
in selected animations, controls, examples and feedback.

For each chapter, state the unresolved question and source-backed answer. Sketch each slide's focal visual and actual learner action. Use a recognizable episode in the locked theme where analogy helps; otherwise plan a paper-native mechanism or result view. A life page may be almost entirely animated, another page may directly manipulate a formula, architecture, feature view or measurement, and another may use several linked controls. These are possibilities, not required slots or layout classes.

For every active module specify the operation, initial and reachable states, objects and controls, how the paper-relevant main graphic changes, exact immediate feedback, and the judgment the learner should form. A photo effect without a changing scientific representation is insufficient. Give formal relations and results readable space when they help. Use no more than the three body type roles in contract.md §2.5 and remove redundant small labels. Keep source locators, protocols, and analogy limits in the evidence matrix and speaker notes; show exact attribution on a slide only where necessary. Do not render generic headings such as 论文机制 / 证据, 论文出处, 来源 / 证据 or 实验 · 机制示意. Use a specific scientific heading or no subheading.

Use ChapterDef with kind: "chapter", id, title, modules[] and scenes[]. Each scene records id, title, goal, summary, interaction, next, notes and a unique registered paper-specific componentId; set moduleId when it teaches a module. There is no layoutFamily field or automatic intro/formula/recap preset. Choose the page composition freely within the shared 1472 × 622 body and verify the longest reachable state fits without scrolling. Keep keyboard and touch operation usable with whole-slide scaling and pinch zoom.

Across the full tutorial, meet the interaction density in contract.md §3 and cover the paper's actual method, results and limitations. Do not make every chapter follow the same problem → animation → formula → evidence sequence. Review the full-deck contact sheet for repeated silhouettes, repeated tiny line/point graphics, or the same left animation/right card pattern; revise until the scenes reflect genuinely different teaching events.

Before implementation, make a deck-wide scene ledger with each page's role, learner operation,
whether it has meaningful motion, the changed scientific representation, and the source-backed
claim. Check that animated interactions recur through the method instead of being confined to
the cover; balance them with direct technical interactions and readable evidence pages. Do not
count passive loops, decorative CSS movement, or a moving photograph as animated interaction,
and do not add pages merely to hit the suggested length or mix.
