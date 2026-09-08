// ============================================================================
//  elf_example — 占位类型声明（paper-skill 结构兼容文件）
//
//  重要说明：本教程是从单个 HTML 成品网页迁移而来的"示例网页"，
//  实际渲染走 src/data/_*.html 片段 + src/lib/elf-engine.js 引擎，
//  并不使用本文件定义的数据结构。此文件仅用于通过仓库结构校验
//  （validate-repository.js / validate-output.js 要求存在 src/types.ts），
//  内容保留 paper-skill 标准类型声明，勿删除。
// ============================================================================

/** 章节徽章：inf = 基础 / trn = 训练 / both = 通用 */
export type Badge = 'inf' | 'trn' | 'both';

/** 论文元信息 */
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

/** 图片引用（可选） */
export interface FigureRef {
  src: string;
  caption?: string;
  alt?: string;
}

/** Hero 单侧 */
export interface HeroSide {
  desc: string;
  figure?: string;
  componentId?: string;
}

/** Hero 两栏对比 */
export interface HeroConfig {
  oldMethod: HeroSide;
  newMethod: HeroSide;
}

/** 公式符号 */
export interface SymbolDef {
  sym: string;
  desc: string;
}

/** 公式块 */
export interface FormulaDef {
  lead: string;
  unicode: string;
  symbols: SymbolDef[];
}

/** 类比卡片 */
export interface AnalogyCard {
  title: string;
  text: string;
  figure?: string;
  componentId?: string;
}

/** 交互模块 */
export interface ModuleDef {
  kind: 'module';
  id: string;
  title: string;
  desc: string;
  componentId: string;
  figure?: string;
}

/** 章节要点 */
export interface Takeaway {
  icon: string;
  title: string;
  desc: string;
}

/** 章节定义 */
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
}

/** B 站视频 */
export interface BiliDef {
  bvid: string;
  title: string;
  reason: string;
  cover?: string;
  views?: string;
}

/** 教程数据（本迁移项目不使用，仅结构兼容） */
export interface TutorialData {
  meta: Meta;
  hero: HeroConfig;
  chapters: ChapterDef[];
  bilibili?: BiliDef[];
}
