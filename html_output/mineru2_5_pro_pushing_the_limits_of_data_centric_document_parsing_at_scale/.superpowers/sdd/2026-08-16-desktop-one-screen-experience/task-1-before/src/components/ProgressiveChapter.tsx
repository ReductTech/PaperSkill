import React, { createContext, useCallback, useContext, useMemo } from 'react';
import {
  type ChapterUnlockOptions,
  type ChapterUnlockState,
  useChapterUnlock,
} from '../hooks/useChapterUnlock';
import '../styles/chapter-unlock.css';

interface ChapterUnlockProviderProps extends ChapterUnlockOptions {
  chapterIds: readonly string[];
  children: React.ReactNode;
}

interface ProgressiveChapterProps {
  chapterId: string;
  step: number;
  title: string;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
  completed?: boolean;
  children: React.ReactNode;
  onUnlockNext?: (chapterId: string) => void;
}

interface ChapterUnlockResetProps {
  label?: string;
  className?: string;
  disabled?: boolean;
  onReset?: () => void;
}

const ChapterUnlockContext = createContext<ChapterUnlockState | null>(null);

export function ChapterUnlockProvider({
  chapterIds,
  children,
  storageKey,
  onUnlock,
  onReset,
}: ChapterUnlockProviderProps) {
  const state = useChapterUnlock(chapterIds, { storageKey, onUnlock, onReset });
  return <ChapterUnlockContext.Provider value={state}>{children}</ChapterUnlockContext.Provider>;
}

export function useChapterUnlockContext() {
  const state = useContext(ChapterUnlockContext);
  if (!state) {
    throw new Error('useChapterUnlockContext must be used inside ChapterUnlockProvider.');
  }
  return state;
}

function scrollToChapter(chapterId: string) {
  if (typeof window === 'undefined') return;
  const target = document.getElementById(chapterId);
  if (!target) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.history.replaceState(null, '', `#${chapterId}`);
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

/**
 * Renders either the real chapter or a compact, keyboard-accessible locked
 * placeholder. Unlocked content is never cloned, so existing PaperSkill
 * chapter/module definitions and component state stay intact.
 */
export function ProgressiveChapter({
  chapterId,
  step,
  title,
  previousLabel,
  nextLabel,
  className = '',
  completed = false,
  children,
  onUnlockNext,
}: ProgressiveChapterProps) {
  const { chapterIds, unlockedCount, isUnlocked, unlockNext } = useChapterUnlockContext();
  const chapterIndex = chapterIds.indexOf(chapterId);
  const previousId = chapterIndex > 0 ? chapterIds[chapterIndex - 1] : null;
  const nextId = chapterIndex >= 0 && chapterIndex < chapterIds.length - 1
    ? chapterIds[chapterIndex + 1]
    : null;
  const unlocked = isUnlocked(chapterId);
  const nextUnlocked = nextId ? isUnlocked(nextId) : false;
  const canAdvance = completed || nextUnlocked;
  const sectionClassName = [className, 'progressive-chapter', unlocked ? 'is-unlocked' : 'is-locked']
    .filter(Boolean)
    .join(' ');
  const lockedHeadingId = `${chapterId}-locked-title`;

  const advance = useCallback(() => {
    if (!nextId || !canAdvance) return;
    const destination = nextUnlocked ? nextId : unlockNext(chapterId);
    if (!destination) return;
    onUnlockNext?.(destination);
    window.requestAnimationFrame(() => scrollToChapter(destination));
  }, [canAdvance, chapterId, nextId, nextUnlocked, onUnlockNext, unlockNext]);

  // Only preview the next locked question. Later chapters stay out of the
  // document flow until their prerequisite has been completed.
  if (!unlocked && chapterIndex > unlockedCount) return null;

  if (!unlocked) {
    return (
      <section
        id={chapterId}
        className={sectionClassName}
        data-chapter-lock="locked"
        aria-labelledby={lockedHeadingId}
        tabIndex={-1}
      >
        <div className="chapter-locked-card">
          <div className="chapter-lock-icon" aria-hidden="true">
            <span />
          </div>
          <div className="chapter-locked-copy">
            <span className="chapter-lock-kicker">第 {step} 步 · 尚未解锁</span>
            <h2 id={lockedHeadingId}>{title}</h2>
            <p>先完成上一节的观察与实验，再沿研究问题继续推进。</p>
          </div>
          {previousId ? (
            <a className="chapter-unlock-button is-secondary" href={`#${previousId}`}>
              <span aria-hidden="true">←</span>
              返回{previousLabel ? `：${previousLabel}` : '上一章'}
            </a>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      id={chapterId}
      className={sectionClassName}
      data-chapter-lock="unlocked"
      aria-label={`第 ${step} 步：${title}`}
      tabIndex={-1}
    >
      <div className="chapter-unlock-reveal">{children}</div>

      <footer className="chapter-unlock-footer" aria-label={`第 ${step} 步学习导航`}>
        <div>
          <span className="chapter-unlock-status" aria-hidden="true">{completed || nextUnlocked ? '✓' : '·'}</span>
          <p>
            <b>{nextId ? (completed ? '本章主操作已完成' : nextUnlocked ? '下一章已解锁' : '本章尚未完成') : completed ? '研究路径已走完' : '完成最后一个主操作'}</b>
            <span id={`${chapterId}-unlock-reason`}>
              {nextId
                ? (canAdvance ? '准备好后，带着本章结论进入下一个问题。' : '完成本章主操作后继续')
                : (completed ? '你已完成全部章节，可以返回任意机制复习。' : '完成本章主操作后结束学习路径。')}
            </span>
          </p>
        </div>
        {nextId ? (
          <button
            type="button"
            className="chapter-unlock-button"
            onClick={advance}
            disabled={!canAdvance}
            aria-describedby={`${chapterId}-unlock-reason`}
          >
            {nextUnlocked ? '继续' : '完成并解锁'}{nextLabel ? `：${nextLabel}` : '下一章'}
            <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </footer>
    </section>
  );
}

export function ChapterUnlockReset({
  label = '重置章节进度',
  className = '',
  disabled,
  onReset,
}: ChapterUnlockResetProps) {
  const { chapterIds, unlockedCount, resetProgress } = useChapterUnlockContext();
  const resetDisabled = disabled ?? unlockedCount <= Math.min(1, chapterIds.length);
  const buttonClassName = ['chapter-unlock-reset', className].filter(Boolean).join(' ');

  const reset = useCallback(() => {
    resetProgress();
    onReset?.();
    const firstChapterId = chapterIds[0];
    if (firstChapterId) window.requestAnimationFrame(() => scrollToChapter(firstChapterId));
  }, [chapterIds, onReset, resetProgress]);

  return (
    <button type="button" className={buttonClassName} onClick={reset} disabled={resetDisabled}>
      <span aria-hidden="true">↺</span>
      {label}
    </button>
  );
}

/** Useful for rendering lock state in an existing top/side navigation. */
export function useChapterNavigationState() {
  const { chapterIds, unlockedCount, isUnlocked } = useChapterUnlockContext();
  return useMemo(() => ({ chapterIds, unlockedCount, isUnlocked }), [chapterIds, unlockedCount, isUnlocked]);
}
