# Project Guide

## Purpose

This repository is the React + TypeScript source for a seven-chapter Chinese interactive tutorial based on *Securing the Agent: Vendor-Neutral, Multitenant Enterprise Retrieval and Tool Use*. The primary use case is a four-minute desktop presentation.

## Ground Truth

- Story structure: 7 chapters, 10 active modules, defined in `src/data/tutorial.ts` and locked by `src/data/tutorialStructure.test.ts`.
- Paper evidence: `src/modules/evidence/paperEvidence.ts`.
- Illustrative tenant scenarios: `src/modules/evidence/scenarios.ts`.
- Runtime architecture: `docs/architecture.md`.
- Latest verification: `docs/verification.md`.
- PaperSkill handoff: `docs/submission.md`.

Do not infer the active chapter order from historical Git commits. The current module IDs are `1.1 / 2.1 / 2.2 / 3.1 / 3.2 / 4.1 / 5.1 / 5.2 / 6.1 / 7.1`.

## Environment and Commands

Use the Conda environment named `paperskill`. On Windows, run Conda-backed npm commands serially because parallel `conda run` calls can contend for temporary files.

```powershell
conda run -n paperskill npm test
conda run -n paperskill npm run build
conda run -n paperskill npm run dev
```

## Behavioral Invariants

- Relevance never substitutes for authorization.
- Retrieval gating provides the data-access safety guarantee.
- Server-side orchestration makes retrieval, tool authorization, and tenant-state steps non-bypassable; do not claim orchestration alone prevents leakage.
- Offline ingestion is not part of the online query path.
- Legal content never enters a Finance authorized context in the paper method.
- Shared inference means a shared endpoint, not mixed tenant context.
- A3 does not protect information remembered in model parameters.
- Measured evidence and illustrative animation data must remain visibly distinct.
- Milliseconds, seconds, and QPS must not share a quantitative axis.

Each unrelated module owns its own timeline. Only panels showing the same causal event may share progress. `4.1` defaults to `1.5×`; `6.1` defaults to `0.5×`; other full timelines default to `1×`.

## Editing and Verification

- Prefer pure `deriveScene` functions so Canvas, readouts, feedback, and ARIA use one model.
- Keep desktop Canvas geometry stable and check for text overlap after visual changes.
- Add or update a failing test before behavior changes.
- Before completion, run the full Vitest suite, production build, and an appropriate Playwright desktop check.
- Do not commit `node_modules/`, `dist/`, `.playwright-cli/`, `.superpowers/`, or `output/`.

## PaperSkill Submission

Do not import, push, or create a Pull Request without explicit user authorization.

```text
paperName: securing_the_agent_vendor_neutral_multitenant_enterprise_retrieval_and_tool_use
participant: 祝铭堃
github: EricEvans-e
paperUrl: https://arxiv.org/abs/2605.05287
year: 2026
venue: ACM CAIS '26
```

The PaperSkill import script does not honor this repository's `.gitignore`. Create a clean export containing only tracked deliverable files before import, then verify that the PR changes only the new `html_output/<paperName>/` directory and `catalog/papers.json`.
