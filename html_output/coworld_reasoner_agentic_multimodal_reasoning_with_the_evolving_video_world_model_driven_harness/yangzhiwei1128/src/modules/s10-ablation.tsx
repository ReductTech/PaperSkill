import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const ROWS = [
  { key: '位置关系 PR', gain: 2.39 },
  { key: '多步推理 MSR', gain: 1.52 },
  { key: '动作结果 Act.', gain: 1.35 },
  { key: '视角采择 Persp.', gain: 0.0 },
  { key: '遮挡 Occl.', gain: 5.36 },
  { key: '碰撞 Coll.', gain: 2.55 },
  { key: '兼容性 Compat.', gain: 1.04 },
  { key: '文字识别 OCR', gain: -1.18 },
];

export function S10Ablation(_props: WidgetProps) {
  const [withTools, setWithTools] = useState(true);
  const max = 6;
  const width = 900;
  const rowH = 52;
  const zeroX = width / 2;
  const scale = (width / 2 - 120) / max;
  return (
    <div className="ps-page s10-page">
      <div className="ps-chart">
        <div className="ps-toggle-row">
          <button className={`ps-seg ${withTools ? 'is-on' : ''}`} onClick={() => setWithTools(true)}>含 VWM 工具</button>
          <button className={`ps-seg ${!withTools ? 'is-on' : ''}`} onClick={() => setWithTools(false)}>去掉 VWM 工具</button>
          <span className="ps-seg-note">基线：Ours (w/o VWM)</span>
        </div>
        <svg viewBox={`0 0 ${width} ${ROWS.length * rowH + 40}`} role="img" aria-label="八个子类相对无 VWM 变体的增益">
          <line x1={zeroX} y1="0" x2={zeroX} y2={ROWS.length * rowH + 10} stroke="#d7deea" strokeWidth="2" />
          {ROWS.map((row, index) => {
            const value = withTools ? row.gain : 0;
            const w = Math.abs(value) * scale;
            const isHighlight = withTools && row.gain >= 2.5;
            return (
              <g key={row.key} transform={`translate(0 ${index * rowH + 14})`}>
                <text x={zeroX - 16} y="30" textAnchor="end" fontSize="24" fill="#21324a">{row.key}</text>
                <rect x={value >= 0 ? zeroX : zeroX - w} y="10" width={Math.max(w, 1.5)} height="28" rx="5"
                  fill={value < 0 ? '#c43f52' : isHighlight ? '#228d5c' : '#27446e'} opacity={withTools ? 1 : 0.25} />
                <text x={value >= 0 ? zeroX + w + 12 : zeroX + 12} y="32" textAnchor="start" fontSize="22" fill={withTools ? (value < 0 ? '#c43f52' : '#21324a') : '#9aa8bb'}>
                  {withTools ? `${value > 0 ? '+' : ''}${value.toFixed(2)}` : '0.00'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <aside className="ps-aside">
        <strong className="ps-aside-title">工具消融</strong>
        <p className="ps-copy">{withTools
          ? '相对无 VWM 变体，遮挡（+5.36）与碰撞（+2.55）增益最大：这两类题需要看见中间交互。'
          : '去掉工具后以无 VWM 变体为基线，增益回到零；但视角采择的收益在无工具时仍然存在，说明部分收益来自技能引导。'}</p>
        <p className="ps-copy">技能与工具的使用也随任务变化：空间题多用视角改变与插值，因果题多用干预与延续，纯感知题很少调用。</p>
        <div className={`ps-feedback ${withTools ? 'is-success' : 'is-warn'}`} aria-live="polite">
          {withTools ? '生成的视频补上了中间交互，收益集中在这两类子任务。' : '少了生成视频，中间交互就没有直接证据。'}
        </div>
      </aside>
    </div>
  );
}
