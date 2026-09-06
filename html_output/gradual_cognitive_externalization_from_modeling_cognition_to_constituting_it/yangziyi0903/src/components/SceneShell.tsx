import React from 'react';
import type { ChapterDef } from '../types';
export function SceneShell({ chapter, number, core, children }: { chapter: ChapterDef; number: number; core: boolean; children: React.ReactNode }) {
  return <section id={chapter.id} className={`chapter-scene scene-${number} ${core ? 'core-scene' : 'support-scene'}`}><header className="scene-heading"><div className="scene-number">{String(number).padStart(2, '0')}</div><div><span className="scene-label">{chapter.badgeLabel}</span><h2>{chapter.title}</h2></div></header>{children}</section>;
}
