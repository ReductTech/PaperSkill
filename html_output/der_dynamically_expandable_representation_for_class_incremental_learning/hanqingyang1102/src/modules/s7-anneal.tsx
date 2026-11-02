import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

const SIGMA = (x: number) => 1 / (1 + Math.exp(-x));
const SMAX = 100;
const E_VALUES = [-1.4, -0.6, 0.05, 0.7, 1.5];

function sAt(b: number) {
  return 1 / SMAX + (SMAX - 1 / SMAX) * b;
}

export function S7Anneal(_props: WidgetProps) {
  const [b, setB] = useState(0.15);
  const s = sAt(b);
  const masks = E_VALUES.map(e => SIGMA(s * e));

  const x0 = 84, x1 = 618, y0 = 196, y1 = 56;
  const sx = (v: number) => x0 + v * (x1 - x0);
  const sy = (v: number) => y0 - (v / SMAX) * (y0 - y1);
  const path: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const bb = i / 40;
    path.push(`${i ? 'L' : 'M'}${sx(bb).toFixed(1)} ${sy(sAt(bb)).toFixed(1)}`);
  }

  const gy0 = 250, gy1 = 52;
  const gxx = (e: number) => 84 + ((e + 2) / 4) * 534;
  const gyy = (m: number) => gy0 - m * (gy0 - gy1);
  const sigPath: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const e = -2 + (i / 80) * 4;
    sigPath.push(`${i ? 'L' : 'M'}${gxx(e).toFixed(1)} ${gyy(SIGMA(s * e)).toFixed(1)}`);
  }

  const feedback = b < 0.2
    ? '开局：所有通道都停在 0.5，模型还在试探。'
    : b < 0.8
      ? '中段：曲线变陡，通道按 e 的正负分叉。'
      : '末段：接近阶跃，可以二值化剪枝。';

  return (
    <div className="der-page">
      <div className="der-grid" style={{ gridTemplateColumns: '1.06fr .94fr', gap: 22 }}>
        <div className="der-col" style={{ justifyContent: 'center', gap: 10 }}>
          <svg viewBox="0 0 660 240" style={{ width: '100%' }} role="img"
            aria-label={`s 随 epoch 内批次线性上升，当前 s 约 ${s.toFixed(1)}`}>
            <rect x="6" y="6" width="648" height="228" rx="14" fill="#fffdf9" stroke="#e3d8c6" />
            <text x="20" y="26" fontSize="20" fontWeight="700" fill="#27446e">s 在一个 epoch 内线性爬升</text>
            <line x1={x0} y1={y0} x2={x1} y2={y0} stroke="#d7deea" strokeWidth="2" />
            <line x1={x0} y1={y0} x2={x0} y2={y1} stroke="#d7deea" strokeWidth="2" />
            <path d={path.join(' ')} fill="none" stroke="#27446e" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx={sx(b)} cy={sy(s)} r="9" fill="#f07e47" stroke="#fff" strokeWidth="3" />
            <text x={sx(b) + (b > 0.75 ? -130 : 12)} y={sy(s) - 18} fontSize="22" fontWeight="700" fill="#b3572b">
              s = {s.toFixed(1)}
            </text>
            <text x={x0} y={y0 + 22} fontSize="19" fill="#68778f">第 1 个 batch</text>
            <text x={x1} y={y0 + 22} textAnchor="end" fontSize="19" fill="#68778f">第 B 个 batch</text>
            <text x={x0 - 10} y={y1 + 8} textAnchor="end" fontSize="18" fill="#68778f">smax</text>
            <text x={x0 - 10} y={y0 + 2} textAnchor="end" fontSize="18" fill="#68778f">0</text>
          </svg>

          <svg viewBox="0 0 660 300" style={{ width: '100%' }} role="img"
            aria-label="五个通道的掩码值随 s 增大从 0.5 分叉到 0 或 1">
            <rect x="6" y="6" width="648" height="288" rx="14" fill="#fffdf9" stroke="#e3d8c6" />
            <text x="20" y="30" fontSize="20" fontWeight="700" fill="#27446e">掩码值随 s 变陡：e 为负的通道被剪掉</text>
            <line x1="84" y1={gy0} x2="618" y2={gy0} stroke="#d7deea" strokeWidth="2" />
            <line x1="84" y1={gy0} x2="84" y2={gy1} stroke="#d7deea" strokeWidth="2" />
            <line x1="84" y1={gyy(0.5)} x2="618" y2={gyy(0.5)} stroke="#cbb797" strokeWidth="1.5" strokeDasharray="8 7" />
            <text x="612" y={gyy(0.5) - 8} textAnchor="end" fontSize="18" fill="#8a7a63">m = 0.5</text>
            <path d={sigPath.join(' ')} fill="none" stroke="#228d5c" strokeWidth="3.5" strokeLinecap="round" />
            {E_VALUES.map((e, i) => (
              <g key={e}>
                <circle cx={gxx(e)} cy={gyy(masks[i])} r="8" fill="#f07e47" stroke="#fff" strokeWidth="2.5" />
                <text x={gxx(e)} y={gy0 + 26} textAnchor="middle" fontSize="18" fill="#68778f">e{i + 1}</text>
              </g>
            ))}
            <text x="76" y={gy1 + 6} textAnchor="end" fontSize="17" fill="#68778f">1</text>
            <text x="76" y={gy0 + 2} textAnchor="end" fontSize="17" fill="#68778f">0</text>
          </svg>
        </div>

        <div className="der-col" style={{ justifyContent: 'center', gap: 10 }}>
          <div className="der-panel" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="der-row der-spread">
              <span className="der-p">当前 <SymbolHint meaning="sigmoid 陡峭系数，epoch 内从 1/smax 线性升到 smax">s</SymbolHint></span>
              <span className="der-num" style={{ fontSize: 30 }}>{s.toFixed(1)}</span>
            </div>
            {masks.map((m, i) => (
              <div key={i} className="der-row" style={{ gap: 10 }}>
                <span className="der-p" style={{ width: 52 }}>e{i + 1}</span>
                <div className={`der-meter ${m > 0.5 ? 'is-good' : 'is-bad'}`} style={{ flex: 1 }}>
                  <span style={{ width: `${m * 100}%` }} />
                </div>
                <span className="der-p" style={{ width: 70, textAlign: 'right' }}>{m.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="der-col" style={{ gap: 2 }}>
            <div className="der-row der-spread">
              <label className="der-p" htmlFor="der-batch">epoch 内 batch 进度</label>
              <span className="der-p der-em">{Math.round(b * 100)}%</span>
            </div>
            <input id="der-batch" className="der-slider" type="range" min={0} max={1} step={0.01}
              value={b} onChange={e => setB(Number(e.target.value))}
              aria-valuetext={`批次进度 ${Math.round(b * 100)}%，s = ${s.toFixed(1)}`} />
            <p className="der-p" style={{ color: '#3b2c1f', minHeight: 42 }}>{feedback}</p>
          </div>

          <div className="der-eq-block" style={{ fontSize: 24, lineHeight: 1.55 }}>
            s = 1/smax + (smax−1/smax)·(b−1)/(B−1)<br />
            g′ = σ(e)[1−σ(e)] / (s·σ(se)[1−σ(se)]) · g
          </div>
        </div>
      </div>
    </div>
  );
}
