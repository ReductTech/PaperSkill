# Paper Tutorial Validation Checklist

Use this checklist at the end of each phase. `contract.md` defines the hard canvas
constraints and flexible deck-planning guidance; this file records the review that
scripts cannot perform. Automated validation never rejects a project for its chapter
or slide count.

## Phase 1: Paper-Specific Plan

- [ ] The canonical source cache passes `validate-source-cache.js`; every core claim, formula, figure and reported result has a source locator and valid conditions.
- [ ] The paper's actual problem, contribution, mechanism, experiments and limits are represented. Inferences are marked as interpretations.
- [ ] Several everyday-theme candidates were considered. The chosen theme has a paper-specific mechanism and episode-variety advantage; no demo theme is adopted by default.
- [ ] The chosen activity has recognizable people, objects and settings where used. Each slide chooses a life, hybrid or paper-native view; no recurring photo or prop is repeated merely with new labels.
- [ ] Each planned slide records its scientific objective, focal visual, unique widget ID, learner action when interactive, scientific explanation, feedback, source/analogy boundary, and `layoutRef: L01…L08` or `custom` with a reason and geometry sketch.
- [ ] A deck-wide scene ledger records the chosen teaching-slide count (usually about 10–15 including the cover), the role of each page, its learner operation, meaningful motion if any, and the linked paper state. Any shorter or longer plan is explained by the paper, not adjusted to pass a count gate.
- [ ] Theme-grounded animated interactions meet the planning target in contract.md §3; review their coverage separately from purely paper-native interactions and static theme illustrations. Distinct theme episodes and scientific consequences are present in the early, middle and late sequences, including a later application or failure-and-repair interaction. Direct technical manipulation and evidence pages remain where they explain better. Passive loops, cosmetic image effects and CSS entrances are not counted.
- [ ] Every page has a recognizable theme visual linked to its scientific question. Static/technical pages use a small, readable illustration or object beside the explanation or evidence.
- [ ] The full-deck contact sheet varies according to the concepts. Repeated left-animation/right-card silhouettes, one photo reused through the deck, generic dots/flows, generic evidence headings and large unpurposeful blank areas have been redesigned.
- [ ] Core methods have meaningful interactive coverage; evidence or boundary chapters may use `modules: []`. Additional modules, formal views and result pages exist only where the paper benefits from them.
- [ ] Central contributions map to core-method experiments, distinguished from supporting result/chart controls. Method pages predominantly let learners operate the actual mechanism. Each has a causal specification with an executable relation, visible intermediate/output consequences and two contrasting expected states; no core concept is covered only by benchmark selection or a bar animation.
- [ ] Planning uses both the L01–L08 compositions and relevant runnable assets demo functions. Their causal behavior is adapted to the paper; demo theme/content is not inherited.
- [ ] The temporary `SKILL.md` is fully paper-specific and contains enough implementation detail for the planned pages. It has no unfinished placeholders or copied demo scenes.
- [ ] `stage-template.js` produced a demo-free scaffold, neutral layout gallery and complete global Markdown guides in the temporary skill. Any original paper figures were staged from the validated cache before Phase 2.
- [ ] Optional videos have real, relevant BVIDs; covers and view counts are recorded only when actually retrieved. No video lookup blocks generation.

## Phase 2: Project and Interaction

