import React from 'react';
import type { Takeaway as TakeawayDef } from '../types';

// Three-item chapter takeaway (🎯 🔧 ✨). Reused at the end of every chapter.
// 提示词 8：加一行手写风标题强化"记忆锚点"，每项放大号图标水印做背景装饰。
// 刻意不做"hover 才展开描述"——现场讲解时三条要点必须一眼全见。
export function Takeaway({ items }: { items: TakeawayDef[] }) {
  return (
    <div className="takeaway-wrap">
      <div className="et-heading">本章带走 {items.length} 件事</div>
      <div className="embed-takeaway">
        {items.map((it, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <div className="et-arrow">→</div> : null}
            <div className="et-item">
              <span className="et-watermark" aria-hidden="true">
                {it.icon}
              </span>
              <div className="et-icon">{it.icon}</div>
              <div className="et-title">{it.title}</div>
              <div className="et-desc">{it.desc}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
