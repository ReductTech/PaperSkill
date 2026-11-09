import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { SegButton, Feedback } from './obrKit';

// ch2：量化要紧凑、剪枝要高方差的冲突。Hadamard 旋转摊平 outlier 后量化误差下降，
// 但权重变得彼此接近、可剪的自然稀疏消失——这是 OBR 要用误差补偿调解的矛盾。
// 分布与读数为示意估算，非论文实测。
const UNROT = [0.05, 0.12, 0.2, 0.08, 7.8, 0.16, 0.3, 0.06, 5.2, 0.1, 0.24, 0.02, 0.18, 6.4, 0.09, 0.28, 0.04, 0.14, 0.22, 4.9];
const ROT = [1.1, 0.9, 1.3, 1.0, 0.8, 1.2, 1.05, 0.95, 1.25, 1.15, 0.85, 1.18, 1.08, 0.92, 1.02, 1.22, 0.88, 1.1, 0.98, 1.35];

function hist(values: number[]): { center: number; h: number }[] {
  const max = Math.max(...values);
  const bins = [0, 0.5, 1, 1.5, 2, 4, 8];
  return bins.map((lo, i) => {
    const hi = bins[i + 1] ?? 1000;
    const c = values.filter((v) => v >= lo && v < hi).length;
    return { center: lo + (hi - lo) / 2, h: c };
  }).slice(0, bins.length - 1);
}

const W = 760, H = 480, L = 64, R = 20, T = 30, B = 64;
const plotW = W - L - R, plotH = H - T - B;
const MAXC = 8;

export function ConflictDist(_props: WidgetProps) {
  const [rotated, setRotated] = useState(false);
  const values = rotated ? ROT : UNROT;
  const range = Math.max(...values) - Math.min(...values);
  const prunable = values.filter((v) => v < 0.3).length;
  const bars = hist(values);
  const quantErr = Math.round(range * 14); // 量化误差正比于动态范围（示意）
  const pruneScore = Math.round((prunable / values.length) * 100);
  return (
    <div className="obr-layout obr-two">
      <div className="obr-panel obr-chart-panel">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="权重幅值分布直方图">
          <line x1={L} y1={T + plotH} x2={W - R} y2={T + plotH} stroke="#d7deea" strokeWidth={2} />
          <line x1={L} y1={T} x2={L} y2={T + plotH} stroke="#d7deea" strokeWidth={2} />
          {bars.map((b, i) => {
            const bw = plotW / bars.length;
            const bh = (b.h / MAXC) * plotH;
            const x = L + i * bw + 6;
            const color = rotated ? '#228d5c' : '#c43f52';
            return (
              <g key={i}>
                <rect x={x} y={T + plotH - bh} width={bw - 12} height={bh} rx={4} fill={color} opacity={0.85} />
                <text x={x + (bw - 12) / 2} y={T + plotH + 30} textAnchor="middle" fontSize={19} fill="#68778f">
                  {b.center >= 1 ? `≥${b.center}` : b.center}
                </text>
              </g>
            );
          })}
          <text x={L - 12} y={T + plotH + 30} textAnchor="end" fontSize={20} fill="#68778f">幅值</text>
          <text x={20} y={T + 12} fontSize={20} fill="#68778f">频次</text>
        </svg>
        <div className="obr-note">分布与误差读数为示意估算；真实旋转为 Hadamard 变换。</div>
      </div>
      <div className="obr-panel">
        <div className="obr-heading">量化 vs 剪枝的矛盾</div>
        <div className="obr-controls">
          <SegButton active={!rotated} onClick={() => setRotated(false)}>不旋转（有 outlier）</SegButton>
          <SegButton active={rotated} onClick={() => setRotated(true)}>Hadamard 旋转</SegButton>
        </div>
        <div className="obr-meter-row">
          <div>
            <span className="obr-meter-label">量化误差</span>
            <div className="obr-meter"><div className={rotated ? 'good' : 'bad'} style={{ width: `${quantErr}%` }} /></div>
            <b>{quantErr}</b>
          </div>
          <div>
            <span className="obr-meter-label">可剪性（小权重占比）</span>
            <div className="obr-meter"><div className={rotated ? 'bad' : 'good'} style={{ width: `${pruneScore}%` }} /></div>
            <b>{pruneScore}%</b>
          </div>
        </div>
        <Feedback tone={rotated ? 'green' : 'red'}>
          {rotated
            ? '旋转后权重紧凑：量化误差↓，但权重彼此接近、可剪的自然稀疏消失（剪枝变难）'
            : '有 outlier 时：量化需要大范围（误差大），但天然存在大量小权重（易剪枝）'}
        </Feedback>
        <p className="obr-body muted">OBR 的使命：用误差补偿同时兼顾“紧凑利于量化”与“高方差利于剪枝”。</p>
      </div>
    </div>
  );
}
