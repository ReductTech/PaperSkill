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
  /** Relative path to a public/ file (e.g. "./images/fig1.png") or an absolute URL. Optional. */
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
  hero: HeroConfig;
  chapters: ChapterDef[];
  bilibili?: BiliDef[];
}

// ============================================================================
//  Extended paper-skill data: quiz, comics, figure index, symbol cards
//  (Habitat specialization). Optional additions on top of the base schema.
// ============================================================================

export type QuizType = 'single' | 'multi' | 'judge' | 'order' | 'match' | 'fill';

export interface QuizOption {
  label: string;
  correct?: boolean;
  /** Wrong-type tag for distractors (偷换概念 / 扩大范围 / ...) */
  why?: string;
}

export interface QuizDef {
  id: string;
  chapterId: string;
  difficulty: 1 | 2 | 3; // ★☆☆ / ★★☆ / ★★★
  type: QuizType;
  q: string;
  options?: QuizOption[]; // single/multi/judge
  /** order/match/fill custom data */
  order?: string[];
  matchPairs?: { left: string; right: string }[];
  fill?: string;
  answer?: string; // correct answer text / explanation key
  judge?: boolean;
  explanation: string; // 判据 + 逐项 + 论文锚点
  anchor?: string; // paper locator
}

export interface ComicDef {
  id: string;
  chapterId: string;
  title: string;
  src: string; // ./images/comics/...
  caption: string;
  /** vertical strip layout */
  strip?: boolean;
}

export interface FigureItem {
  id: string; // fig-1 ... tab-2
  type: 'figure' | 'table';
  number: string; // "Figure 2" / "Table 1"
  title: string; // original caption (中文简述 + EN)
  page: number;
  chapter: number;
  keywords: string[];
  description: string;
  imagePath?: string; // figure bitmap path
  relatedConcepts: string[];
  /** true if rebuilt from semantics (原图为矢量) */
  rebuilt?: boolean;
  tableRows?: string[][]; // optional structured data for tables
  tableHead?: string[];
}

export interface SymbolCard {
  sym: string;
  name: string; // EN name
  zh: string; // 中文译名
  def: string; // paper definition (≤50字)
  intuition: string; // 解读 (标注"解读")
  icon: string; // emoji
  rel: string[]; // related symbols
  category: string; // 任务 / 传感器 / 指标 / 算法
  locator: string; // page/§ anchor
}
