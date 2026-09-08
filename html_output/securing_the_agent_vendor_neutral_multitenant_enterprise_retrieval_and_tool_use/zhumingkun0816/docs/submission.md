# PaperSkill Submission Handoff

This document records the intended public metadata and the safe submission sequence. It does not authorize an import, push, or Pull Request.

## Public Metadata

```text
paperName: securing_the_agent_vendor_neutral_multitenant_enterprise_retrieval_and_tool_use
title: Securing the Agent: Vendor-Neutral, Multitenant Enterprise Retrieval and Tool Use
authors: Francisco Javier Arceo; Varsha Prasad Narsing
year: 2026
venue: ACM CAIS '26
paperUrl: https://arxiv.org/abs/2605.05287
participant: 祝铭堃
github: EricEvans-e
topics: RAG, Multitenancy, Access Control, Agentic AI
initial status: review
```

Target branch:

```text
paper/securing_the_agent_vendor_neutral_multitenant_enterprise_retrieval_and_tool_use
```

## Before Import

- Confirm the tutorial repository is clean and all desired changes are committed.
- Run the complete test suite and production build.
- Perform a basic mobile overflow smoke check because the upstream PR template requires it, even though the presentation is desktop-first.
- Confirm the two extracted paper figures satisfy the upstream repository's public-material review requirement.
- Fetch the latest `ReductTech/PaperSkill` upstream main before creating the submission branch.

## Clean Export

Do not pass the working directory directly to `npm run import`. The upstream import script excludes `.git`, `node_modules`, and `dist`, but it does not honor `.gitignore` and can copy local browser artifacts.

Create a temporary export from the committed revision containing only:

```text
.gitignore
AGENTS.md
README.md
docs/architecture.md
docs/submission.md
docs/verification.md
index.html
package.json
package-lock.json
tsconfig.json
vite.config.ts
public/
src/
```

## Upstream Workflow

From the PaperSkill fork:

```powershell
git fetch upstream
git switch main
git merge --ff-only upstream/main
git switch -c paper/securing_the_agent_vendor_neutral_multitenant_enterprise_retrieval_and_tool_use
```

Import the clean export using the official script:

```powershell
npm run import -- <clean-export> securing_the_agent_vendor_neutral_multitenant_enterprise_retrieval_and_tool_use `
  --title "Securing the Agent: Vendor-Neutral, Multitenant Enterprise Retrieval and Tool Use" `
  --paper-url "https://arxiv.org/abs/2605.05287" `
  --participant "祝铭堃" `
  --github "EricEvans-e" `
  --year 2026 `
  --venue "ACM CAIS '26" `
  --topics "RAG,Multitenancy,Access Control,Agentic AI"
```

After import, add the two authors to the generated `paper.json` and keep `status` as `review` until an upstream reviewer asks for `published`.

## Required Checks

```powershell
npm run validate
npm run catalog
npm run validate:pr -- main
npm run build:paper -- securing_the_agent_vendor_neutral_multitenant_enterprise_retrieval_and_tool_use
```

Before commit, confirm the branch changes only:

```text
html_output/securing_the_agent_vendor_neutral_multitenant_enterprise_retrieval_and_tool_use/
catalog/papers.json
```

The Pull Request must include at least three key screenshots, a short interaction summary, the substantial manual improvements, and any content requiring reviewer attention. After merge and Pages deployment, locate the tutorial at `https://reducttech.github.io/PaperSkill/#search`.
