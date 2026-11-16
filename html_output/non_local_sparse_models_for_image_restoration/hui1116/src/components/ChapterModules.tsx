import { useState } from 'react';
import type { ChapterDef } from '../types';
import { Module } from './Module';

export function ChapterModules({ chapter, paperSource }: { chapter: ChapterDef; paperSource?: string }) {
  const first = chapter.modules[0]?.id;
  const [selection, setSelection] = useState({ active: first, visited: new Set([first]) });
  if (chapter.modules.length < 2) {
    return first ? <Module module={chapter.modules[0]} chapterId={chapter.id} paperSource={paperSource} /> : null;
  }

  if (chapter.stackModules) {
    return (
      <div className="chapter-modules chapter-modules-stacked">
        {chapter.modules.map(module => (
          <Module key={module.id} module={module} chapterId={chapter.id} paperSource={paperSource} />
        ))}
      </div>
    );
  }

  function show(id: string) {
    setSelection(previous => ({ active: id, visited: new Set([...previous.visited, id]) }));
  }

  return (
    <div className="chapter-modules">
      <div className="chapter-module-options" role="group" aria-label="本页演示">
        {chapter.modules.map(module => (
          <button
            key={module.id}
            type="button"
            className="chip"
            aria-pressed={module.id === selection.active}
            onClick={() => show(module.id)}
          >
            {module.tabLabel ?? module.title}
          </button>
        ))}
      </div>
      {chapter.modules.filter(module => selection.visited.has(module.id)).map(module => (
        <div key={module.id} hidden={module.id !== selection.active}>
          <Module module={module} chapterId={chapter.id} paperSource={paperSource} />
        </div>
      ))}
    </div>
  );
}
