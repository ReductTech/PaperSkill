import React from 'react';
import type { ComicDef } from '../types';

// 漫画查看器：竖向单列条漫（约束 B），每张配 caption。
export function ComicViewer({ comics }: { comics: ComicDef[] }) {
  if (!comics.length) return null;
  return (
    <div className="comic-viewer">
      <h3 className="comic-heading">🖼️ 情境漫画</h3>
      {comics.map((c) => (
        <figure key={c.id} className="comic-item">
          <figcaption className="comic-caption">
            <strong>{c.title}</strong>
          </figcaption>
          <img src={c.src} alt={c.title} className="comic-img" loading="lazy" />
          <p className="comic-text">{c.caption}</p>
        </figure>
      ))}
    </div>
  );
}
