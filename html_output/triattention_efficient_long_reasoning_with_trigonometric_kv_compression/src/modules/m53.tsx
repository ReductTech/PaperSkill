import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const N = 16; // 位置数
const KEY_POS = 3; // 远处的一本关键书

export const M53: React.FC<WidgetProps> = () => {
  const [phase, setPhase] = useState(0); // 0 扇面, 1 误删, 2 扑空
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, padding: '10px 6px', background: '#f5f8f0', borderRadius: 10, border: '1px solid #e3e8ef', overflowX: 'auto' }}>
        {Array.from({ length: N }).map((_, i) => {
          const pos = i + 1;
          const recent = pos > N - 3;
          const angle = recent ? 0 : (pos - 8) * 9;
          const isKey = pos === KEY_POS;
          const removed = phase >= 1 && isKey;
          return (
            <div key={pos} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
              <div style={{
                width: 3, height: 26, borderRadius: 2,
                background: removed ? '#c43f52' : recent ? '#27446e' : '#b9c4d4',
                transform: `rotate(${angle}deg)`, transformOrigin: 'bottom center',
                transition: 'all .3s',
              }} />
              {isKey ? (
                <span style={{ position: 'absolute', top: -22, fontSize: 11, color: '#d97706', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {removed ? '关键键 ✗' : '关键键'}
                </span>
              ) : null}
              {removed ? <span style={{ fontSize: 12, color: '#c43f52' }}>已清</span> : <span style={{ fontSize: 10, color: '#8a93a6' }}>{pos}</span>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: '#68778f' }}>蓝色 = 最近 3 个查询（观察窗口内，方向一致）；灰色 = 更早位置，方向已经转走。</div>
      {phase >= 2 ? (
        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: '#fdf0f0', border: '1px solid #f3c1c1', fontSize: 13, color: '#991b1b' }}>
          后来的查询需要这个关键 Key，但它早已被清掉，长推理在这里断链。
        </div>
      ) : null}
      <div className="ctrl">
        <button className="chip" onClick={() => setPhase((p) => Math.min(2, p + 1))} disabled={phase >= 2}>下一步 ▶</button>
        <button className="chip" onClick={() => setPhase(0)}>重置</button>
      </div>
      <div className={`feedback ${phase >= 2 ? 'bad' : 'guide'}`}>
        {phase === 0 ? '旋转后只有最近几个查询的方向一致，观察窗口极小。' : phase === 1 ? '关键键落在窗口外，最近没人关注，被旧方法误删。' : '这就是传统方法误删关键记忆的机制。'}
      </div>
    </div>
  );
};

export default M53;