// Data schema for a paper tutorial. The generator fills `src/data/tutorial.ts`
// with a `tutorial` object matching `TutorialData`. The `kind` fields are REQUIRED:
// validate-output.js counts chapters/modules via `kind: "chapter"` / `kind: "module"`
// so do not omit them.

export type Badge = 'inf' | 'trn' | 'both' | 'prob' | 'obs' | 'eval' | 'val' | 'con' | 'sum' | 'qa' | 'limit' | 'ref' | 'exp';

export interface Meta {
  titleEn: string;
  titleZh: string;
  venue: string;
  authors: string;
  affiliation: string;
  domain: string;
  coreProblem: string;
  coreInsight: string;
  keywords: string[];
}

export interface FigureRef {
  /** Path under public/ (e.g. "./images/fig1.png") or an absolute URL. Optional. */
  src: string;
  caption?: string;
  alt?: string;
}

export interface HeroSide {
  desc: string;
  figure?: string; // optional path/URL to the paper's original figure
  componentId?: string; // optional canvas widget id registered in src/modules/registry.tsx
}

export interface HeroConfig {
  oldMethod: HeroSide;
  newMethod: HeroSide;
}

export interface HeroInnovation {
  icon: string; // emoji or short label
  /** Short title (the part before the first colon in the user-supplied text). */
  name: string;
  /** The remaining explanation/purpose (the part after the first colon). */
  body: string;
  color?: string; // optional accent color token (e.g. "blue" / "orange")
}

export interface DualHeroPage {
  title: string; // 页面标题（含"考场/评估方法"等隐喻）
  intro: string; // 直接简要说明这是什么
  innovations: HeroInnovation[]; // 3 项左右
  componentId?: string; // optional widget id for the small visualization below
  figCaption?: string; // 可选：图说
}

export interface DualHero {
  pages: [DualHeroPage, DualHeroPage]; // exactly 2 pages, click title to toggle
}

export interface SymbolDef {
  sym: string;
  desc: string;
}

export interface FormulaDef {
  lead: string; // plain-language lead-in (Simplified Chinese)
  unicode: string; // Unicode/HTML formula, no KaTeX
  symbols: SymbolDef[];
}

export interface AnalogyCard {
  title: string;
  text: string;
  figure?: string; // optional path/URL to a paper figure
  componentId?: string; // optional canvas widget id for the life-metaphor animation
}

export interface ModuleDef {
  kind: 'module';
  id: string; // e.g. "1.1"
  title: string;
  desc: string;
  componentId: string; // MUST match a key in src/modules/registry.tsx
  figure?: string; // optional path/URL to a paper figure
}

export interface Takeaway {
  icon: string; // emoji
  title: string;
  desc: string;
}

export interface ChapterDef {
  kind: 'chapter';
  id: string; // e.g. "chap-1"
  title: string;
  badge: Badge;
  badgeLabel: string;
  bridge: string; // "本节作用" copy
  bridgeLabel?: string; // override the small heading above bridge text; defaults to "本节作用"
  analogy?: AnalogyCard;
  modules: ModuleDef[];
  insight?: string;
  formula?: FormulaDef;
  takeaways?: Takeaway[];
}

export interface BiliDef {
  bvid: string; // "BV..." or "" if unused
  title: string;
  reason: string;
  /** Optional static cover URL (https). Baked in at generation time so the cover
   *  shows without depending on the runtime Bilibili metadata fetch. */
  cover?: string;
  /** Optional static view count string (e.g. "41.5万播放"), baked in at generation
   *  time so 播放量 shows without depending on the runtime metadata fetch. */
  views?: string;
}

export interface TutorialData {
  meta: Meta;
  /** Backward-compatible single-column hero (old vs new). Used only when
   *  `dualHero` is not set. */
  hero: HeroConfig;
  /** Optional dual-page hero with click-to-toggle. When present it takes
   *  precedence over `hero`. Each page may carry an optional widget and
   *  a list of innovation cards drawn from the paper's contributions. */
  dualHero?: DualHero;
  chapters: ChapterDef[];
  bilibili?: BiliDef[];
}
