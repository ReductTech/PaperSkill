import React, { useMemo, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Dancer, Feedback, Slider, INK } from './danceKit';

const W = 880;
const H = 400;
const pdf = (x: number, m: number, s: number) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
const cond = (x: number) => pdf(x, 1.2, 0.55);
const uncond = (x: number) => 0.5 * pdf(x, 1.2, 0.55) + 0.5 * pdf(x, -1.2, 0.9);
const X = (x: number) => ((x + 4) / 8) * W;

export function CfgNegatives(_: WidgetProps) {
  const [gamma, setGamma] = useState(0);
  const alpha = 1 / (1 - gamma);
  const xs = useMemo(() => Array.from({ length: 161 }, (_, i) => -4 + i * 0.05), []);
  const q = (x: number) => alpha * cond(x) - (alpha - 1) * uncond(x);
  const peak = Math.max(...xs.map(q));
  // The vertical scale shrinks only when the sharpened peak would leave the stage.
  const Y = (v: number) => H - 56 - v * Math.min(330, 300 / peak);
  const path = (f: (x: number) => number) => xs.map(x => `${X(x).toFixed(1)},${Y(Math.max(f(x), -0.1)).toFixed(1)}`).join(' ');
  const negative = Math.min(...xs.map(q)) < -0.005;
  const others = Math.round(gamma * 20);
  return <div className="dk-split" style={{ gridTemplateColumns: 'minmax(0,1fr) 568px' }}>
    <div className="dk-col">
      <div className="dk-stage" style={{ height: H, flex: 'none', background: '#fbfcfe', borderColor: INK.axis }}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`alpha 等于 ${alpha.toFixed(2)}，目标分布峰值 ${peak.toFixed(2)}`}>
          <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} stroke={INK.axis} strokeWidth={3} />
          <polyline points={path(uncond)} fill="none" stroke={INK.aux} strokeWidth={4} strokeDasharray="10 8" />
          <polyline points={path(cond)} fill="none" stroke={INK.mark} strokeWidth={5} />
          <polyline points={path(q)} fill="none" stroke={INK.dancer} strokeWidth={7} />
          <text x={22} y={42} fontSize={28} fontWeight={750} fill={INK.aux}>p(·|∅) 其他舞团</text>
          <text x={22} y={80} fontSize={28} fontWeight={750} fill={INK.mark}>p(·|c) 本舞种</text>
          <text x={22} y={118} fontSize={28} fontWeight={750} fill="#c85d29">q(·|c) 学到的目标</text>
          <text x={W / 2} y={H - 14} textAnchor="middle" fontSize={28} fill={INK.muted}>一维示意坐标（曲线按式 16 计算）</text>
        </svg>
      </div>
      <div className="dk-row"><span>负样本里每 20 人</span><span className="dk-purple" style={{ fontWeight: 750 }}>其他舞团 {others} 人</span></div>
      <svg viewBox="0 0 880 76" width="100%" height="76" role="img" aria-label={`20 名负样本中有 ${others} 名来自其他舞团`}>
        {Array.from({ length: 20 }, (_, i) => <Dancer key={i} at={[24 + i * 44, 70]} scale={1.2} color={i < others ? INK.aux : INK.dancer} />)}
      </svg>
    </div>
    <div className="dk-panel">
      <div className="dk-formula"><SymbolHint meaning="q̃：负样本实际来自的分布。">q̃</SymbolHint> = (1−<SymbolHint meaning="γ：混合率，属于 [0,1)。">γ</SymbolHint>) q<sub>θ</sub> + γ p(·|∅)</div>
      <div className="dk-formula"><SymbolHint meaning="q_θ：类别条件生成分布。">q<sub>θ</sub></SymbolHint> = <SymbolHint meaning="α = 1/(1−γ)，即 CFG scale，α ≥ 1。">α</SymbolHint> p(·|c) − (α−1) p(·|∅)</div>
      <Slider label="混入其他舞团的比例 γ" value={gamma} min={0} max={0.8} step={0.01} onChange={setGamma} display={gamma.toFixed(2)} />
      <div className="dk-row"><span>CFG 强度 α = 1/(1−γ)</span><b className="dk-big dk-orange">{alpha.toFixed(2)}</b></div>
      <Feedback tone={gamma === 0 ? 'mid' : 'good'}>{gamma === 0
        ? 'γ=0：负样本全来自生成样本，目标就是本舞种分布。'
        : negative ? 'α>1：本舞种的峰被推高；线性组合在别处已出现负值，只能近似。' : '其他舞团排斥后，目标更集中到本舞种的特征区域。'}</Feedback>
      <p>引导发生在<b>训练</b>，推理仍是 1 次调用。论文中 L/2 在 α=1.0、B/2 在 α=1.1 取到最优 FID；继续增大 α 提高 IS、损失 FID。</p>
    </div>
  </div>;
}
