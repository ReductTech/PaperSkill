import React, { useState } from 'react';
import { Feedback } from './photo-kit';

export function Ch2Stitch() {
  const [batch, setBatch] = useState(40);
  const N = 160;
  const levels = Math.max(2, Math.ceil(Math.log(N) / Math.log(batch)) + 1);
  const toyWork = Math.round(N + (levels - 1) * batch);
  const inRange = batch >= 30 && batch <= 50;
  return <div className="photo-page photo-split is-wide">
    <div className="photo-scene photo-desk" style={{ padding: 22 }}>
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, levels)},minmax(0,1fr))`, gap: 12, alignItems: 'center' }}>
        {Array.from({ length: Math.min(4, levels) }).map((_, level) => <div key={level} className="photo-panel" style={{ padding: 15, background: level === Math.min(4, levels) - 1 ? '#e9f6ed' : '#fffdf7' }}>
          <span className="photo-kicker">第 {level + 1} 层</span>
          <strong style={{ marginTop: 8, fontSize: 'var(--ppt-body-heading)', color: level === Math.min(4, levels) - 1 ? '#176c45' : '#27446e' }}>
            {level === 0 ? `${N} 帧` : level === Math.min(4, levels) - 1 ? '1 张 WSI' : `${Math.ceil(N / Math.pow(batch, level))} 张局部图`}
          </strong>
          <div className="photo-frame-strip" style={{ marginTop: 18 }}>
            {Array.from({ length: Math.min(4, Math.max(1, Math.ceil(N / Math.pow(batch, level)))) }).map((__, i) =>
              <span key={i} className={level === Math.min(4, levels) - 1 && i === 0 ? 'is-active' : ''}><i /></span>)}
          </div>
        </div>)}
      </div>
    </div>
    <aside className="photo-panel">
      <span className="photo-kicker">递归拼接</span>
      <div style={{ marginTop: 20 }}>
        <div className="photo-range-label"><span>每批拼接帧数</span><b>{batch}</b></div>
        <input className="photo-range" type="range" min="10" max="60" step="5" value={batch}
          aria-label="每批拼接帧数" onChange={event => setBatch(Number(event.target.value))} />
      </div>
      <div className="photo-rule">层级 {levels} · 相对工作量 {toyWork}</div>
      <div className="photo-legend"><span><b>绿色区段</b> 30–50 帧/批</span><span>工作量是教学示意</span></div>
      <p>先把小批画面拼成局部图，再把局部图继续合并，避免一开始就对所有帧完成对配准。</p>
      <Feedback tone={inRange ? 'green' : 'orange'}>{inRange
        ? '30–50 帧/批落在论文实现范围；演示层级较少，但仍需逐层校验。'
        : batch < 30
          ? '批次偏小：层级更多、中间拼接次数增加。'
          : '批次偏大：局部误差更难在早期被发现。'}</Feedback>
    </aside>
  </div>;
}
