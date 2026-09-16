export type Badge = "inf" | "trn" | "both";

export interface TutorialMeta {
  titleEn: string;
  titleZh: string;
  summary: string;
  keywords: string[];
}

export interface TutorialModule {
  kind: "module";
  id: string;
  title: string;
  description?: string;
  componentId: string;
}

export interface TutorialSurface {
  id: "hero" | "final";
  title: string;
  modules: TutorialModule[];
}

export interface TutorialChapter {
  kind: "chapter";
  id: string;
  title: string;
  badge: Badge;
  badgeLabel: string;
  bridge: string;
  modules: TutorialModule[];
}

export interface TutorialData {
  meta: TutorialMeta;
  landing: TutorialSurface;
  chapters: TutorialChapter[];
  final: TutorialSurface;
}
