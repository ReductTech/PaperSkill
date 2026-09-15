// Data schema for a paper tutorial. The generator fills `src/data/tutorial.ts`
// with a `tutorial` object matching `TutorialData`. The `kind` fields are REQUIRED:
// validate-output.js counts chapters/modules via `kind: "chapter"` / `kind: "module"`
// so do not omit them.

export type Badge = 'inf' | 'trn' | 'both';

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
  pointCloud?: HeroSide; // optional middle: original photo + reconstructed point cloud
  newMethod: HeroSide;
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
  analogy: AnalogyCard;
  modules: ModuleDef[];
  insight?: string;
  formula?: FormulaDef;
  takeaways: Takeaway[];
  /** One-line teaser shown on the "next chapter" button, foreshadowing what's next. */
  nextTeaser?: string;
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

/** A single row in the "darkroom metaphor" overview map (photography ↔ paper). */
export interface DarkroomStep {
  stage: string; // photography stage label, e.g. "拍坏了"
  metaphor: string; // the analogy itself, e.g. "糊掉的照片"
  concept: string; // the paper concept it maps to, e.g. "运动模糊退化"
  chapter: string; // which chapter, e.g. "§1"
}

export interface TutorialData {
  meta: Meta;
  hero: HeroConfig;
  /** Optional one-time overview that decodes the recurring darkroom/photography metaphor. */
  darkroom?: {
    lead: string; // a short lead-in paragraph
    steps: DarkroomStep[]; // the metaphor → paper mapping table
  };
  chapters: ChapterDef[];
  bilibili?: BiliDef[];
}
