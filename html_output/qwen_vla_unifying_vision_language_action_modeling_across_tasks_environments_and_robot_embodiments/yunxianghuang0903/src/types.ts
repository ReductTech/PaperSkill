// Data schema for a paper tutorial. The generator fills `src/data/tutorial.ts`
// with a `tutorial` object matching `TutorialData`. The `kind` fields are REQUIRED:
// validate-output.js counts chapters/modules via `kind: "chapter"` / `kind: "module"`
// so do not omit them.

export type Badge = 'inf' | 'trn' | 'both';

export interface Meta {
  titleEn: string;
  titleZh: string;
  /** Optional short display title for Hero h1 (defaults to parsing titleEn). */
  titleShort?: string;
  venue: string;
  authors: string;
  affiliation: string;
  domain: string;
  coreProblem: string;
  coreInsight: string;
  keywords: string[];
}

export interface FigureRef {
  src: string;
  caption?: string;
  alt?: string;
}

export interface HeroSide {
  desc: string;
  figure?: string;
  componentId?: string;
  /** Optional panel heading override. */
  panelHead?: string;
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
  /** Optional tiny English subtitle under module title. */
  titleShort?: string;
}

export interface Takeaway {
  icon: string;
  title: string;
  desc: string;
}

export interface ChapterDef {
  kind: 'chapter';
  id: string;
  title: string;
  badge: Badge;
  badgeLabel: string;
  bridge: string;
  analogy: AnalogyCard;
  modules: ModuleDef[];
  insight?: string;
  formula?: FormulaDef;
  takeaways: Takeaway[];
  /** Optional tiny English subtitle under chapter title. */
  subtitleEn?: string;
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
