import React from 'react';

// Second module of chapter 1: the corpus is not three equal piles. The bar is drawn to scale,
// which is the only way the 178x span is visible at all — Broaden ends up 1.6px wide.

const ROWS = [
  { key: 's', name: 'Specify', n: '2,779,177', pct: '92.10%', color: 'var(--mv-s)' },
  { key: 'a', name: 'Address', n: '222,707', pct: '7.38%', color: 'var(--mv-a)' },
  { key: 'b', name: 'Broaden', n: '15,592', pct: '0.52%', color: 'var(--mv-b)' },
];

export const S0Imbalance: React.FC = () => (
  <div className="imb">
    <div className="imb-head">
      <span className="imb-t">全库 3,017,476 个 query–gold 对，按动作拆开</span>
      <span className="imb-u">最长 / 最短 = 178×</span>
    </div>

    <div className="imb-bar" aria-hidden="true">
      <i className="imb-seg" style={{ width: '92.10%', background: 'var(--mv-s)' }} />
      <i className="imb-seg" style={{ width: '7.38%', background: 'var(--mv-a)' }} />
      <i className="imb-seg" style={{ width: '0.52%', background: 'var(--mv-b)' }} />
    </div>

    <div className="imb-rows">
      {ROWS.map((r) => (
        <div className="imb-row" key={r.key}>
          <span className="imb-k" style={{ color: r.color }}>
            {r.name}
          </span>
          <span className="imb-n">{r.n}</span>
          <span className="imb-p">{r.pct}</span>
        </div>
      ))}
    </div>

    <p className="imb-note">
      Address 只有 Specify 的 <b>1/12</b>，Broaden 只有 <b>1/178</b> —— 按比例画出来就是右边那条 0.5% 的细线。这一屏之后所有
      Broaden 的数字，都要带着它去读。
    </p>
  </div>
);
