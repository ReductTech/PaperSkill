import { chapters, type ChapterId } from './content';

export const V1_STORAGE = 'act2see-tutorial-v1';
export const V2_STORAGE = 'act2see-tutorial-v2';
export type TutorialProgress = {
  version: 2;
  unlocked: number;
  completed: number;
  activeId: ChapterId | null;
  review: boolean;
};
export const freshProgress = (): TutorialProgress => ({ version: 2, unlocked: 0, completed: 0, activeId: null, review: false });

const validCount = (value: unknown, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isChapterId = (value: unknown): value is ChapterId =>
  typeof value === 'string' && chapters.some(chapter => chapter.id === value);

export function parseV2(raw: string | null): TutorialProgress | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 2 || !validCount(value.unlocked, chapters.length) ||
      !validCount(value.completed, chapters.length) || value.completed > value.unlocked ||
      typeof value.review !== 'boolean' || (value.activeId !== null && !isChapterId(value.activeId))) return null;
    if (value.activeId !== null && chapters.findIndex(chapter => chapter.id === value.activeId) >= value.unlocked) return null;
    if (value.review && value.unlocked === 0) return null;
    return value as TutorialProgress;
  } catch { return null; }
}

// Each new chapter requires the listed old numbered chapters to have been reached.
// The prefix rule keeps navigation progressive even though old and new orders differ.
const oldRequirements: readonly (readonly number[])[] = [
  [1], [3], [3], [2, 7], [4, 5], [6], [8, 9, 11], [10], [12, 13],
];
function prefixReached(oldCount: number): number {
  let reached = 0;
  for (const required of oldRequirements) {
    if (!required.every(oldNumber => oldCount >= oldNumber)) break;
    reached++;
  }
  return reached;
}

export function migrateV1(raw: string | null): TutorialProgress | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || (value.version !== undefined && value.version !== 1) ||
      !validCount(value.unlocked, 13) || !validCount(value.completed, 13) ||
      value.completed > value.unlocked || (value.review !== undefined && typeof value.review !== 'boolean')) return null;
    const unlocked = prefixReached(value.unlocked);
    // Completion is capped below nine: a v1 Final view or quiz is never a v2 pass.
    const completed = Math.min(prefixReached(value.completed), Math.max(0, unlocked - 1), 8);
    return { version: 2, unlocked, completed, activeId: null, review: false };
  } catch { return null; }
}

export function loadProgress(): TutorialProgress {
  try {
    return parseV2(localStorage.getItem(V2_STORAGE)) ??
      migrateV1(localStorage.getItem(V1_STORAGE)) ?? freshProgress();
  } catch { return freshProgress(); }
}

export function saveProgress(progress: TutorialProgress): void {
  try { localStorage.setItem(V2_STORAGE, JSON.stringify(progress)); } catch { /* In-memory state remains usable. */ }
}
