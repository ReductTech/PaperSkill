import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

const QUERIES = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
// 每个 Key 未来会被哪些查询命中（索引对应 QUERIES）
const KEYS = [
  { id: 'K1', label: '设 x = 3', hitBy: [0, 2] },
  { id: 'K2', label: 'x + 5 = 8', hitBy: [] },
  { id: 'K3', label: '8 × 2 = 16', hitBy: [1, 3] },
  { id: 'K4', label: '中间步骤', hitBy: [] },
  { id: 'K5', label: '答案 = 16', hitBy: [4] },
];
const BUDGET = 3;

export const M22: React.FC<WidgetProps> = () => {
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pruned, setPruned] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (playing && shown < QUERIES.length) {
      timer.current = window.setTimeout(() => setShown((s) => s + 1), 750);
    } else if (playing && shown >= QUERIES.length) {
      setPlaying(false);
    }
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [playing, shown]);

  const hitCount = KEYS.map((k) => k.hitBy.filter((q) => q < shown).length);
  const kept = hitCount.map((h) => h > 0);
  const keptCount = kept.filter(Boolean).length;
  const lastTarget = shown > 0 ? KEYS.find((k) => k.hitBy.includes(shown - 1)) : undefined;

  const reset = () => { setShown(0); setPlaying(false); setPruned(false); };
  const allShown = shown >= QUERIES.length;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {KEYS.map((k, i) => {
          const isLatest = !pruned && shown > 0 && k.hitBy.includes(shown - 1);
          const isKept = pruned && kept[i];
          const isDropped = pruned && !kept[i];
          const style: React.CSSProperties = {
            padding: '8px 10px', borderRadius: 10, fontSize: 14, minWidth: 96,
            border: '1px solid #d7deea', background: '#fff', color: '#21324a', textAlign: 'center',
          };
          if (isLatest) { style.borderColor = '#d97706'; style.background = '#fdf6ec'; }
          if (isKept) { style.borderColor = '#228d5c'; style.background = '#eefaf1'; style.color = '#1e6b3c'; }
          if (isDropped) { style.borderColor = '#d7deea'; style.background = '#f1f3f6'; style.color = '#8a93a6'; }
          return (
            <div key={k.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={style}>{k.label}</div>
              <div style={{ fontSize: 12, color: pruned ? (isKept ? '#228d5c' : '#8a93a6') : '#68778f' }}>
                {pruned ? (isKept ? '✓ 保留' : '✗ 删掉') : `命中 ${hitCount[i]}`}
              </div>
            </div>
          );
        })}
      </div>

      {shown > 0 ? (
        <div style={{ marginTop: 10, fontSize: 13, color: '#68778f', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {QUERIES.slice(0, shown).map((q, qi) => {
            const target = KEYS.find((k) => k.hitBy.includes(qi));
            return <span key={qi} style={{ padding: '3px 8px', borderRadius: 6, background: '#eef1f5' }}>{q} → {target ? target.label : '—'}</span>;
          })}
        </div>
      ) : null}

      <div style={{ marginTop: 10, fontSize: 13, color: '#68778f' }}>预算 top-B = {BUDGET}：只保留未来命中次数最高的 Key。</div>

      <div className="ctrl">
        <button className="chip" onClick={() => setPlaying(true)} disabled={playing || allShown || pruned}>播放未来查询 ▶</button>
        <button className="chip" onClick={() => setPruned(true)} disabled={!allShown || pruned}>按未来关注度保留 top-B ✂</button>
        <button className="chip" onClick={reset}>重置</button>
      </div>

      <div className={`feedback ${pruned ? 'good' : playing || allShown ? 'guide' : 'guide'}`}>
        {pruned
          ? `保留的 ${keptCount} 个正是未来会被查询的 Key——压缩的判断标准，就是未来会不会被关注。`
          : playing
          ? `正在播放未来查询 ${shown}/${QUERIES.length}：命中的 Key 计数 +1。`
          : allShown
          ? `5 个未来查询播放完毕：命中次数最高的 ${BUDGET} 个应该保留。`
          : '播放未来查询，看看哪些 Key 会在未来被命中。'}
      </div>
    </div>
  );
};

export default M22;