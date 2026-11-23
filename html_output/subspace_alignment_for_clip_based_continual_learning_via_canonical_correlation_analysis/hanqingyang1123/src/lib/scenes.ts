import type { ChapterDef, SceneDef, TutorialData } from '../types';
export interface DeckPage extends Omit<SceneDef, 'componentId'> {
  componentId?: string; // Cover and video pages are rendered by dedicated framework components.
  chapter?: ChapterDef;
  special?: 'cover' | 'videos';
}
export function buildDeck(data: TutorialData): DeckPage[] {
  const pages: DeckPage[] = [{ id: 'cover', title: data.meta.titleZh, goal: data.meta.coreProblem,
    summary: data.meta.coreInsight, interaction: '认识问题', next: '', notes: data.meta.coreInsight, special: 'cover' }];
  for (const chapter of data.chapters) {
    pages.push(...chapter.scenes.map(scene => ({ ...scene, chapter })));
  }
  if (data.bilibili?.some(item => item.bvid)) pages.push({ id: 'videos', title: '延伸阅读与视频', goal: '继续探索',
    summary: '将直觉连接到更多解释', interaction: '打开视频', next: '', notes: '', special: 'videos' });
  return pages.map(page => ({ ...page, thumbnail: page.thumbnail || data.thumbnails?.[page.id] }));
}
