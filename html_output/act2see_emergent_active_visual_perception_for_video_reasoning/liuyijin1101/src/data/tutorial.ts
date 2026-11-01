import { chapters } from '../content';
import { chapterBodies } from '../ChapterBodies';

// PaperSkill metadata references the existing chapter data and rendered modules.
export const tutorial = {
  chapters: [
    { kind: 'chapter', ...chapters[0], modules: [{ kind: 'module', id: chapters[0].id, content: chapterBodies[chapters[0].id] }] },
    { kind: 'chapter', ...chapters[1], modules: [{ kind: 'module', id: chapters[1].id, content: chapterBodies[chapters[1].id] }] },
    { kind: 'chapter', ...chapters[2], modules: [{ kind: 'module', id: chapters[2].id, content: chapterBodies[chapters[2].id] }] },
    { kind: 'chapter', ...chapters[3], modules: [{ kind: 'module', id: chapters[3].id, content: chapterBodies[chapters[3].id] }] },
    { kind: 'chapter', ...chapters[4], modules: [{ kind: 'module', id: chapters[4].id, content: chapterBodies[chapters[4].id] }] },
    { kind: 'chapter', ...chapters[5], modules: [{ kind: 'module', id: chapters[5].id, content: chapterBodies[chapters[5].id] }] },
    { kind: 'chapter', ...chapters[6], modules: [{ kind: 'module', id: chapters[6].id, content: chapterBodies[chapters[6].id] }] },
    { kind: 'chapter', ...chapters[7], modules: [{ kind: 'module', id: chapters[7].id, content: chapterBodies[chapters[7].id] }] },
    { kind: 'chapter', ...chapters[8], modules: [{ kind: 'module', id: chapters[8].id, content: chapterBodies[chapters[8].id] }] },
  ],
} as const;