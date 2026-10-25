import React, { useState } from 'react';
import { symbolData, symbolCategories } from '../data/symbolData';

// 符号概念卡片网格（11.3）：图标 + 符号 + 名称 + 直觉解释，点击展开论文定义。
export function SymbolCard() {
  const [cat, setCat] = useState<string>('全部');
  const [open, setOpen] = useState<string | null>(null);
  const cats = ['全部', ...symbolCategories];
  const list = cat === '全部' ? symbolData : symbolData.filter((s) => s.category === cat);

  return (
    <div className="symbol-block">
      <div className="symbol-tabs">
        {cats.map((c) => (
          <button
            key={c}
            className={`symbol-tab ${cat === c ? 'active' : ''}`}
            onClick={() => { setCat(c); setOpen(null); }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="symbol-grid">
        {list.map((s) => (
          <div
            key={s.sym}
            className={`symbol-card ${open === s.sym ? 'open' : ''}`}
            onClick={() => setOpen(open === s.sym ? null : s.sym)}
          >
            <div className="symbol-card-top">
              <span className="symbol-icon">{s.icon}</span>
              <span className="symbol-sym">{s.sym}</span>
            </div>
            <div className="symbol-name">
              {s.name} <span className="symbol-zh">{s.zh}</span>
            </div>
            <div className="symbol-intuition">{s.intuition}</div>
            {open === s.sym ? (
              <div className="symbol-detail">
                <div className="symbol-def">{s.def}</div>
                <div className="symbol-rel">关联：{s.rel.join(' · ') || '—'}</div>
                <div className="symbol-loc">{s.locator}</div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
