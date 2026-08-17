import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ChapterUnlockProvider, ProgressiveChapter } from './ProgressiveChapter';

const CHAPTER_IDS = ['step-1', 'step-2'] as const;
const STORAGE_KEY = 'progressive-chapter.test';

function renderChapters(completed = false) {
  return render(
    <ChapterUnlockProvider chapterIds={CHAPTER_IDS} storageKey={STORAGE_KEY}>
      <ProgressiveChapter
        chapterId="step-1"
        step={1}
        title="为什么数据会成为瓶颈？"
        nextLabel="挑选数据"
        completed={completed}
      >
        <p>第一章内容</p>
      </ProgressiveChapter>
      <ProgressiveChapter
        chapterId="step-2"
        step={2}
        title="如何挑对数据？"
        previousLabel="发现瓶颈"
      >
        <p>第二章内容</p>
      </ProgressiveChapter>
    </ChapterUnlockProvider>,
  );
}

afterEach(() => {
  window.localStorage.removeItem(STORAGE_KEY);
  window.history.replaceState(null, '', '/');
});

describe('ProgressiveChapter completion gate', () => {
  it('keeps the next action disabled and explains the missing main action', async () => {
    const user = userEvent.setup();
    renderChapters(false);

    const next = screen.getByRole('button', { name: /完成并解锁：挑选数据/ });
    expect(next).toBeDisabled();
    expect(next).toHaveAccessibleDescription('完成本章主操作后继续');

    await user.click(next);
    expect(screen.queryByText('第二章内容')).not.toBeInTheDocument();
  });

  it('enables the next action after the chapter experience completes', async () => {
    const user = userEvent.setup();
    renderChapters(true);

    const next = screen.getByRole('button', { name: /完成并解锁：挑选数据/ });
    expect(next).toBeEnabled();
    await user.click(next);
    expect(await screen.findByText('第二章内容')).toBeVisible();
  });

  it('allows continuing when saved unlock progress already contains the next chapter', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      unlockedIds: ['step-1', 'step-2'],
    }));

    renderChapters(false);

    expect(screen.getByRole('button', { name: /继续：挑选数据/ })).toBeEnabled();
    expect(screen.getByText('第二章内容')).toBeVisible();
  });
});
