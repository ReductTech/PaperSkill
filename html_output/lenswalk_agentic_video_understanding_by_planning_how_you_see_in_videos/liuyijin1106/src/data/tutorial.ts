import { chapters } from '../content';

// Reuse the ten chapters shown by App; keep PaperSkill metadata tied to the live content.
export const tutorial = {
  chapters: chapters.map((chapter) => ({
    kind: 'chapter' as const,
    ...chapter,
    modules: [chapter.id === 'benchmarks'
      ? { kind: 'module' as const, id: chapter.id, componentId: 'S9Benchmarks' }
      : chapter.id === 'results'
        ? { kind: 'module' as const, id: chapter.id, componentId: 'S10Analysis' }
        : { kind: 'module' as const, id: chapter.id, componentId: 'LessonModule' }],
  })),
} as const;
