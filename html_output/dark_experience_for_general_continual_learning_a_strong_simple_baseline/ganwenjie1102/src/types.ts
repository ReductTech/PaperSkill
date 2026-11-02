export interface TutorialMeta {
  readonly titleEn?: string;
  readonly titleZh?: string;
  readonly [field: string]: unknown;
}

export interface TutorialModule {
  readonly kind: "module";
  readonly id: string;
  readonly title: string;
  readonly desc?: string;
  readonly summary?: string;
  readonly componentId?: string;
  readonly [field: string]: unknown;
}

export interface TutorialChapter {
  readonly kind: "chapter";
  readonly id: string;
  readonly title: string;
  readonly summary?: string;
  readonly bridge?: string;
  readonly modules: readonly TutorialModule[];
  readonly [field: string]: unknown;
}

export interface TutorialData {
  readonly meta?: TutorialMeta;
  readonly chapters: readonly TutorialChapter[];
  readonly [field: string]: unknown;
}

export interface WidgetProps {
  readonly chapterId: string;
  readonly moduleId: string;
}
