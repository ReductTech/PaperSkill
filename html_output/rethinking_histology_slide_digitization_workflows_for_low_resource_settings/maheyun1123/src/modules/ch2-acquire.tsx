import React, { useState } from 'react';
import { Feedback, pct } from './photo-kit';

export function Ch2Acquire() {
  const [overlap, setOverlap] = useState(25);
  const [pause, setPause] = useState(1);
  const gap = 1 - overlap / 100;
  const valid = overlap >= 20;
  const ideal = overlap > 50;
  const steady = pause >= 1;
  const tone = !valid || !steady ? 'red' : ideal ? 'green' : 'blue';
  return <div className="photo-page photo-split is-wide">
    <div className="photo-scene photo-desk" style={{ padding: 24 }}>
      <svg viewBox="0 0 880 500" style={{ width: '100%', height: '100%' }} role="img"
        aria-label={`扫片示意，重叠 ${overlap}%，停顿 ${pause} 秒，${valid ? '存在连续覆盖' : '出现覆盖缺口'}`}>
        <rect x="38" y="44" width="804" height="346" rx="22" fill="#fffdf7" stroke="#b8c9a7" strokeWidth="4" />
        <path d="M94 308 C160 164 275 142 365 230 C452 316 530 118 666 167 C741 194 779 265 794 321Z" fill="#be8eaf" opacity=".52" />
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const rowOverlapGap = Math.max(3, gap * 112);
          return Array.from({ length: 5 }).map((__, columnIndex) => {
            const x = 75 + columnIndex * rowOverlapGap;
            const y = 105 + rowIndex * 47;
            return <g key={`${rowIndex}-${columnIndex}`} transform={`translate(${x} ${y})`}>
              <rect width="122" height="66" rx="8" fill={valid ? '#e7f2ed' : '#f7dfe3'} stroke={valid ? '#3a7d6b' : '#c43f52'} strokeWidth="3" opacity={columnIndex % 2 ? .72 : .9} />
              <path d="M18 47 C35 18 62 16 76 33 C88 47 100 24 109 40" fill="none" stroke="#9b6f91" strokeWidth="4" />
            </g>;
          });
        })}
        <g transform="translate(645 300)">
          <rect width="180" height="58" rx="14" fill={steady ? '#e6f5eb' : '#fae8eb'} stroke={steady ? '#228d5c' : '#c43f52'} strokeWidth="4" />
        </g>
      </svg>
      <span className={`photo-acquire-status ${steady ? '' : 'is-risk'}`}>{steady ? '停顿帧稳定' : '运动帧风险'}</span>
      {!valid && <span className="photo-badge is-red" style={{ position: 'absolute', left: '28%', bottom: '20%' }}>重叠不足：出现覆盖缺口</span>}
    </div>
    <aside className="photo-panel">
      <span className="photo-kicker">采集协议</span>
      <div style={{ marginTop: 18 }}>
        <div className="photo-range-label"><span>相邻画面重叠</span><b>{pct(overlap)}</b></div>
        <input className="photo-range" type="range" min="10" max="60" step="5" value={overlap}
          aria-label="相邻画面重叠百分比" onChange={event => setOverlap(Number(event.target.value))} />
      </div>
      <div>
        <div className="photo-range-label"><span>画面停顿</span><b>{pause.toFixed(1)} 秒</b></div>
        <input className="photo-range" type="range" min="0" max="2" step="0.25" value={pause}
          aria-label="画面停顿秒数" onChange={event => setPause(Number(event.target.value))} />
      </div>
      <div className="photo-legend">
        <span><b>20–30%</b> 论文采集指南</span>
        <span><b>&gt;50%</b> 当前更理想</span>
      </div>
      <p>停顿帮助选出清晰画面，重叠让相邻帧有足够共同结构。恢复模型不能替代缺失的采集覆盖。</p>
      <Feedback tone={tone}>{!valid
        ? '重叠不足，画面出现缺口，不能按论文的连续帧假设拼接。'
        : !steady
          ? '停顿不足：覆盖还在，但稳定帧更少；这是采集风险示意，不是模型质量结论。'
          : ideal
            ? '超过 50% 重叠，边缘连续性更稳妥；论文仍把更快、更稀疏的视频列作未来工作。'
            : '达到 20–30% 采集指南；仍建议按论文停顿拍摄，以稳定画面细节。'}</Feedback>
    </aside>
  </div>;
}
