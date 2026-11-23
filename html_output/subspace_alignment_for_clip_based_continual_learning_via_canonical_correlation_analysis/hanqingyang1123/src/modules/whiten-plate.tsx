import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const OFF = [
  [-1.1, 0.4], [-0.8, -0.5], [-0.5, 0.6], [-0.2, -0.3], [0.1, 0.2],
  [0.4, -0.6], [0.7, 0.5], [1.0, -0.2], [1.2, 0.3],
];

/** 白化后协方差为单位阵：等方差且去相关，因此画成圆而不是椭圆。 */
function Cloud({ cx, cy, s, color, white, rot }: { cx: number; cy: number; s: number; color: string; white: boolean; rot: number }) {
  const r = white ? 0 : rot;
  const rx = white ? 96 : 120 * s;
  const ry = white ? 96 : 52 * s;
  return (
    <g transform={`rotate(${r} ${cx} ${cy})`}>
      {OFF.map(([ox, oy], k) => (
        <circle key={k}
          cx={cx + (white ? ox * 74 : ox * 92 * s)}
          cy={cy + (white ? oy * 74 : oy * 44 * s)}
          r="7" fill={color} opacity="0.85" />
      ))}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth="3" strokeDasharray="8 6" opacity="0.9" />
      {white && <circle cx={cx} cy={cy} r="3" fill={color} />}
    </g>
  );
}

/** 白化：协方差变单位阵（缩放 + 去相关），之后才比较两版是否同步变化。 */
export function WhitenPlate({ moduleId }: { moduleId: string }) {
  const [sxA, setSxA] = useState(1.6);
  const [syB, setSyB] = useState(0.8);
  const [whitened, setWhitened] = useState(false);

  const a = whitened ? 1 : sxA;
  const b = whitened ? 1 : syB;
  const ratio = whitened ? 1 : sxA / syB;

  return (
    <div className="rs">
      <div className="rs-field rs-sheet-lines" style={{ left: 0, top: 0, width: 860, height: 622 }}>
        <svg viewBox="0 0 860 622" width="100%" height="100%" role="img" aria-label="两版协方差椭圆与白化">
          <rect x="26" y="26" width="808" height="570" rx="10" fill="#fdfdf8" stroke="#d7deea" strokeWidth="2" />
          <Cloud cx={300} cy={330} s={a} color="#27446e" white={whitened} rot={18} />
          <Cloud cx={600} cy={300} s={b} color="#228d5c" white={whitened} rot={-24} />
          <text x="300" y="540" textAnchor="middle" fontSize="28" fill="#27446e" fontWeight="700">画版 A · 图像特征</text>
          <text x="600" y="540" textAnchor="middle" fontSize="28" fill="#228d5c" fontWeight="700">字版 B · 文本特征</text>
          <path d="M120 96H740" stroke="#e8edf4" strokeWidth="1.5" strokeDasharray="6 8" />
          <path d="M430 70V560" stroke="#e8edf4" strokeWidth="1.5" strokeDasharray="6 8" />
          <text x="430" y="60" textAnchor="middle" fontSize="26" fill="#68778f">
            {whitened ? '白化后：等方差、去相关（协方差 = 单位阵）' : '两版尺度与倾斜不同：椭圆长短轴、方向都不一致'}
          </text>
        </svg>
      </div>

      <div className="rs-panel" style={{ left: 884, top: 0, width: 588, height: 622 }}>
        <p className="rs-formula" style={{ lineHeight: 1.6 }}>
          <SymbolHint meaning="W_x：画版（图像特征）的白化矩阵，D×D，使协方差变成单位阵。">W</SymbolHint>
          <sub>x</sub> = U<sub>x</sub>
          <SymbolHint meaning="Λ_x：Σxx 的特征值对角阵；取 -1/2 次幂做方差归一。">Λ</SymbolHint>
          <sub>x</sub><sup>−1/2</sup>U<sub>x</sub><sup>T</sup>
        </p>
        <p className="rs-t muted" style={{ marginTop: 4 }}>白化 = 缩放 + 去相关：协方差变成单位阵，再比“一起怎么变”。</p>

        <div style={{ marginTop: 10 }}>
          <div className="rs-readout"><span>画版伸缩</span><b>{sxA.toFixed(1)}×</b></div>
          <input className="rs-range" type="range" min={0.6} max={1.8} step={0.1} value={sxA}
            onChange={(e) => { setSxA(Number(e.target.value)); setWhitened(false); }} aria-label="画版伸缩" />
          <div className="rs-readout" style={{ marginTop: 10 }}><span>字版伸缩</span><b>{syB.toFixed(1)}×</b></div>
          <input className="rs-range" type="range" min={0.6} max={1.8} step={0.1} value={syB}
            onChange={(e) => { setSyB(Number(e.target.value)); setWhitened(false); }} aria-label="字版伸缩" />
        </div>

        <button className="rs-btn" style={{ marginTop: 12 }} onClick={() => setWhitened((v) => !v)}>
          {whitened ? '恢复原始尺度' : '白化两版'}
        </button>

        <div className={`rs-feedback ${ratio > 1.3 ? 'warn' : 'good'}`} style={{ marginTop: 12 }}>
          {ratio > 1.3
            ? '尺度与倾斜不齐时，协方差主要反映“谁更散、朝哪散”，不是两版的相关性。'
            : '白化只处理协方差；均值差由中心化处理，CCA 的直接目标是最大化两模态投影后的相关性。'}
        </div>
      </div>
    </div>
  );
}
