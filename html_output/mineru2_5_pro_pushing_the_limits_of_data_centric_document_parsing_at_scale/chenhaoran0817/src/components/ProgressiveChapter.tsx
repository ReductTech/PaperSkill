import React from 'react';
import '../styles/chapter-unlock.css';

interface ProgressiveChapterProps {
  chapterId: string;
  step: number;
  title: string;
  previousId?: string | null;
  previousLabel?: string;
  className?: string;
  completed?: boolean;
  /** Chapters beyond the reveal frontier stay hidden (PaperSkill loader pattern). */
  hidden?: boolean;
  /** Flipping to true replays the reveal animation. */
  revealed?: boolean;
  children: React.ReactNode;
}

export function scrollToChapter(chapterId: string) {
  if (typeof window === 'undefined') return;
  const target = document.getElementById(chapterId);
  if (!target) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.history.replaceState(null, '', `#${chapterId}`);
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

/**
 * Renders one chapter in the reveal-on-scroll journey. Whether a chapter is
 * visible is controlled by the parent through `hidden`; the footer only
 * reports status and offers a way back — moving forward is the job of the
 * ChapterLoader sitting between chapters.
 */
export function ProgressiveChapter({
  chapterId,
  step,
  title,
  previousId = null,
  previousLabel,
  className = '',
  completed = false,
  hidden = false,
  revealed = true,
  children,
}: ProgressiveChapterProps) {
  const sectionClassName = [className, 'progressive-chapter'].filter(Boolean).join(' ');

  return (
    <section
      id={chapterId}
      className={sectionClassName}
      aria-label={`第 ${step} 步：${title}`}
      tabIndex={-1}
      hidden={hidden}
      data-revealed={revealed}
    >
      <div className="chapter-unlock-reveal">{children}</div>

      <footer className="chapter-unlock-footer" aria-label={`第 ${step} 步学习导航`}>
        <div>
          <span className="chapter-unlock-status" aria-hidden="true">{completed ? '✓' : '·'}</span>
          <p>
            <b>{completed ? '本章主操作已完成' : '本章尚未完成'}</b>
            <span id={`${chapterId}-unlock-reason`}>
              {completed
                ? '可以带着本章结论继续，也可以随时通过路线图回顾。'
                : '完成与否都不封锁后续章节；完成后会记录学习进度。'}
            </span>
          </p>
        </div>
        <div className="chapter-unlock-nav">
          {previousId ? (
            <a className="chapter-unlock-button is-secondary" href={`#${previousId}`}>
              <span aria-hidden="true">←</span>
              返回{previousLabel ? `：${previousLabel}` : '上一章'}
            </a>
          ) : null}
        </div>
      </footer>
    </section>
  );
}

export default ProgressiveChapter;
