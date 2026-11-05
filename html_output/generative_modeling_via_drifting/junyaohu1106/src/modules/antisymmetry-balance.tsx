import React, { useMemo, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Dancer, Feedback, StageFloor, TapeMark, useFrame, INK } from './danceKit';
import { clamp, cluster, dist, driftStep, gaussian, makeRng, meanSquaredDrift, Pt } from './driftCore';

const W = 830;
const H = 620;
const CASES = [
  { id: 'anti', label: 'V⁺ − V⁻', a: 1, b: 1, fid: 8.46 },
  { id: 'a15', label: '1.5V⁺ − V⁻', a: 1.5, b: 1, fid: 41.05 },
  { id: 'r15', label: 'V⁺ − 1.5V⁻', a: 1, b: 1.5, fid: 46.28 },
  { id: 'a2', label: '2V⁺ − V⁻', a: 2, b: 1, fid: 86.16 },
  { id: 'r2', label: 'V⁺ − 2V⁻', a: 1, b: 2, fid: 112.84 },
  { id: 'aonly', label: 'V⁺ 仅吸引', a: 1, b: 0, fid: 177.14 },
];
const TAU = 60;

export function AntisymmetryBalance(_: WidgetProps) {
  const marks = useMemo(() => [...cluster(61, 12, 240, 200, 44), ...cluster(62, 12, 600, 400, 44)], []);
  const [caseId, setCaseId] = useState('anti');
  const current = CASES.find(c => c.id === caseId) ?? CASES[0];
  const [pts, setPts] = useState<Pt[]>(() => marks.map(m => [m[0], m[1]] as Pt));
  const seed = useRef(1);
  const choose = (id: string) => { setCaseId(id); setPts(marks.map(m => [m[0], m[1]] as Pt)); };
  const scatter = () => {
    const r = makeRng(600 + seed.current++);
    setPts(marks.map(m => [clamp(m[0] + gaussian(r) * 70, 30, W - 30), clamp(m[1] + gaussian(r) * 70, 56, H - 20)] as Pt));
  };
  useFrame(() => {
    setPts(prev => driftStep(prev, marks, TAU, 0.3, current.a, current.b, false).map(p => [clamp(p[0], 30, W - 30), clamp(p[1], 56, H - 20)] as Pt));
  }, true);
  const loss = meanSquaredDrift(pts, marks, TAU, current.a, current.b, false);
  const covered = marks.filter(m => pts.some(p => dist(p, m) < 16)).length;
  const balanced = current.a === current.b;
  const tone = balanced ? (covered >= 18 ? 'good' : 'mid') : 'bad';
  return <div className="dk-split" style={{ gridTemplateColumns: 'minmax(0,1fr) 618px' }}>
    <div className="dk-stage">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`当前漂移场 ${current.label}，${covered} 个标记有人站，演示损失 ${loss.toFixed(2)}`}>
        <StageFloor w={W} h={H} />
        {marks.map((m, i) => <TapeMark key={i} at={m} />)}
        {pts.map((p, i) => <Dancer key={i} at={p} scale={1.1} />)}
      </svg>
      <button type="button" className="dk-btn" style={{ position: 'absolute', right: 60, bottom: 16 }} onClick={scatter}>打乱队形</button>
    </div>
    <div className="dk-panel">
      <div className="dk-formula"><SymbolHint meaning="q=p：生成分布等于数据分布。">q = p</SymbolHint> ⇒ <SymbolHint meaning="反对称 V_{p,q} = −V_{q,p}。q=p 时 V 等于自身的相反数，只能为 0。">V<sub>p,q</sub> = −V<sub>q,p</sub></SymbolHint> = 0</div>
      <div className="dk-h">点一行：把系数改掉再排练</div>
      <div className="dk-bars">
        {CASES.map(c => <button key={c.id} type="button" aria-pressed={c.id === caseId} className={`dk-bar-row ${c.id === caseId ? 'is-on' : ''}`} style={{ gridTemplateColumns: '216px minmax(0,1fr) 96px' }} onClick={() => choose(c.id)}>
          <span>{c.label}</span>
          <span className="dk-bar-track"><span className="dk-bar-fill" style={{ display: 'block', width: `${(c.fid / 177.14) * 100}%`, background: c.a === c.b ? INK.net : INK.bad }} /></span>
          <b style={{ textAlign: 'right' }}>{c.fid.toFixed(2)}</b>
        </button>)}
      </div>
      <div className="dk-muted">FID 越低越好（论文 Table 1；B/2，100 轮）</div>
      <div className="dk-row"><span>演示：有人站的标记</span><b>{covered} / {marks.length}</b></div>
      <Feedback tone={tone}>{balanced
        ? (covered >= 18 ? '吸引与排斥相抵：q=p 时队形纹丝不动。' : '反对称场正把队形拉回标记，趋向平衡。')
        : current.b === 0 ? '没有排斥：舞者挤向密集处，许多标记没人站。' : '系数不等：q=p 不再是平衡点，队形离开了标记。'}</Feedback>
    </div>
  </div>;
}
