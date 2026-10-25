# EWC enhanced web slice

This standalone React/TypeScript site contains the complete W8 EWC tutorial implementation through Page 10, including the Grand Animation integration and the searchable Reference Hub. It uses the frozen page, anchor, reference, runtime-object, and animation-state IDs recorded in `design/implementation-plan.md`.

## Upstream release structure

`src/types.ts`, `src/data/tutorial.ts`, `src/modules/registry.tsx`, and `src/styles/{tokens,components,paper}.css` provide the file structure required by PaperSkill's release validator. The tutorial data is a descriptive map of the ten existing pages; it is not read by the EWC app and does not form a second runtime. The site is rendered by `src/App.tsx` and the existing components in `src/pages/`, with styling from the existing `src/styles/` files and `src/shared/foundation/styles/kit.css`.

When a page title or one of its core content blocks changes, update its matching description in `src/data/tutorial.ts` so the release map stays aligned with the site.

## Web asset provenance

The figure assets below are copied unchanged from the paper source cache for noncommercial educational use; their file paths, source citation, and reuse limits are documented individually.

## Figure 1 provenance

`public/images/figure-1.png` and `../../assets/figures/web/figure-1.png` are byte-for-byte copies of `../../source-cache/figures/figure-1.png`. The source is the whole Figure 1 rendered from the paper PDF and cropped only to the figure bounds; no panel, label, data mark, or color inside the figure has been changed.

Kirkpatrick J, et al. *Overcoming catastrophic forgetting in neural networks.* Proceedings of the National Academy of Sciences. 2017;114(13):3521–3526. doi:10.1073/pnas.1611835114. Original Figure 1, reproduced unchanged for noncommercial educational use.

The project asset plan records the applicable PNAS standard License to Publish educational reuse policy. This is not a CC license and does not cover commercial reuse. If the tutorial's distribution or purpose becomes commercial, replace the original figure with a new diagram or obtain permission before release.

## Figure 3 provenance

`public/images/figure-3.png` and `../../assets/figures/web/figure-3.png` are unchanged copies of `../../source-cache/figures/figure-3.png`. The complete Figure 3, including panels A–C, is preserved; no panel, label, data mark, or color was altered.

Kirkpatrick J, et al. *Overcoming catastrophic forgetting in neural networks.* Proceedings of the National Academy of Sciences. 2017;114(13):3521–3526. doi:10.1073/pnas.1611835114. Original Figure 3, reproduced unchanged for noncommercial educational use.

The project asset plan records the applicable PNAS standard License to Publish educational reuse policy. This is not a CC license and does not cover commercial reuse. If the tutorial's distribution or purpose becomes commercial, replace the original figure with a new diagram or obtain permission before release.

## Figure 2 provenance

`public/images/figure-2.png` and `../../assets/figures/web/figure-2.png` are unchanged copies of `../../source-cache/figures/figure-2.png`. The complete Figure 2, including panels A–C, is preserved; no panel, label, data mark, or color was altered.

Kirkpatrick J, et al. *Overcoming catastrophic forgetting in neural networks.* Proceedings of the National Academy of Sciences. 2017;114(13):3521–3526. doi:10.1073/pnas.1611835114. Original Figure 2, reproduced unchanged for noncommercial educational use.

The project asset plan records the applicable PNAS standard License to Publish educational reuse policy. This is not a CC license and does not cover commercial reuse. If the tutorial's distribution or purpose becomes commercial, replace the original figure with a new diagram or obtain permission before release.
