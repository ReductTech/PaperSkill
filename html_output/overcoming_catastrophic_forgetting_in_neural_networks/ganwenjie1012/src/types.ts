/** Descriptive release metadata for the existing EWC tutorial pages. */
export interface ReleaseModule {
  readonly kind: "module";
  readonly id: string;
  readonly title: string;
  readonly summary: string;
}

export interface ReleaseChapter {
  readonly kind: "chapter";
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly modules: readonly ReleaseModule[];
}

export interface ReleaseTutorial {
  readonly title: string;
  readonly description: string;
  readonly chapters: readonly ReleaseChapter[];
}
