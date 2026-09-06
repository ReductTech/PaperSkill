import React from 'react';
import type { ChapterDef } from '../types';

const shortTitles: Record<string, string> = {
  'chap-1': '背景与动机',
  'chap-2': '架构全景',
  'chap-3': '近无损接口',
  'chap-4': '原生统一建模',
  'chap-5': '联合训练目标',
  'chap-6': '渐进训练',
  'chap-7': '推理基础设施',
  'chap-8': '数据构造',
  'chap-9': '实验与结论',
};

export function DefenseNav({
  chapters,
  activeId,
  revealed,
  collapsed,
  onNavigate,
  onConclusion,
  onToggle,
}: {
  chapters: ChapterDef[];
  activeId: string;
  revealed: number;
  collapsed: boolean;
  onNavigate: (chapterIndex: number | null) => void;
  onConclusion: () => void;
  onToggle: () => void;
}) {
  const activeIndex = chapters.findIndex((chapter) => chapter.id === activeId);
  const progress = activeId === 'conclusion' ? chapters.length : activeIndex >= 0 ? activeIndex + 1 : 0;

  return (
    <aside className={`defense-nav${collapsed ? ' is-collapsed' : ''}`} aria-label="答辩导航">
      <div className="defense-nav-head">
        <span className="defense-nav-kicker">PRESENTATION</span>
        <strong>答辩导航</strong>
        <span className="defense-nav-progress" aria-label={`当前第 ${progress} 章，共 ${chapters.length} 章`}>
          {String(progress).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
        </span>
        <button
          className="defense-nav-toggle"
          type="button"
          aria-label={collapsed ? '展开答辩导航' : '收起答辩导航'}
          aria-expanded={!collapsed}
          title={collapsed ? '展开导航' : '收起导航'}
          onClick={onToggle}
        >
          <span aria-hidden="true">{collapsed ? '›' : '‹'}</span>
        </button>
      </div>

      <nav>
        <button
          className={`defense-nav-item defense-nav-overview${activeId === 'overview' ? ' is-active' : ''}`}
          type="button"
          aria-current={activeId === 'overview' ? 'page' : undefined}
          onClick={() => onNavigate(null)}
        >
          <span className="defense-nav-num">00</span>
          <span className="defense-nav-label">论文概览</span>
        </button>

        <ol className="defense-nav-list">
          {chapters.map((chapter, index) => {
            const isActive = chapter.id === activeId;
            const isRevealed = index < revealed;
            return (
              <li key={chapter.id}>
                <button
                  className={`defense-nav-item${isActive ? ' is-active' : ''}${isRevealed ? ' is-revealed' : ''}`}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`第 ${index + 1} 章：${chapter.title}`}
                  onClick={() => onNavigate(index)}
                >
                  <span className="defense-nav-num">{String(index + 1).padStart(2, '0')}</span>
                  <span className="defense-nav-label">{shortTitles[chapter.id] ?? chapter.title}</span>
                  <span className="defense-nav-state" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>
        <button
          className={`defense-nav-item defense-nav-conclusion${activeId === 'conclusion' ? ' is-active' : ''}`}
          type="button"
          aria-current={activeId === 'conclusion' ? 'page' : undefined}
          onClick={onConclusion}
        >
          <span className="defense-nav-num">END</span>
          <span className="defense-nav-label">结论收束</span>
          <span className="defense-nav-state" aria-hidden="true" />
        </button>
      </nav>
    </aside>
  );
}
