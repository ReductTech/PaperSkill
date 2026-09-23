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
  links?: { label: string; url: string }[];
}

export interface FigureRef {
  /** Path under public/ (e.g. "./images/fig1.png") or an absolute URL. Optional. */
  src: string;
  caption?: string;
  alt?: string;
}

export interface HeroSide {
  desc: string;
  points?: string[];
  figure?: string;
  componentId?: string;
}

export interface HeroConfig {
  oldMethod: HeroSide;
  newMethod: HeroSide;
}

export interface SymbolDef {
  sym: string;
  desc: string;
}

export interface FormulaDef {
  lead: string;
  unicode: string;
  symbols: SymbolDef[];
}

export interface AnalogyCard {
  title: string;
  text: string;
  figure?: string;
  componentId?: string;
}

export interface ModuleDef {
  kind: 'module';
  id: string;
  title: string;
  desc: string;
  componentId: string;
  figure?: string;
}

export interface Takeaway {
  icon: string;
  title: string;
  desc: string;
}

/** One readable teaching paragraph block inside a chapter. */
export interface ProseBlock {
  heading: string;
  body: string; // may contain <b>/<code> inline HTML (skill-generated, trusted)
}

export interface ChapterDef {
  kind: 'chapter';
  id: string;
  title: string;
  badge: Badge;
  badgeLabel: string;
  bridge: string;
  analogy: AnalogyCard;
  prose?: ProseBlock[];
  modules: ModuleDef[];
  insight?: string;
  formula?: FormulaDef;
  takeaways: Takeaway[];
}

export interface BiliDef {
  bvid: string;
  title: string;
  reason: string;
  cover?: string;
  views?: string;
}

export interface TutorialData {
  meta: Meta;
  hero: HeroConfig;
  chapters: ChapterDef[];
  bilibili?: BiliDef[];
}
