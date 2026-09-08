import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProgressiveChapter } from './ProgressiveChapter';

function renderChapters(completed = false, hideSecond = true) {
  return render(
    <>
      <ProgressiveChapter
        chapterId="step-1"
        step={1}
        title="为什么数据会成为瓶颈？"
        completed={completed}
      >
        <p>第一章内容</p>
      </ProgressiveChapter>
      <ProgressiveChapter
        chapterId="step-2"
        step={2}
        title="如何挑对数据？"
        previousId="step-1"
        previousLabel="发现瓶颈"
        hidden={hideSecond}
        revealed={!hideSecond}
      >
        <p>第二章内容</p>
      </ProgressiveChapter>
    </>,
  );
}

afterEach(() => {
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});

describe('ProgressiveChapter reveal model', () => {
  it('hides chapters beyond the frontier and marks revealed ones for animation', () => {
    renderChapters(false);

    const first = document.getElementById('step-1');
    const second = document.getElementById('step-2');
    expect(first).not.toHaveAttribute('hidden');
    expect(first).toHaveAttribute('data-revealed', 'true');
    expect(second).toHaveAttribute('hidden');
    expect(second).toHaveAttribute('data-revealed', 'false');
    expect(screen.queryByText(/尚未解锁/)).not.toBeInTheDocument();
    expect(document.querySelector('.chapter-locked-card')).toBeNull();
  });

  it('leaves forward navigation to the loader instead of an in-chapter button', () => {
    renderChapters(false, false);

    expect(screen.queryByRole('button', { name: /进入下一章/ })).not.toBeInTheDocument();
    expect(screen.getAllByText('本章尚未完成')).toHaveLength(2);
    expect(screen.getAllByText('完成与否都不封锁后续章节；完成后会记录学习进度。')).toHaveLength(2);
  });

  it('marks the chapter status once the main action is complete', () => {
    const { container } = renderChapters(true, false);

    expect(container.querySelector('.chapter-unlock-status')).toHaveTextContent('✓');
    expect(screen.getByText('本章主操作已完成')).toBeVisible();
    expect(screen.getByText('可以带着本章结论继续，也可以随时通过路线图回顾。')).toBeVisible();
    expect(screen.getByText('本章尚未完成')).toBeVisible();
  });

  it('links back to the previous chapter from later chapters', () => {
    renderChapters(false, false);

    const back = screen.getByRole('link', { name: /返回：发现瓶颈/ });
    expect(back).toHaveAttribute('href', '#step-1');
  });
});
