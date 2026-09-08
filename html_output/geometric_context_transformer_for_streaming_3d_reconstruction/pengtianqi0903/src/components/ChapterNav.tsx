import { useEffect, useRef } from 'react';
import type { ChapterDef } from '../types';

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export function ChapterNav({
  chapters,
  revealed,
  activeIndex,
}: {
  chapters: ChapterDef[];
  revealed: number;
  activeIndex: number;
}) {
  const navInnerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const container = navInnerRef.current;
    const activeStep = stepRefs.current[activeIndex];
    if (!container || !activeStep || container.scrollWidth <= container.clientWidth) return;

    const containerRect = container.getBoundingClientRect();
    const stepRect = activeStep.getBoundingClientRect();
    const centeredLeft =
      container.scrollLeft +
      stepRect.left -
      containerRect.left -
      (container.clientWidth - stepRect.width) / 2;

    container.scrollTo({
      left: Math.max(0, centeredLeft),
      behavior: preferredScrollBehavior(),
    });
  }, [activeIndex, revealed]);

  const jumpTo = (index: number) => {
    if (index >= revealed) return;
    document.getElementById(chapters[index].id)?.scrollIntoView({
      behavior: preferredScrollBehavior(),
      block: 'start',
    });
  };

  return (
    <nav className="chapter-nav" aria-label="论文教程章节导航">
      <div className="chapter-nav-inner" ref={navInnerRef}>
        {chapters.map((chapter, index) => {
          const unlocked = index < revealed;
          const active = unlocked && index === activeIndex;
          return (
            <button
              type="button"
              key={chapter.id}
              ref={(node) => {
                stepRefs.current[index] = node;
              }}
              className={`chapter-nav-step ${active ? 'active' : ''} ${unlocked ? 'unlocked' : 'locked'}`}
              disabled={!unlocked}
              aria-current={active ? 'step' : undefined}
              aria-label={`${unlocked ? '跳转到' : '尚未解锁'}第${index + 1}章：${chapter.navTitle}`}
              onClick={() => jumpTo(index)}
            >
              <span className="chapter-nav-index">{unlocked ? `§${index + 1}` : '🔒'}</span>
              <span className="chapter-nav-copy">
                <strong>{chapter.navTitle}</strong>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
