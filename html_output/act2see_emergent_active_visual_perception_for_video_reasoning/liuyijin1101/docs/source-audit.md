# Act2See source audit

Accessed 2026-10-04. Route: paper-skill `read` + `write` + `figures`. Primary text: [arXiv 2605.01657v1 HTML](https://arxiv.org/html/2605.01657), submitted 2026-05-03; [arXiv record](https://arxiv.org/abs/2605.01657). CVPR 2026 status is stated on the arXiv record. The supplied CVF landing page returned HTTP 403 during this audit, so final CVF typesetting was not independently compared. [Official code link](https://github.com/martinmamql/act2see) currently says “Code available soon.”

## Intake and argument model

- Artifact: independent, local Chinese interactive tutorial; no model inference or experiment reproduction.
- Field: video vision-language reasoning; venue given by user: CVPR 2026.
- Research question: can a VLM choose when and how to acquire new visual information while reasoning about a video?
- Central claim C1: SFT on high-quality video-text interleaved reasoning traces enables active retrieval or conditional generation inside CoT at inference (§2, §3, Figure 4).
- C2: human-annotated CoTs are used **after** trace generation to filter traces; not injected into the first prompt (§2.1, §3.3, Table 6).
- C3: on five reported benchmarks, Act2See improves over its Qwen3-VL-8B-Thinking base model (Table 2).
- C4: retrieval and generation are distinct operations; generation uses a retrieved conditional frame (§2.1, §3.2).
- Scope: these results concern the paper's benchmark and tool settings, not physical camera control, arbitrary video domains, or local reproduction.

## Method facts — VERIFIED

1. Gemini 2.5 Pro creates first-round reasoning and `<retrieve>` / `<generate>` query; TFVTG retrieves from the video; Stable Diffusion 3.5 Large generates a frame conditioned on a retrieved frame plus query; a second Gemini round completes CoT (§2.1, §3.2, Fig. 1).
2. Dataset sources: MINERVA, CausalVQA, Social Genome. Wrong-answer traces are regenerated at most twice; BGE M3-Embedding similarity must exceed 80%; format is checked; 100 manually checked samples all passed (§3.1–3.4).
3. 3,373 selected traces; 1,608 with visual frames = 47.67%; 1,026 retrieval and 582 generation (§3.4). The 47% in §1 is a rounded narrative value.
4. Base: Qwen3-VL-8B-Thinking; LoRA; 8 A100 GPUs; learning rate 2.5 × 10⁻⁶; batch size 1; one epoch (§4.3). SFT token loss includes tool queries but excludes retrieved/generated image frames (§2.2).
5. Algorithm 1 shows one visual call followed by continuation; the described two-round data construction also inserts the tool result before the second Gemini round (Appendix B). The teaching simulator follows that one-call path and does not invent a further visual call. Its steps are illustrative, not a logged run.
6. Initial sampling is 1 fps and retrieval search is 3 fps (§3.2). Do not conflate this with all Table 2 baseline input budgets.

## Results and boundaries — VERIFIED

- Table 2 accuracy, Act2See vs its base: Video-MME 74.2 vs 71.8; VideoEspresso 46.8 vs 41.5; EgoNormia 51.3 vs 48.9; VCR-Bench 47.1 vs 38.2; ViTIB 63.3 vs 60.2. Several base values are marked †, meaning authors evaluated them.
- Table 3: Chain-of-Frames scores 75.3 on Video-MME, exceeding Act2See 74.2. Never call Act2See universally best.
- Table 8 is a separate 1,000-sample ablation: text only 71.9; retrieval only 72.8; generation only 72.4; both 73.7 on Video-MME. Do not mix 73.7 with the 74.2 full-data result.
- Fig. 4 includes a generation mismatch: coffee beans requested into a machine appear poured into a mug (§4.4). Appendix F discusses latency and generation failures.
- Appendix F Table 12: a GPT-5.2-classified 107-question counterfactual subset of VCR-Bench yields 56.22% for retrieval+generation vs 43.41% retrieval-only. The subset labels were not provided by the benchmark.
- Appendix F counts 13 failures among 127 generation calls on VCR-Bench (10.2%; semantic 7, physics 4, geometry 2). This is sample- and setting-specific.
- Appendix F Table 11 compares 0.5 fps Act2See (106 input frames, 877 amortized TFLOPs, 38.7%) with 1 fps Qwen3-VL-8B-Thinking (210 frames, 1025 TFLOPs, 38.2%) on VCR-Bench. Frame budgets differ.
- Authors' conclusion: the framework enables dynamic retrieval/generation in CoT and improves selected benchmarks (§6). The paper has no separate main-text limitations section; the concrete generation failure is author-reported. Other caveats on tool cost, hallucination, long-video search are labeled structural teaching analysis.

## Discrepancies and unresolved

- §4.4 prose states VideoEspresso “ours: 3 vs GPT-4o: 1” frames, while Table 2 lists Act2See 1 fps and GPT-4o 3 fps. **UNVERIFIED** which prose number is intended. Site uses Table 2 and flags the discrepancy in the evidence notes.
- CVF page content and supplementary file: **UNVERIFIED** due to 403; arXiv HTML includes appendices.
- Code/model weights and runnable official inference: **UNVERIFIED**, repository currently contains only a coming-soon README.
- **AUTHOR_INPUT_NEEDED:** none to deliver this tutorial. A real model reproduction would require released code/weights and source assets.

## Figure inventory

Original arXiv HTML image assets locally archived in `public/paper/`: Figure 1 (two-round trace construction), Figure 2 (dataset composition), Figure 3 (SFT example), Figure 4 (inference examples). Each page caption identifies original source. CSS/HTML diagrams are explicitly marked 教学示意.
