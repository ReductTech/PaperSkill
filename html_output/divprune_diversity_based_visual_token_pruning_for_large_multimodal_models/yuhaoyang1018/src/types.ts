// Data schema for a paper tutorial. The generator fills `src/data/tutorial.ts`
// with a `tutorial` object matching `TutorialData`. The `kind` fields are REQUIRED:
// validate-output.js counts chapters/modules via `kind: "chapter"` / `kind: "module"`
// so do not omit them.
//
// 与官方模板的差异（详见 README「与官方模板的差异」）：本文件只做了“追加可选字段”，
// 模板原有字段全部保留，原有组件仍可通过类型检查。

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
  /** Relative path to a public/ file (e.g. "./images/fig1.png", never a root-absolute resource path) or an absolute URL. Optional. */
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

/** 内容口径标记：教学示意 / 公式外推 / 论文实测 / 代码事实 */
export type ContentTag = 'demo' | 'extrap' | 'paper' | 'code';

export interface ModuleDef {
  kind: 'module';
  id: string; // e.g. "1.1"
  title: string;
  desc: string;
  componentId: string; // MUST match a key in src/modules/registry.tsx
  figure?: string; // optional path/URL to a paper figure
  /** 追加：本模块包含的内容口径 */
  tags?: ContentTag[];
}

export interface Takeaway {
  icon: string; // emoji
  title: string;
  desc: string;
}

/** 追加：带论文位置标签的公式（公式 → 一句话直白解读 → 符号逐个说明） */
export interface FormulaX {
  /** 公式在论文中的真实编号或位置，例如 "Eq. (3)" 或 "Algorithm 1 · 第 15–20 行" */
  label: string;
  /** 指向 evidence 表的键 */
  evidence: string;
  /** 是否为论文编号公式；false 时页面会注明“非论文编号公式” */
  numbered: boolean;
  title: string;
  /** 公式 HTML；可交互符号用 <i data-s="键">…</i> 包裹，键需出现在 symbols 中 */
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
  blocks: DeepBlock[];
  /** 追加：折叠时也常驻显示的关键数字 */
  facts?: { value: string; label: string }[];
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
  /** 追加：章节导语（多段） */
  lead?: string[];
  /** 追加：模块之后的正文段落 */
  body?: string[];
  /** 追加：多个带编号的公式 */
  formulas?: FormulaX[];
  /** 追加：可折叠深读 */
  deepDives?: DeepDive[];
  /** 追加：易错点 */
  pitfalls?: string[];
  /** 追加：导航中显示的短标题 */
  short?: string;
  /** 追加：一条醒目的“核对”提示（论文表述与表格 / 代码不一致之处等） */
  check?: string;
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

/** 追加：证据定位芯片的数据 */
export interface EvidenceDef {
  label: string;
  source: 'main' | 'supp' | 'code' | 'ext';
  loc: string;
  content: string;
  url: string;
}

/** 追加：术语表条目 */
export interface GlossaryDef {
  term: string;
  en?: string;
  intuition: string;
  role: string;
}

/** 追加：结论分级 */
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

export interface HeroExtra {
  kicker: string;
  lines: string[];
  stats: { value: string; label: string; ev: string; tag: ContentTag }[];
  chips: string[];
}

export interface TutorialData {
  meta: Meta;
  hero: HeroConfig;
  chapters: ChapterDef[];
  bilibili?: BiliDef[];
  heroX?: HeroExtra;
  evidence?: Record<string, EvidenceDef>;
  glossary?: Record<string, GlossaryDef>;
  verdict?: VerdictGroup[];
  sources?: SourceLink[];
}
