import type { ChapterDef } from '../types';

export type JourneyNodeState = 'done' | 'open' | 'frontier' | 'upcoming';

function nodeState(index: number, maxRevealed: number, done: boolean): JourneyNodeState {
  if (index <= maxRevealed) return done ? 'done' : 'open';
  return index === maxRevealed + 1 ? 'frontier' : 'upcoming';
}

const STATE_ACTION: Record<JourneyNodeState, string> = {
  done: '复习',
  open: '回到',
  frontier: '揭示并进入',
  upcoming: '直接跳到',
};

/**
 * Clickable route map for the six-chapter journey. Nodes reflect the reveal
 * frontier and local completion; clicking any node reveals the whole prefix
 * (no locking) and scrolls there.
 */
export function JourneyMap({
  chapters,
  maxRevealed,
  completed,
  onJump,
}: {
  chapters: readonly ChapterDef[];
  maxRevealed: number;
  completed: (chapterId: string) => boolean;
  onJump: (index: number) => void;
}) {
  return (
    <nav className="journey-map" aria-label="学习路线图">
      <header>
        <h2>学习路线</h2>
        <span>点击任意节点，直接抵达对应章节</span>
      </header>
      <ol className="journey-track">
        {chapters.map((chapter, index) => {
          const state = nodeState(index, maxRevealed, completed(chapter.id));
          return (
            <li key={chapter.id} className="journey-node" data-state={state}>
              <button
                type="button"
                onClick={() => onJump(index)}
                aria-label={`${STATE_ACTION[state]}第 ${chapter.step} 章：${chapter.shortLabel}`}
                aria-current={state === 'frontier' ? 'step' : undefined}
              >
                {state === 'done' ? '✓' : chapter.step}
              </button>
              <span>{chapter.shortLabel}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default JourneyMap;
