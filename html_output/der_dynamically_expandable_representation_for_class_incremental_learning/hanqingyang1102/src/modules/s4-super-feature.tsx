import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

export function S4SuperFeature(_props: WidgetProps) {
  const [t, setT] = useState(2);

  const DX = 60, DW = 240, STEP = 270;
  const SEGY = 236, SEGH = 46;
  const segEnd = DX + (t - 1) * STEP + DW;

  return (
    <div className="der-page">
      <div className="der-col" style={{ height: '100%', padding: '18px 28px 16px', boxSizing: 'border-box', gap: 10 }}>
        <div className="der-row der-spread">
          <div className="der-row" style={{ gap: 14 }}>
            <label className="der-p" htmlFor="der-step">第 t 步</label>
            <input id="der-step" className="der-slider" style={{ width: 260 }} type="range" min={1} max={4} step={1}
              value={t} onChange={e => setT(Number(e.target.value))}
              aria-valuetext={`第 ${t} 步，共 ${t} 个提取器`} />
            <span className="der-num" style={{ fontSize: 34 }}>{t}</span>
          </div>
          <div className="der-row" style={{ gap: 26 }}>
            <span className="der-p">超特征 = <b>{t}</b> 段拼接</span>
            <span className="der-p">维度 = Σ dᵢ</span>
            <span className="der-p">输出 = 全部已见类</span>
          </div>
        </div>

        <svg viewBox="0 0 1400 372" style={{ width: '100%', flex: 1 }} role="img"
          aria-label={`第 ${t} 步：${t} 个提取器的输出逐段拼接成超特征，送入分类器`}>
          {Array.from({ length: 4 }, (_, i) => {
            const active = i < t;
            const isNew = i === t - 1;
            const x = DX + i * STEP;
            return (
              <g key={i} opacity={active ? 1 : 0.25}>
                <rect x={x} y="16" width={DW} height="150" rx="12"
                  fill={isNew ? '#eaf5ec' : '#eef3fb'} stroke={isNew ? '#228d5c' : '#27446e'} strokeWidth={isNew ? 3 : 2} />
                <rect x={x + 14} y="34" width={DW - 28} height="88" rx="8" fill={isNew ? '#cde6d3' : '#cfdcf0'} />
                <rect x={x + DW / 2 - 34} y="136" width="68" height="10" rx="5" fill="#c99a35" />
                <text x={x + DW / 2} y="196" textAnchor="middle" fontSize="23" fontWeight="700"
                  fill={isNew ? '#1b6b47' : '#27446e'}>{i === 0 ? 'Φ1' : `F${i + 1}`}</text>
                <text x={x + DW / 2} y="222" textAnchor="middle" fontSize="19" fill="#68778f">
                  {isNew ? '训练' : '冻结'}
                </text>
                <line x1={x + DW / 2} y1="226" x2={x + DW / 2} y2={SEGY} stroke="#c9b79b" strokeWidth="2" strokeDasharray="6 5" />
              </g>
            );
          })}

          {Array.from({ length: t }, (_, i) => {
            const x = DX + i * STEP;
            const isNew = i === t - 1;
            return (
              <g key={`seg${i}`}>
                <rect x={x} y={SEGY} width={DW} height={SEGH} rx="8" fill={isNew ? '#228d5c' : '#8ea9cf'} />
                <text x={x + DW / 2} y={SEGY + 31} textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">第 {i + 1} 段特征</text>
              </g>
            );
          })}

          <text x={DX} y={SEGY + SEGH + 36} fontSize="19" fill="#68778f">拼接：旧段冻结，只追加新段</text>

          <path d={`M${segEnd} ${SEGY + SEGH / 2} H1150`} stroke="#f07e47" strokeWidth="3" />
          <rect x="1150" y={SEGY - 12} width="220" height="96" rx="12" fill="#fff6ec" stroke="#f07e47" strokeWidth="2.5" />
          <text x="1260" y={SEGY + 18} textAnchor="middle" fontSize="21" fontWeight="700" fill="#b3572b">H(t) → softmax</text>
          <text x="1260" y={SEGY + 48} textAnchor="middle" fontSize="18" fill="#5b6b80">全部已见类</text>
        </svg>

        <div className="der-eq-block" style={{ fontSize: 28 }}>
          <span className="der-formula-sym">u</span> = [ Φ(t−1)(x) , F(t)(x) ]　　{' '}
          <span className="der-formula-sym">p</span>(y|x) = softmax( H(t)(
          <SymbolHint meaning="超特征：把各个提取器的输出逐维拼接成的向量">u</SymbolHint>) )
        </div>
      </div>
    </div>
  );
}
