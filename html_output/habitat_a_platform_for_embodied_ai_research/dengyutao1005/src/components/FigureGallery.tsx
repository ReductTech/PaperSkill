import React, { useState, useMemo } from 'react';
import { figureData } from '../data/figureData';
import { FigureModal } from './FigureModal';
import type { FigureItem } from '../types';

// 全局图表库（F2）：竖向单列卡片、搜索、类型/章节筛选（约束 B 默认竖排）。
export function FigureGallery() {
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | 'figure' | 'table'>('all');
  const [chapter, setChapter] = useState<number | 'all'>('all');
  const [active, setActive] = useState<FigureItem | null>(null);

  const chapters = useMemo(
    () => Array.from(new Set(figureData.map((f) => f.chapter))).sort((a, b) => a - b),
    []
  );

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return figureData.filter((f) => {
      if (type !== 'all' && f.type !== type) return false;
      if (chapter !== 'all' && f.chapter !== chapter) return false;
      if (!t) return true;
      const hay = [f.number, f.title, f.description, ...f.keywords, ...f.relatedConcepts]
        .join(' ')
        .toLowerCase();
      return hay.includes(t);
    });
  }, [q, type, chapter]);

  return (
    <section className="gallery slide-chap">
      <h2 className="chap-title">
        <span className="num">📚</span> 图表库
      </h2>
      <p className="gallery-intro">
        全部来自论文的 Figure 1–5 与 Table 1–2。默认单列竖排（约束 B）；点击卡片弹出模态框查看原图（图内文字可读）。
      </p>
      <div className="gallery-tools">
        <input
          className="gallery-search"
          placeholder="搜索图表（标题 / 关键词 / 概念）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="gallery-filters">
          {(['all', 'figure', 'table'] as const).map((t) => (
            <button
              key={t}
              className={`gallery-filter ${type === t ? 'active' : ''}`}
              onClick={() => setType(t)}
            >
              {t === 'all' ? '全部' : t === 'figure' ? 'Figure' : 'Table'}
            </button>
          ))}
          <select
            className="gallery-chapter"
            value={String(chapter)}
            onChange={(e) =>
              setChapter(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
          >
            <option value="all">全部章节</option>
            {chapters.map((c) => (
              <option key={c} value={c}>第 {c} 章</option>
            ))}
          </select>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="gallery-empty">未找到匹配的图表</div>
      ) : (
        <div className="gallery-list">
          {list.map((f) => (
            <button key={f.id} className="gallery-card" onClick={() => setActive(f)}>
              <div className="gallery-card-thumb">
                {f.imagePath ? (
                  <img src={f.imagePath} alt={f.title} loading="lazy" />
                ) : (
                  <div className="gallery-card-ph">
                    {f.type === 'table' ? 'TABLE' : 'FIGURE'}
                  </div>
                )}
              </div>
              <div className="gallery-card-meta">
                <span className="gallery-card-num">{f.number}</span>
                <span className="gallery-card-type">{f.type === 'figure' ? 'Figure' : 'Table'}</span>
                <span className="gallery-card-chap">第 {f.chapter} 章</span>
              </div>
              <div className="gallery-card-title">{f.title}</div>
              <div className="gallery-card-desc">{f.description}</div>
            </button>
          ))}
        </div>
      )}

      <FigureModal item={active} onClose={() => setActive(null)} />
    </section>
  );
}
