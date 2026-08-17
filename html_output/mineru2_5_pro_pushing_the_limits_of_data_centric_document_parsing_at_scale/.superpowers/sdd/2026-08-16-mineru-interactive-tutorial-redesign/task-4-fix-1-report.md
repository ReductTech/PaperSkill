# Task 4 review-fix report

## Root cause and RED → GREEN

- Root cause: Render computed comparison buckets only in local render state and restored only `repaired`; CMCV separated its route-complete state from its consensus-boundary state and did not reconstruct the prior route for a trust deep link.
- RED: added behavior tests for slider reporting (`compare-p0|compare-p50|compare-p100`), all bucket restores, repaired restoration, automatic one-attempt consensus reveal, trust deep-link reconstruction, and explicit teaching scope. The targeted run failed in five assertions for the reported missing contracts.
- GREEN: the slider now reports through `onInteract('render-verify')` and `onStateChange`; restore maps p0/p50/p100 to 0/50/100 and repaired to the fixed terminal state. A route automatically reports and shows `cmcv-trust/consensus:correct`; its trust deep link restores Medium, token, outcome, label source, destination, and boundary.

## Verification

- Targeted: `npm test -- src/experiences/CmcvRoutingChallenge.test.tsx src/experiences/RenderForensics.test.tsx` — PASS (2 files, 6 tests).
- Full: `npm test` — PASS (8 files, 21 tests).
- Build: `npm run build` — PASS.
- Validator: `node ..\\PaperSkill\\paper-skill\\scripts\\validate-output.js .` — PASS (6 chapters, 11 active modules).

## Accessibility, fact boundary, risks

- The range input now has `min-height: 44px`; repair remains a native keyboard button. Reduced-motion transitions remain disabled. Browser visual QA was not run because no browser connection was available.
- The synthetic lanes and their feedback now share an explicit `教学示意：合成分流与反馈` scope. OmniDocBench remains an input anchor only; wrong-route feedback still gives the exact target/A/B pairwise relation.
- No App/main/registry integration change was made. Task 6 must import these experience modules for the stylesheet and components to reach the application runtime.
