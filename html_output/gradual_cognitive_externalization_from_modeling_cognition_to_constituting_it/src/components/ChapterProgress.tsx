import React, { useState } from 'react';
import type { ChapterDef } from '../types';
export function ChapterProgress({ chapters, active, revealed, onNavigate }: { chapters: ChapterDef[]; active: number; revealed: number; onNavigate: (index: number) => void }) {
  const [open, setOpen] = useState(false);
  return <nav className="chapter-progress" aria-label="章节进度"><button className="progress-count" onClick={() => setOpen((value) => !value)} aria-expanded={open}><strong>{String(active).padStart(2, '0')}</strong><span>/ {String(chapters.length).padStart(2, '0')}</span></button><div className="progress-track"><span style={{ width: `${(active / chapters.length) * 100}%` }} /></div><div className="progress-title">{chapters[active - 1]?.title}</div>{open ? <div className="progress-menu">{chapters.slice(0, revealed).map((chapter, index) => <button key={chapter.id} className={index + 1 === active ? 'active' : ''} onClick={() => { onNavigate(index + 1); setOpen(false); }}><span>{String(index + 1).padStart(2, '0')}</span>{chapter.title}</button>)}</div> : null}</nav>;
}
