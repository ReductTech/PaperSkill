/* 共享类型声明：演示deck的章节/模块结构，供 src/data/tutorial.ts 使用 */

/** 交互模块：一个可自动播放/可操作的演示组件 */
export interface DeckModule {
  kind: "module";
  id: string;
  title: string;
  /** 对应 src/modules/registry.tsx 中 widgetRegistry 的注册键 */
  componentId: string;
  /** 是否无需点击、自动循环演示 */
  autoplay: boolean;
}

/** 章节：PPT 模式下的最小放映单元（一幕可含 1-2 节） */
export interface DeckChapter {
  kind: "chapter";
  id: string;
  /** 幕号，如 "01"、"03A" */
  act: string;
  title: string;
  /** 本节问题：一屏只问一个问题 */
  question: string;
  modules: DeckModule[];
}

/** 教程整体结构 */
export interface TutorialData {
  meta: {
    titleEn: string;
    titleZh: string;
    venue: string;
    paperUrl: string;
    coreProblem: string;
    coreInsight: string;
  };
  chapters: DeckChapter[];
}
