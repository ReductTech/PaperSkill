import React, { useMemo, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Dancer, Feedback, Slider, StageFloor, INK } from './danceKit';
import { clamp, gaussian, makeRng, Pt } from './driftCore';

const W = 716;
const H = 262;
const ROWS = [
  { label: 'SimCLR', fid: 11.05 }, { label: 'MoCo-v2', fid: 8.41 }, { label: 'latent-MAE 宽 256', fid: 8.46 }, { label: '宽 384', fid: 7.26 },
  { label: '宽 512', fid: 6.49 }, { label: '宽 640', fid: 6.3 }, { label: '宽 640 · 1280 轮', fid: 4.28 }, { label: '再加分类微调', fid: 3.36 },
];
const DIM = 24;
const toyVectors = () => {
  const r = makeRng(101);
  // Each toy sample: a 2-D semantic coordinate plus high-dimensional nuisance noise.
  return Array.from({ length: 9 }, (_, i) => {
    const cls = i === 0 || i <= 4 ? 0 : 1;
    const sem: Pt = [(cls ? 1 : -1) + gaussian(r) * 0.12, gaussian(r) * 0.16];
    return { cls, sem, noise: Array.from({ length: DIM }, () => gaussian(r)), scatter: [120 + r() * 480, 70 + r() * 150] as Pt };
  });
};

export function FeatureSpace(_: WidgetProps) {
  const samples = useMemo(toyVectors, []);
  const [s, setS] = useState(0);
  const phi = (v: typeof samples[number]) => [...v.sem.map(c => c * (0.15 + 5 * s)), ...v.noise.map(c => c * (1 - s) * 0.9)];
  const vec = samples.map(phi);
  const d = (a: number[], b: number[]) => Math.sqrt(a.reduce((sum, x, i) => sum + (x - b[i]) ** 2, 0));
  const dists = vec.slice(1).map(v => d(vec[0], v));
  const mean = dists.reduce((a, b) => a + b, 0) / dists.length;
  // Eq. (20)-(22): distances are normalized so temperature does not depend on feature scale.
  const raw = dists.map(x => Math.exp(-(x / mean) / 0.2));
  const z = raw.reduce((a, b) => a + b, 0);
  const weights = raw.map(k => k / z);
  const same = weights.reduce((sum, w, i) => sum + (samples[i + 1].cls === 0 ? w : 0), 0);
  const place = (i: number): Pt => {
    const v = samples[i];
    const target: Pt = [v.cls ? 500 + (v.sem[0] - 1) * 300 : 200 + (v.sem[0] + 1) * 300, 140 + v.sem[1] * 260];
    // Keep the tallest dancer's head and feet inside the short stage.
    return [v.scatter[0] + (target[0] - v.scatter[0]) * s, clamp(v.scatter[1] + (target[1] - v.scatter[1]) * s, 96, H - 10)];
  };
  const tone = same > 0.8 ? 'good' : same > 0.62 ? 'mid' : 'bad';
  return <div className="dk-two" style={{ gridTemplateColumns: '716px minmax(0,1fr)' }}>
    <div className="dk-col">
      <div className="dk-stage" style={{ height: H, flex: 'none' }}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`编码强度 ${s.toFixed(2)}，同类样本占权重 ${(same * 100).toFixed(0)}%`}>
          <StageFloor w={W} h={H} curtains={false} />
          {samples.slice(1).map((v, i) => <Dancer key={i} at={place(i + 1)} scale={0.9 + Math.min(weights[i], 0.5) * 2} color={v.cls === 0 ? INK.dancer : INK.aux} />)}
          <Dancer at={place(0)} scale={1.7} color={INK.text} />
        </svg>
      </div>
      <Slider label="编码器 φ：只看舞姿，忽略无关细节" value={s} min={0} max={1} step={0.01} onChange={setS} display={s.toFixed(2)} />
      <div className="dk-row"><span>同舞种（橙）占权重（演示）</span><b className="dk-big">{(same * 100).toFixed(0)}%</b></div>
      <Feedback tone={tone}>{tone === 'bad' ? '原始空间距离都差不多：核几乎不分同类异类，漂移缺少信号。' : tone === 'mid' ? '相似样本开始靠近，权重向同类集中。' : '相似样本彼此靠近，核把权重给了真正相似的样本。'}</Feedback>
    </div>
    <div className="dk-panel">
      <div className="dk-formula">
        ‖<SymbolHint meaning="φ：特征编码器，只在训练时用，推理不用。">φ</SymbolHint>(x) − sg(φ(x) + <SymbolHint meaning="V：在特征空间计算的漂移，φ(y⁺)、φ(y⁻) 作为正负样本。">V</SymbolHint>(φ(x)))‖²
      </div>
      <div className="dk-h">不同编码器的 FID（越低越好）</div>
      <div className="dk-bars">
        {ROWS.map((row, i) => <div key={row.label} className="dk-bar-row" style={{ gridTemplateColumns: '276px minmax(0,1fr) 84px', padding: 0 }}>
          <span style={{ whiteSpace: 'nowrap' }}>{row.label}</span>
          <span className="dk-bar-track"><span className="dk-bar-fill" style={{ display: 'block', width: `${(row.fid / 11.05) * 100}%`, background: i === ROWS.length - 1 ? INK.net : '#8ea0b8' }} /></span>
          <b style={{ textAlign: 'right' }}>{row.fid.toFixed(2)}</b>
        </div>)}
      </div>
      <p className="dk-muted">Table 3：B/2 生成器，100 轮。作者报告，没有特征编码器时未能在 ImageNet 上跑通。</p>
    </div>
  </div>;
}
