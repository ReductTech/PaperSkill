import React from 'react';
import type { WidgetProps } from './registry';

// OPT-175B WikiText2 困惑度（越低越好），数据来自论文 Table 3。
const BARS = [
  { name: 'FP16', ppl: 8.34, color: '#27446e' },
  { name: 'RTN 4bit', ppl: 10.54, color: '#c43f52' },
  { name: 'GPTQ 4bit', ppl: 8.37, color: '#228d5c' },
  { name: 'GPTQ 3bit', ppl: 8.68, color: '#f07e47' },
];

const LATENCY = [
  { gpu: 'A100', from: '230ms', to: '71ms', speedup: '3.24×', gpus: '5 卡 → 1 卡' },
  { gpu: 'A6000', from: '589ms', to: '130ms', speedup: '4.53×', gpus: '8 卡 → 2 卡' },
];

const XS = [200, 430, 660, 890];
const BAR_W = 110;
const BASE_Y = 200;
const MAX_PPL = 12;
const MAX_H = 150;

// 第九章：实验结果。信息卡片 + SVG 困惑度对比 + 延迟对比 + 数据结论。
export const Ch9Results: React.FC<WidgetProps> = () => {
  return (
    <div className="ch9-page" data-testid="ch9-results">
      <div className="ch9-cards">
        <div className="ch9-card setup">
          <strong>实验设置</strong>
          <span>128 个随机 2048-token 的 C4 片段校准，per-row 非对称量化网格，单张 A100。</span>
        </div>
        <div className="ch9-card metric">
          <strong>评估指标</strong>
          <span>WikiText2 / PTB / C4 困惑度（越低越好），LAMBADA（越高越好）。</span>
        </div>
      </div>

      <svg className="ch9-svg" viewBox="0 0 1060 300" role="img" aria-label="OPT-175B 各量化方案的困惑度对比">
        <text x="530" y="36" textAnchor="middle" className="ch9-title">OPT-175B WikiText2 困惑度（越低越好）</text>

        <line x1="120" y1={BASE_Y} x2="1000" y2={BASE_Y} className="ch9-axis" />

        {BARS.map((b, i) => {
          const h = (b.ppl / MAX_PPL) * MAX_H;
          const x = XS[i];
          return (
            <g key={b.name}>
              <rect x={x - BAR_W / 2} y={BASE_Y - h} width={BAR_W} height={h} rx="4" fill={b.color} />
              <text x={x} y={BASE_Y - h - 10} textAnchor="middle" className="ch9-value">{b.ppl.toFixed(2)}</text>
              <text x={x} y={BASE_Y + 24} textAnchor="middle" className="ch9-name">{b.name}</text>
            </g>
          );
        })}

        <text x="530" y="268" textAnchor="middle" className="ch9-note">
          RTN 3bit 困惑度激增到 7.3×10³（崩溃），无法放入同一尺度；GPTQ 4bit 仅比 FP16 高 0.03
        </text>
      </svg>

      <div className="ch9-latency" aria-label="端到端生成延迟对比">
        {LATENCY.map((l) => (
          <div key={l.gpu} className="ch9-latency-card">
            <header><span>{l.gpu}</span><small>{l.gpus}</small></header>
            <div className="ch9-latency-body">
              <div><small>FP16 延迟</small><strong>{l.from}</strong></div>
              <b>→</b>
              <div><small>3bit 延迟</small><strong>{l.to}</strong></div>
            </div>
            <div className="ch9-speedup">加速 {l.speedup}</div>
          </div>
        ))}
      </div>

      <p className="ch9-conclusion">
        <strong>数据支持的核心结论：</strong>更大模型更易量化；GPTQ 在 3–4bit 下相对 RTN 具有显著优势——4bit 仅损失 0.03，3bit 仍可用，而 RTN 3bit 直接崩溃。
      </p>
    </div>
  );
};

export default Ch9Results;
