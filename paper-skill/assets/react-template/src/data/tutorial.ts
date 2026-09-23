import type { TutorialData } from '../types';

// ============================================================================
//  PAPER-SPECIFIC CONTENT — the ONLY data file the generator rewrites.
//  Replace every `__XXX__` with real, paper-specific Simplified Chinese content.
//  Keep the `kind: "chapter"` / `kind: "module"` fields (validate-output.js counts
//  them). Every `componentId` MUST be registered in ../modules/registry.tsx.
//  Figures (`figure`) are OPTIONAL — use a RELATIVE path to a public/ file
//  (e.g. "./images/fig1.png"; never "/images/fig1.png", which 404s under the deploy
//  sub-path) or an absolute URL, or omit the field.
// ============================================================================

export const tutorial: TutorialData = {
  meta: {
    titleEn: '__PAPER_TITLE_EN__',
    titleZh: '__PAPER_TITLE_ZH__',
    venue: '__VENUE_YEAR__',
    authors: '__AUTHORS__',
    affiliation: '__AFFILIATION__',
    domain: '__DOMAIN__',
    coreProblem: '__CORE_PROBLEM__',
    coreInsight: '__CORE_INSIGHT__',
    keywords: ['__TAG_1__', '__TAG_2__', '__TAG_3__'],
  },
  hero: {
    oldMethod: { desc: '__OLD_METHOD_DESC__', figure: undefined, componentId: 'example-slider' },
    newMethod: { desc: '__NEW_METHOD_DESC__', figure: undefined, componentId: 'example-slider' },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '__CH1_TITLE__',
      badge: 'inf',
      badgeLabel: '__CH1_BADGE_LABEL__',
      bridge: '__CH1_BRIDGE_TEXT__',
      analogy: { title: '__CH1_ANA_TITLE__', text: '__CH1_ANA_TEXT__', componentId: 'example-slider' },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '__CH1_MOD1_TITLE__',
          desc: '__CH1_MOD1_DESC__',
          componentId: 'example-slider',
        },
      ],
      insight: '__CH1_INSIGHT_TEXT__',
      formula: {
        lead: '__CH1_FORMULA_LEAD__',
        unicode: '__CH1_FORMULA__',
        symbols: [{ sym: '__CH1_SYM_1__', desc: '__CH1_SYM_1_MEANING__' }],
      },
      takeaways: [
        { icon: '🎯', title: '__POINT1_T__', desc: '__POINT1_D__' },
        { icon: '🔧', title: '__POINT2_T__', desc: '__POINT2_D__' },
        { icon: '✨', title: '__POINT3_T__', desc: '__POINT3_D__' },
      ],
    },
    // TODO: expand to the full chapterCount (6–10). Each chapter needs kind:"chapter"
    // and every module needs kind:"module" + a registered componentId.
  ],
  bilibili: [
    { bvid: '__BVID_1__', title: '__BVID_1_TITLE__', reason: '__BVID_1_REASON__' },
  ],
};
