import React, { useEffect, useState } from 'react';

type TocChapter = {
  id: string;
  title: string;
};

export function ChapterToc({
  chapters,
  revealed,
  onNavigate,
}: {
  chapters: TocChapter[];
  revealed: number;
  onNavigate: (index: number) => void;
}) {
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? '');

  useEffect(() => {
    if (revealed < 1) return;
    const updateActive = () => {
      const readingLine = window.innerHeight * 0.3;
      let current = chapters[0]?.id ?? '';
      chapters.slice(0, revealed).forEach((chapter) => {
        const element = document.getElementById(chapter.id);
        if (element && element.getBoundingClientRect().top <= readingLine) {
          current = chapter.id;
        }
      });
      setActiveId(current);
    };
    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
    return () => {
      window.removeEventListener('scroll', updateActive);
      window.removeEventListener('resize', updateActive);
    };
  }, [chapters, revealed]);

  return (
    <aside className="chapter-toc" aria-label="章节目录" tabIndex={0}>
      <ol className="chapter-toc-list">
        {chapters.map((chapter, index) => {
          const isRevealed = index < revealed;
          const isActive = isRevealed && chapter.id === activeId;
          return (
            <li key={chapter.id}>
              <button
                type="button"
                className={`chapter-toc-link${isRevealed ? ' is-revealed' : ''}${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'location' : undefined}
                aria-label={`跳转到§${index + 1}：${chapter.title}`}
                onClick={() => onNavigate(index)}
              >
                <span className="chapter-toc-index">§{index + 1}</span>
                <span className="chapter-toc-title">{chapter.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

export default ChapterToc;
