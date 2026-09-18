// ============================================================
// 旧版教程（paperjury_tutorial）移入组件的类型定义
// 仅服务 src/modules/ 下的 legacy 组件，与模板 types.ts 互不干扰
// ============================================================

// ----- 测验 -----
export type QuizType = 'single' | 'multiple' | 'judge' | 'sort' | 'match' | 'fill';

export interface QuizOption {
  key: string; // A/B/C/D 或 对/错
  text: string;
  isCorrect?: boolean;
  errorType?: string;
  explanation?: string;
}

export interface SortItem {
  id: string;
  text: string;
  correctOrder: number; // 正确位置（从0开始）
}

export interface MatchPair {
  leftId: string;
  leftText: string;
  rightId: string;
  rightText: string;
}

export interface FillBlank {
  id: string;
  prefix: string;
  answer: string;
  alternatives?: string[];
  suffix?: string;
}

export interface Quiz {
  id: string;
  type: QuizType;
  position: 'opening' | 'middle' | 'ending';
  difficulty: 1 | 2 | 3;
  question: string;
  options?: QuizOption[];
  sortItems?: SortItem[];
  matchPairs?: MatchPair[];
  blanks?: FillBlank[];
  analysis: string;
  paperAnchor: string;
}

// ----- 漫画 -----
export interface Comic {
  id: string;
  title: string;
  caption: string;
  imagePath: string;
  concept: string;
}

// ----- 交互式动画演示 -----
export interface AnimationElement {
  id: string;
  label: string;
  x: number; // 百分比位置 0-100
  y: number;
  type: 'box' | 'circle' | 'arrow' | 'diamond';
  state?: 'pending' | 'active' | 'done' | 'error';
}

export interface AnimationConnection {
  from: string;
  to: string;
  label?: string;
}

export interface AnimationStep {
  title: string;
  description: string;
  elements: AnimationElement[];
  connections?: AnimationConnection[];
}

export interface InteractiveAnimation {
  id: string;
  title: string;
  description: string;
  steps: AnimationStep[];
  concept: string;
}

// ----- 论文图表索引 -----
export interface FigureItem {
  id: string;
  type: 'figure' | 'table';
  number: string;
  title: string;
  page: number;
  chapter: number;
  keywords: string[];
  description: string;
  imagePath?: string;
  relatedConcepts: string[];
}

// ----- 符号概念卡片 -----
export interface SymbolItem {
  id: string;
  symbol: string;
  name: string;
  nameZh: string;
  paperDefinition: string;
  intuition: string;
  icon: string;
  category: string;
  page: number;
  related: string[];
}
