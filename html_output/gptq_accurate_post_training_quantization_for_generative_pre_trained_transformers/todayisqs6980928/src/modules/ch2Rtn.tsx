import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const BITS = [4, 3, 2];

// 第二章：RTN 为何在大模型上失效。
// SVG 展示量化网格 + 舍入误差，以及误差在多层网络中的逐层累积。
export const Ch2Rtn: React.FC<WidgetProps> = () => {
  const [bits, setBits] = useState(4);
  const levels = Math.pow(2, bits);
  const truth = 0.653;
  const q = Math.round(truth * (levels - 1)) / (levels - 1);
  const err = Math.abs(truth - q);

  const X0 = 150;
  const X1 = 900;
  const AXIS_Y = 108;
  const tx = X0 + truth * (X1 - X0);
  const qx = X0 + q * (X1 - X0);

  // 层间累积：误差带宽度逐层递增
  const layers = [
    { name: '第 1 层', w: 30 },
    { name: '第 2 层', w: 70 },
    { name: '第 3 层', w: 130 },
    { name: '第 4 层', w: 220 },
  ];

  return (
    <div className="ch2-rtn" data-testid="ch2-rtn" data-bits={bits}>
      <p className="ch2-thesis">
        <strong>核心缺陷：</strong>RTN 逐权重独立舍入，各权重的误差互不补偿，并在层间逐级累积。
      </p>

      <div className="ch2-switch" role="group" aria-label="量化位宽">
        {BITS.map((b) => (
          <button key={b} type="button" className={bits === b ? 'active' : ''} aria-pressed={bits === b} onClick={() => setBits(b)}>
            {b} bit
          </button>
        ))}
      </div>

      <svg className="ch2-svg" viewBox="0 0 1060 340" role="img" aria-labelledby="ch2-title ch2-desc">
        <title id="ch2-title">量化网格与误差累积</title>
        <desc id="ch2-desc">数轴上展示权重的最近邻舍入误差；下方展示误差在多层的逐层累积。</desc>
        <defs>
          <marker id="ch2ArrowRed" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#c43f52" />
          </marker>
        </defs>

        {/* 标题 */}
        <text x="530" y="38" textAnchor="middle" className="ch2-node-title">量化网格：离散刻度与舍入误差</text>

        {/* 数轴 */}
        <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} className="ch2-axis" />
        {Array.from({ length: levels }).map((_, i) => {
          const x = X0 + (i / (levels - 1)) * (X1 - X0);
          return <line key={i} x1={x} y1={AXIS_Y - 8} x2={x} y2={AXIS_Y + 8} className="ch2-tick" />;
        })}

        {/* 误差带 */}
        <rect x={Math.min(tx, qx)} y={AXIS_Y + 18} width={Math.max(4, Math.abs(tx - qx))} height="20" className="ch2-err-band" />

        {/* 量化值（橙块） */}
        <rect x={qx - 5} y={AXIS_Y - 34} width="10" height="26" rx="2" className="ch2-q-mark" />
        {/* 真实值（蓝点） */}
        <circle cx={tx} cy={AXIS_Y - 46} r="9" className="ch2-t-mark" />

        {/* 数值 */}
        <text x="530" y="70" textAnchor="middle" className="ch2-metric">
          {bits} bit · {levels} 级 · 舍入误差 {(err * 100).toFixed(1)}%
        </text>

        {/* 层间累积 */}
        <text x="530" y="172" textAnchor="middle" className="ch2-node-title">误差在层间逐级累积</text>
        {layers.map((l, i) => {
          const y = 196 + i * 30;
          const cx = 530;
          return (
            <g key={l.name}>
              <text x="120" y={y + 7} textAnchor="end" className="ch2-layer-label">{l.name}</text>
              <rect x={cx - l.w / 2} y={y} width={l.w} height="16" rx="4" className="ch2-err-bar" />
              {i < layers.length - 1 ? (
                <path d={`M${cx + l.w / 2} ${y + 8} C${cx + l.w / 2 + 30} ${y + 8} ${cx + l.w / 2 + 30} ${y + 22} ${cx + l.w / 2} ${y + 22}`} className="ch2-cascade" markerEnd="url(#ch2ArrowRed)" />
              ) : null}
            </g>
          );
        })}
        <text x="530" y="330" textAnchor="middle" className="ch2-cascade-label">误差带逐层加宽 → 最终导致困惑度严重退化</text>
      </svg>

      <p className="ch2-summary">
        <strong>结论：</strong>RTN 的误差无法在层内得到补偿，只能沿网络深度逐层累积，这正是其在 3–4bit 下失效、并催生 GPTQ 误差补偿机制的原因。
      </p>
    </div>
  );
};

export default Ch2Rtn;
