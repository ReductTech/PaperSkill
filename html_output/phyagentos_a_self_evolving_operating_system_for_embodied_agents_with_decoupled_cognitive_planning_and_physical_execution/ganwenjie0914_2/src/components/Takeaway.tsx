import React from 'react';
import type { Takeaway as TakeawayDef } from '../types';

// 章末三张要点卡：一眼回顾本章「是什么 / 为什么 / 记住什么」。
export function Takeaway({ items }: { items: TakeawayDef[] }) {
  return (
    <div className="takeaway">
      <div className="takeaway-label">本 章 回 顾</div>
      <div className="takeaway-grid">
        {items.map((it, i) => (
          <div className="takeaway-card" key={i} style={{ '--tw-i': i } as React.CSSProperties}>
            <div className="et-icon" aria-hidden>
              {it.icon}
            </div>
            <div className="et-title">{it.title}</div>
            <div className="et-desc">{it.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
