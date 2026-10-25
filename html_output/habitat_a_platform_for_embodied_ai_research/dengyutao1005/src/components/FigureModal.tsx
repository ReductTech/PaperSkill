import React, { useEffect } from 'react';
import type { FigureItem } from '../types';

// 模态框：显示论文原图/表格，图内文字可读宽度 + 支持放大（约束 A）。
export function FigureModal({
  item,
  onClose,
}: {
  item: FigureItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="fig-modal-overlay" onClick={onClose}>
      <div className="fig-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fig-modal-head">
          <span className="fig-modal-num">{item.number}</span>
          <span className="fig-modal-title">{item.title}</span>
          <button className="fig-modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="fig-modal-body">
          {item.type === 'figure' && item.imagePath ? (
            <a className="fig-zoom" href={item.imagePath} target="_blank" rel="noreferrer" title="点击在新窗口查看原图（可缩放）">
              <img src={item.imagePath} alt={item.title} className="fig-modal-img" loading="lazy" />
            </a>
          ) : item.tableRows ? (
            <div className="fig-table-wrap">
              <table className="fig-table">
                {item.tableHead ? (
                  <thead>
                    <tr>{item.tableHead.map((h, i) => <th key={i}>{h}</th>)}</tr>
                  </thead>
                ) : null}
                <tbody>
                  {item.tableRows.map((r, i) => (
                    <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="fig-noimg">该图表以交互形式呈现（见正文模块），无位图。</p>
          )}
        </div>
        <div className="fig-modal-foot">
          <span className="fig-page">p.{item.page}</span>
          <span className="fig-desc">{item.description}</span>
          <span className="fig-concepts">
            {item.relatedConcepts.map((c) => <em key={c}>{c}</em>)}
          </span>
        </div>
      </div>
    </div>
  );
}
