export type TutorialBlock =
  | { kind: 'chapter'; id: string; title: string }
  | { kind: 'module'; componentId: string; chapterId: string }

export interface TutorialManifest {
  title: string
  blocks: TutorialBlock[]
}
