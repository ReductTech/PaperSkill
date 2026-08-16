import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const RECORDS = [
  { q: 'Q1', k: 'K5' },
  { q: 'Q2', k: 'K5' },
  { q: 'Q3', k: 'K8' },
  { q: 'Q4', k: 'K5' },
  { q: 'Q5', k: 'K20' },
];

export const M33: React.FC<WidgetProps> = () => {
  const [phase, setPhase] = useState(0); // 0 查询记录, 1 旧方法判定, 2 未来扑空
  const hitCount: Record<string, number> = {};
  RECORDS.forEach((r) => { hitCount[r.k] = (hitCount[r.k] || 0) + 1; });
  const keys = ['K5', 'K8', 'K20'];
  const counts = keys.map((k) => hitCount[k] || 0);
  const removed = phase >= 1 ? 'K20' : null;
  const failed = phase >= 2;

  return (
    <div>
      <div style={{ fontSize: 13, color: '#21324a', marginBottom: 8 }}>
        最近 5 次查询命中记录：
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {RECORDS.map((r, i) => (
          <span key={i} style={{ padding: '5px 9px', borderRadius: 8, border: '1px solid #d7deea', fontSize: 13, background: '#fff' }}>
            {r.q} → {r.k}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: '#68778f' }}>旧方法统计「最近被命中了几次」：</div>
      {keys.map((k, i) => {
        const isRemoved = removed === k;
        const isFail = failed && k === 'K20';
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span style={{ width: 44, fontSize: 13, color: isRemoved ? '#c43f52' : '#21324a' }}>{k}</span>
            <div style={{ flex: 1, height: 14, background: '#eef1f5', borderRadius: 7, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: (counts[i] / 3) * 100 + '%', background: isRemoved ? '#c43f52' : '#27446e' }} />
            </div>
            <span style={{ width: 90, fontSize: 12, color: '#68778f' }}>
              {isRemoved ? '没被命中 → 清掉 ✗' : `命中 ${counts[i]} 次`}
            </span>
          </div>
        );
      })}
      {failed ? (
        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: '#fdf0f0', border: '1px solid #f3c1c1', fontSize: 13, color: '#991b1b' }}>
          后来有一个查询 Q100 需要 K20，但 K20 早被清掉了 —— 关键记忆丢失，推理出错。
        </div>
      ) : null}
      <div className="ctrl">
        <button className="chip" onClick={() => setPhase((p) => Math.min(2, p + 1))} disabled={phase >= 2}>下一步 ▶</button>
        <button className="chip" onClick={() => setPhase(0)}>重置</button>
      </div>
      <div className={`feedback ${phase >= 2 ? 'bad' : 'guide'}`}>
        {phase === 0 ? '传统方法只看最近查询命中了哪些 Key。' : phase === 1 ? 'K5 最常被命中所以保留，K20 最近没被命中被清掉。' : '问题就在这里：K20 只是暂时沉默，未来却突然变得关键。'}
      </div>
    </div>
  );
};

export default M33;