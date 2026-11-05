import React, { useMemo, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Arrow, Chips, Dancer, Feedback, Slider, StageFloor, TapeMark, INK } from './danceKit';
import { driftAt, Pt } from './driftCore';

const W = 906;
const H = 620;
const C: Pt = [W / 2, H / 2 + 6];
const R = 225;
const N = 14;
type Field = 'mean' | 'paper';

export function OpenLimits(_: WidgetProps) {
  const marks = useMemo(() => Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    return [C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R] as Pt;
  }), []);
  const [rho, setRho] = useState(0.15);
  const [field, setField] = useState<Field>('mean');
  const q = marks.map(m => [C[0] + (m[0] - C[0]) * rho, C[1] + (m[1] - C[1]) * rho] as Pt);
  const mean = (pts: Pt[]): Pt => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  const vectors: Pt[] = q.map(x => {
    if (field === 'mean') { const mp = mean(marks); const mq = mean(q); return [mp[0] - mq[0], mp[1] - mq[1]]; }
    return driftAt(x, marks, q, 90).V;
  });
  const size = vectors.reduce((s, v) => s + v[0] ** 2 + v[1] ** 2, 0) / N;
  const zero = size < 1e-6;
  const matched = rho > 0.985;
  const tone = matched ? 'good' : zero ? 'bad' : 'mid';
  return <div className="dk-split">
    <div className="dk-stage">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`舞者队形半径比例 ${rho.toFixed(2)}，当前平均漂移平方 ${size.toFixed(1)}`}>
        <StageFloor w={W} h={H} />
        {marks.map((m, i) => <TapeMark key={i} at={m} />)}
        {q.map((p, i) => <g key={i}><Arrow from={[p[0], p[1] - 14]} vec={vectors[i]} color={INK.net} width={5} maxLen={150} /><Dancer at={p} scale={1.1} /></g>)}
      </svg>
      <div className="dk-hint">标记围成一圈，队形的重心始终相同</div>
    </div>
    <div className="dk-panel">
      <div className="dk-formula">q = p ⇒ V = 0 <span className="dk-green">成立</span></div>
      <div className="dk-formula">V = 0 ⇒ q = p <span className="dk-red">一般不成立</span></div>
      <Chips value={field} options={[{ id: 'mean', label: '反例：均值差场' }, { id: 'paper', label: '论文的核化场' }]} onChange={setField} />
      <Slider label="队形张开程度" value={rho} min={0} max={1} step={0.01} onChange={setRho} display={rho.toFixed(2)} />
      <div className="dk-row"><span>全队 <SymbolHint meaning="‖V‖²：漂移场平方范数的平均值，也就是训练损失的数值。">‖V‖²</SymbolHint></span><b className="dk-big">{size.toFixed(1)}</b></div>
      <Feedback tone={tone}>{matched ? '队形与标记重合：两种场都为零，这是命题保证的方向。'
        : zero && field === 'paper' ? '全队挤在圆心：对称让核化场也恰好为零。队形一张开，它就不再为零。'
        : zero ? '均值差场为零，队形却远未匹配：损失为零不等于学会了。'
          : '核化场仍能看出形状差异，继续推动队形张开。'}</Feedback>
      <p>论文只对核化构造给出启发式论证（附录 C.1）。何时 V→0 能推出 q→p，漂移场、核、编码器和架构如何选，仍是开放问题。</p>
    </div>
  </div>;
}
