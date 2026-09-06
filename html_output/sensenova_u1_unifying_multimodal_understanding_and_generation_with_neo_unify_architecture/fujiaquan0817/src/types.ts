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
  /** Path under public/ (e.g. "/images/fig1.png") or an absolute URL. Optional. */
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
  latex: string; // canonical LaTeX source for review / accessibility
  mathml: string; // dependency-free semantic rendering generated from the LaTeX source
  symbols: SymbolDef[];
  /** Use one item per equation when a chapter explains a causal chain or several losses. */
  items?: FormulaItem[];
  /** Presentation only; leaves the paper formula itself untouched. */
  layout?: 'cfg';
}

export interface FormulaItem {
  label: string;
  latex: string;
  mathml: string;
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
  /** A formal expression belongs immediately after the module that uses it. */
  formula?: FormulaDef;
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
  /** Module id that should render the chapter's retained formula. */
  formulaModuleId?: string;
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
