import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// OPT-175B WikiText2 困惑度（越低越好），数据来自论文 Table 5 / Table 7。
const ROWS = [
  { id: 'fp16', name: 'FP16', ppl: 8.34, color: '#27446e', txt: 'FP16 基线：8.34（未量化，参照线）。', cls: '' },
  { id: '3bit', name: '3-bit', ppl: 8.68, color: '#228d5c', txt: '3-bit 无分组：8.68，仅差 0.34，约 5× 压缩。', cls: 'good' },
  { id: 'g32', name: 'g32', ppl: 8.94, color: '#f07e47', txt: '2-bit g32（约 2.6bit）：8.94，分组使极端量化仍可用。', cls: '' },
  { id: 'g64', name: 'g64', ppl: 9.18, color: '#f07e47', txt: '2-bit g64：9.18，粒度变粗，误差上升。', cls: '' },
  { id: 'g128', name: 'g128', ppl: 9.58, color: '#c43f52', txt: '2-bit g128（约 2.2bit）：9.58，比 FP16 高 1.24，仍远优于 RTN 的崩溃。', cls: 'bad' },
];

const XS = [170, 360, 550, 740, 930];
const BAR_W = 80;
const BASE_Y = 200;
const MAX_PPL = 10;
const MAX_H = 140;

// 第七章：Group-size 分组量化。信息卡片 + SVG 柱状图 + 结论。
export const Ch7Group: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState('3bit');
  const cur = ROWS.find((r) => r.id === sel)!;

  return (
    <div className="ch7-page" data-testid="ch7-group" data-sel={sel}>
      <div className="ch7-cards">
        <div className="ch7-card mechanism">
          <strong>分组机制</strong>
          <span>对 g 个连续权重独立量化，每组独立确定缩放与零点，误差被限制在组内。</span>
        </div>
        <div className="ch7-card tradeoff">
          <strong>精度-存储权衡</strong>
          <span>g 越小误差越小，但每组的缩放与零点引入额外开销（约 +0.02~0.15 bit/权重）。</span>
        </div>
      </div>

      <svg className="ch7-svg" viewBox="0 0 1060 300" role="img" aria-label="不同 group size 下 OPT-175B 的困惑度对比">
        <text x="530" y="36" textAnchor="middle" className="ch7-title">OPT-175B WikiText2 困惑度（越低越好）</text>

        {/* 基线 */}
        <line x1="120" y1={BASE_Y} x2="1000" y2={BASE_Y} className="ch7-axis" />

        {ROWS.map((r, i) => {
          const h = (r.ppl / MAX_PPL) * MAX_H;
          const x = XS[i];
          const active = r.id === sel;
          return (
            <g key={r.id} opacity={active ? 1 : 0.4}>
              <rect x={x - BAR_W / 2} y={BASE_Y - h} width={BAR_W} height={h} rx="4" fill={r.color} />
              <text x={x} y={BASE_Y - h - 10} textAnchor="middle" className="ch7-value">{r.ppl.toFixed(2)}</text>
              <text x={x} y={BASE_Y + 24} textAnchor="middle" className="ch7-name">{r.name}</text>
            </g>
          );
        })}

        <text x="530" y="262" textAnchor="middle" className="ch7-note">g 越小（每组更细），极端量化精度越高，但额外开销越大</text>
      </svg>

      <div className="chip-row">
        {ROWS.map((r) => (
          <button key={r.id} className={`chip ${sel === r.id ? 'selected' : ''}`} onClick={() => setSel(r.id)}>
            {r.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${cur.cls}`}>{cur.txt}</div>

      <p className="ch7-conclusion">
        <strong>结论：</strong>校准数据仅 128 个 C4 片段（真 zero-shot）；group-size 是精度与存储之间的权衡参数——分组更细可换取更低困惑度，代价是额外的缩放与零点存储。
      </p>
    </div>
  );
};

export default Ch7Group;
