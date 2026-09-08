import { useState } from 'react';
import type { ModuleDef } from '../types';
import { Module } from './Module';
import '../styles/module-deck.css';

export function ModuleDeck({
  modules,
  chapterId,
}: {
  modules: ModuleDef[];
  chapterId: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (modules.length === 1) {
    return <Module module={modules[0]} chapterId={chapterId} />;
  }

  return (
    <div className="module-deck">
      <nav className="module-deck-tabs" aria-label="本页子章节">
        {modules.map((module, index) => (
          <button
            type="button"
            key={module.id}
            className={activeIndex === index ? 'is-active' : ''}
            aria-pressed={activeIndex === index}
            onClick={() => setActiveIndex(index)}
          >
            <span>{module.id}</span>
            {module.title}
          </button>
        ))}
      </nav>
      {modules.map((module, index) => (
        <div key={module.id} hidden={activeIndex !== index}>
          <Module module={module} chapterId={chapterId} />
        </div>
      ))}
    </div>
  );
}
