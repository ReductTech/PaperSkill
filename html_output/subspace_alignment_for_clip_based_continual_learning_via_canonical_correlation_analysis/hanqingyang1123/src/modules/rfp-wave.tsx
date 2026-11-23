import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const XS = [-2.3, -1.85, -1.4, -0.95, -0.5, -0.05, 0.4, 0.85, 1.3, 1.75, 2.2];
const CLS = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];

/** 随机傅里叶投影：用余弦随机特征重新排布一维上交错的两类。 */
export function RfpWave({ moduleId }: { moduleId: string }) {
  const [sigma, setSigma] = useState(0.9);

  const mapped = XS.map((x) => Math.cos(x * sigma * 2.2));
  const a = mapped.filter((_, i) => CLS[i] === 0);
  const b = mapped.filter((_, i) => CLS[i] === 1);
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const variance = (v: number[]) => {
    const m = mean(v);
    return v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length;
  };
  const meanA = mean(a);
  const meanB = mean(b);
  // Cohen's d：均值差 / 合并标准差，用来描述两类分开的程度，而不是准确率。
  const sep = Math.abs(meanA - meanB) / Math.sqrt((variance(a) + variance(b)) / 2 + 1e-6);

  const ax = (x: number) => 350 + x * 110;
  const ay = (y: number) => 250 - y * 130;

  return (
    <div className="rs">
      <div className="rs-panel" style={{ left: 0, top: 0, width: 700, height: 500 }}>
        <p className="rs-t muted">原始一维特征：两类交错，单一阈值分不开</p>
        <svg viewBox="0 0 700 380" width="100%" height="360" role="img" aria-label="一维特征上两类交错">
          <path d="M60 250H650" stroke="#b9c4d4" strokeWidth="2" />
          <path d="M60 250V90" stroke="#e8edf4" strokeWidth="1.5" />
          <path d="M352 90V330" stroke="#c43f52" strokeWidth="2.5" strokeDasharray="7 6" />
          <text x="360" y="96" fontSize="26" fill="#c43f52">任何阈值都分不开</text>
          {XS.map((x, i) => (
            <circle key={i} cx={ax(x)} cy={250 + (i % 3) * 16 - 16} r="11"
              fill={CLS[i] === 0 ? '#27446e' : '#228d5c'} />
          ))}
          <text x="64" y="300" className="rs-tag">画版侧特征</text>
        </svg>
      </div>

      <div className="rs-panel" style={{ left: 772, top: 0, width: 700, height: 500 }}>
        <p className="rs-t muted">φ_rfp 之后：两类在余弦特征上被重新排布</p>
        <svg viewBox="0 0 700 380" width="100%" height="360" role="img" aria-label="随机余弦特征后两类的位置">
          <path d="M60 190H650" stroke="#b9c4d4" strokeWidth="2" />
          <path d="M60 190V40" stroke="#e8edf4" strokeWidth="1.5" />
          {XS.map((x, i) => (
            <circle key={i} cx={ax(x)} cy={ay(mapped[i])} r="11"
              fill={CLS[i] === 0 ? '#27446e' : '#228d5c'} />
          ))}
          <path d={XS.map((x, i) => `${i === 0 ? 'M' : 'L'}${ax(x)} ${ay(Math.cos(x * sigma * 2.2))}`).join(' ')}
            fill="none" stroke="#7c3aed" strokeWidth="3" opacity="0.55" />
          <text x="64" y="60" fontSize="26" fill="#7c3aed">水平线仅作参考：默认参数下两类仍有重叠</text>
        </svg>
      </div>

      <div className="rs-panel" style={{ left: 0, top: 516, width: 1472, height: 106 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <span className="rs-t" style={{ whiteSpace: 'nowrap' }}>波纹密度 σ</span>
          <input className="rs-range" style={{ flex: 1 }} type="range" min={0.2} max={1.8} step={0.05}
            value={sigma} onChange={(e) => setSigma(Number(e.target.value))} aria-label="演示波纹密度" />
          <span className="rs-num" style={{ minWidth: 92 }}>{sigma.toFixed(2)}</span>
          <span className={`rs-t ${sep > 0.8 ? 'rs-green' : 'rs-orange'}`} style={{ whiteSpace: 'nowrap' }}>
            分离度 d {sep.toFixed(2)}（示意）
          </span>
        </div>
        <p className="rs-t muted" style={{ marginTop: 6 }}>
          φ(z)=√(2/D′)cos(<SymbolHint meaning="W：随机频率矩阵，元素服从 N(0, σ^-2)。">W</SymbolHint>z+
          <SymbolHint meaning="b：随机相位，均匀取自 [0, 2π]。">b</SymbolHint>)，论文 D′=6144；此处 σ 只调演示波纹密度。
        </p>
      </div>
    </div>
  );
}
