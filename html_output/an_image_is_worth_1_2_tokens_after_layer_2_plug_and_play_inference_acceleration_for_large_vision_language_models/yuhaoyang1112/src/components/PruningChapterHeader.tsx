import type { MouseEvent } from 'react';
import type { ChapterDef } from '../types';
import '../styles/chapter5-sample.css';

export function PruningChapterHeader({
  ch,
  chapters,
  go,
}: {
  ch: ChapterDef;
  chapters: ChapterDef[];
  go: (id: string) => void;
}) {
  function jump(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go(event.currentTarget.hash.slice(1));
  }

  return (
    <header className="pruning-intro">
      <h2 id={ch.id + '-title'}><span>§5</span> {ch.title}</h2>
      <nav className="pruning-progress" aria-label="章节进度">
        <span aria-hidden="true">章节进度</span>
        <ol>
          {chapters.map((chapter, i) => (
            <li key={chapter.id}>
              <a
                href={'#' + chapter.id}
                onClick={jump}
                aria-current={ch.id === chapter.id ? 'step' : undefined}
                aria-label={`第 ${i + 1} 章，${chapter.title}`}
                title={chapter.title}
              >§{i + 1}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="pruning-question">
        <div className="pruning-question-label"><span aria-hidden="true">?</span> 本节问题</div>
        <p>同样只留 288 个图块，按注意力选和随机选，会留下哪些不同的位置？从哪一层开始，模型才真正少算？</p>
        <nav className="pruning-entries" aria-label="本章实验">
          <a href="#module-5-1" onClick={jump}><b>5.1</b> 看留下谁 <span aria-hidden="true">↓</span></a>
          <a href="#module-5-2" onClick={jump}><b>5.2</b> 看从哪层开始省 <span aria-hidden="true">↓</span></a>
        </nav>
      </div>
    </header>
  );
}