- [ ] `scaffold.js` created one `<paper-short-name>_output/` project, with the official English paper title on the cover and natural Simplified Chinese teaching copy.
- [ ] Chapter packets own disjoint IDs; `assemble-chapter-packets.js` wrote `tutorial.ts`, widget files, `registry.tsx` and the derived `outlines.json` once.
- [ ] Selected life scenes use the chosen world; technical pages directly expose the paper mechanism without a forced life prop. The cover's two method animations share one clock and comparable starting conditions. Each page was implemented after inspecting its chosen gallery reference or custom sketch; no gallery sample text leaks into the app.
- [ ] The generated pages were reviewed against the intermediate slide plan, staged global skill rules, gallery and actual React schema together; any disagreement was resolved before final validation.
- [ ] Every primary module is mounted on a named scene. Its learner operation changes a paper-relevant variable, component, constraint or measured comparison, the main scientific visual and immediate feedback. A photo effect or moving prop alone does not count.
- [ ] For each planned animated interaction, the learner action causes the intended motion and the linked scientific visual/value and feedback to change; inspect initial, intermediate and result states. Review the later result-interpretation and applicability pages as well as the early method pages; operate their planned interactions and confirm where each static page reconnects to the mechanism.
- [ ] Exercise both planned contrasting inputs for each core-method module and check the computed intermediate/output states against its rule. Scene, formal view and feedback derive from the same scientific state. Theme objects expose that state; cosmetic motion, fixed number reveals and benchmark filters do not masquerade as method experiments. Toy results are identified as demonstrations, never reported as measured paper benchmarks.
- [ ] The reference-only `assets/layout-gallery/teaching-demo/` was inspectable in Phase 2 but its demo modules/data were not copied into the generated runtime.
- [ ] Scientific terminology appears in titles. Equations, architecture details, figures and measured results are readable where they help the explanation. Some pages give text/formal material more area than life animation; animation is not enlarged merely to fill a template.
- [ ] Chapter markers sit at the upper right of slide headers. Within each teaching body, computed text uses no more than the three roles in contract.md §2.5; redundant tiny labels are removed. Important content uses the available body area without clipping or gratuitous blank space.
- [ ] Sources and analogy limits are traceable in the evidence matrix and notes. Exact figures/numbers have on-slide attribution only where needed; no generic “论文机制 / 证据” or “论文出处” heading appears.
- [ ] Formula symbols, assumptions, shapes and signs match the paper. Result comparisons use compatible protocols, units, baselines and metric directions.
- [ ] Numerical experiment tables are visualized with suitable statistical charts unless a table better serves the stated learning objective. Check plotted values against the selected source rows, metric direction, units, zero-based bars, comparable scales, readable labels and uncertainty handling per presentation-standard.md. Result graphics do not substitute for core-method interactions.
- [ ] Visible formula terms have contextual Chinese meanings on hover/focus and mobile tap, including custom bodies. Hints remain inside the viewport without shifting slide content; Escape and outside click dismiss them. Symbol hints do not count as core method interactions.
- [ ] Use the staged framework as the default starting point. Keep paper content primarily in `src/data/tutorial.ts`, `src/modules/*`, `src/styles/paper.css` and staged media.
- [ ] Interaction works by mouse, keyboard where feasible, and touch. Two-pointer pinch and bounded pan still work in mobile emulation without reflowing the slide.
- [ ] No slide or card scrolls. The 1600×900 canvas fits with readable text in desktop, mobile, notes and fullscreen states; longest feedback and expanded details do not overlap or clip.
- [ ] Capture and inspect the cover, every teaching page and optional video page. Run `auditSlide()` after fonts/images settle and after exercising meaningful interaction states; require no errors. If browser review is unavailable, report slide-fit validation as incomplete.

## Automated Checks and Delivery

- [ ] After `npm install`, run `node syntax-check.js <outputDir> --require-parser` and `node validate-output.js <outputDir>` on the final folder. Both pass; any edit afterward triggers both again.
- [ ] The validator reports chapter and scene counts for inspection but applies no numeric page-count or chapter-count range.
- [ ] Local images, thumbnails, media and data use page-relative `./...` URLs from `public/`, Vite imports from `src/`, or stylesheet-relative CSS URLs. Check loading from a nested deployment path.
- [ ] `npm run build` passes in the generated project. Review content warnings and correct visible placeholders, demo content or invalid video links as appropriate.
- [ ] The exact task-scoped temporary root is removed after success or failure, unless `PAPER_SKILL_DEBUG=true`. Confirm the resolved target is the task root before recursive removal; never delete a broad temp parent.
- [ ] Deliver the final project folder only. In debug mode, also return the preserved task root path.
