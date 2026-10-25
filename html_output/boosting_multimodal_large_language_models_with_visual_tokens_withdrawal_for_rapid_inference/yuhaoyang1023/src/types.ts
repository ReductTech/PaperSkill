// Data schema for a paper tutorial. The generator fills `src/data/tutorial.ts`
// with a `tutorial` object matching `TutorialData`. The `kind` fields are REQUIRED:
// validate-output.js counts chapters/modules via `kind: "chapter"` / `kind: "module"`
// so do not omit them.

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

export interface HeroSide {
  title?: string; // Source-grounded method/concept name shown above the cover animation.
  desc: string;
  componentId: string; // Cover animation widget reads useCoverPlayback().
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

export interface ModuleDef {
  kind: 'module';
  id: string; // e.g. "1.1"
  title: string;
  desc: string;
  componentId: string; // MUST match a key in src/modules/registry.tsx
}

/** One independently composed slide with one learning objective. */
export interface SceneDef {
  id: string;
  title: string;
  goal: string;
  summary: string;
  interaction: string;
  next: string;
  notes: string;
  /** Body component receives a fixed 1472 × 622 CSS pixel region. */
  /** Every scene supplies its own paper-specific body widget. */
  componentId: string;
  moduleId?: string;
  thumbnail?: string;
}

export interface ChapterDef {
  kind: 'chapter';
  id: string; // e.g. "chap-1"
  title: string;
  modules: ModuleDef[]; // Empty for evidence/boundary-only chapters; method coverage is deck-wide.
  scenes: SceneDef[];
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
  /** Optional preview images keyed by scene ID, including cover/videos. */
  thumbnails?: Record<string, string>;
  meta: Meta;
  hero: HeroConfig;
  chapters: ChapterDef[];
  bilibili?: BiliDef[];
}

// ---------------------------------------------------------------------------
// 与官方模板的差异（详见 README「与官方模板的差异」）：以下全部为“追加的可选字段 / 新类型”，
// 模板原有字段保持不变，模板自带组件仍可通过类型检查。长滚动页面只读取这些追加字段。
// ---------------------------------------------------------------------------

/** 内容口径：教学示意 / 公式外推 / 论文实测 / 代码事实 */
export type ContentTag = 'demo' | 'extrap' | 'paper' | 'code';

export interface ModuleDef {
  /** 追加：本模块包含的内容口径 */
  tags?: ContentTag[];
  /** 追加：交互开始前的“试试看”提示（可以试什么） */
  try?: string;
  /** 追加：true 时放进章节底部的“还想深入？”抽屉，默认不展示 */
  fold?: boolean;
  /** 追加：本章的主角交互（版面更大） */
  core?: boolean;
}

/** 公式块：公式 → 一句话串讲 → 符号芯片 */
export interface FormulaX {
  /** 论文中的真实编号或位置，例如 "Eq. (5)"；非论文编号时 numbered = false */
  label: string;
  evidence: string;
  numbered: boolean;
  /** 公式 HTML；可交互符号用 <i data-s="键">…</i> 包裹 */
  html: string;
  plain: string;
  symbols: { key: string; sym: string; desc: string }[];
  note?: string;
}

export type DeepBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][]; caption?: string };

export interface DeepDive {
  title: string;
  /** 折叠时也常驻显示的关键数字 */
  facts?: { value: string; label: string }[];
  blocks: DeepBlock[];
}

export interface Takeaway {
  title: string;
  desc: string;
}

export interface ChapterDef {
  /** 追加：开篇一句直白的问题 */
  question?: string;
  /** 追加：版式。wide = 舞台通栏；split = 桌面端标题在左、舞台在右；stage = 标题压在舞台上方的居中大舞台 */
  layout?: 'wide' | 'split' | 'stage';
  short?: string;
  kicker?: string;
  bridge?: string;
  /** 展开抽屉里各部分的“问题式”入口（给初学者看的提问，而不是目录名） */
  asks?: { formulas?: string; check?: string; deep?: string; recap?: string; folded?: Record<string, string> };
  /** 只在难点章节使用；after 指定显示在哪个模块之后 */
  analogy?: { title: string; text: string; componentId: string; after?: string };
  formulas?: FormulaX[];
  check?: string;
  insight?: string;
  deepDives?: DeepDive[];
  takeaways?: Takeaway[];
  pitfalls?: string[];
}

export interface EvidenceDef {
  label: string;
  source: 'aaai' | 'arxiv' | 'code' | 'ext';
  loc: string;
  content: string;
  url: string;
}

export interface GlossaryDef {
  term: string;
  en?: string;
  intuition: string;
  role: string;
}

export interface VerdictItem {
  claim: string;
  basis: string;
}
export interface VerdictGroup {
  level: 'proven' | 'explained' | 'unknown';
  title: string;
  desc: string;
  items: VerdictItem[];
}

export interface SourceLink {
  label: string;
  url: string;
  note: string;
}

export interface RouteDef {
  id: string;
  title: string;
  who: string;
  stops: { target: string; label: string }[];
}

export interface HeroExtra {
  kicker: string;
  lines: string[];
  stats: { value: string; label: string; ev: string; tag: ContentTag }[];
}

export interface RetellItem {
  /** 提问（引导读者先自己说） */
  q: string;
  /** 参考说法（富文本） */
  a: string;
  /** 回看的章节锚点 */
  target: string;
  targetLabel: string;
}

export interface TutorialData {
  retell?: RetellItem[];
  heroX?: HeroExtra;
  routes?: RouteDef[];
  evidence?: Record<string, EvidenceDef>;
  glossary?: Record<string, GlossaryDef>;
  verdict?: VerdictGroup[];
  sources?: SourceLink[];
}
