import React, { useMemo, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Dancer, Feedback, Slider, StageFloor, TapeMark, keyMove, useDrag, INK } from './danceKit';
import { clamp, cluster, gaussian, makeRng, meanNearest, Pt } from './driftCore';

const W = 906;
const H = 620;
const TRACKED = 3;

function Flag({ at, label, onMove }: { at: Pt; label: string; onMove: (p: Pt) => void }) {
  const drag = useDrag(p => onMove([clamp(p[0], 240, W - 70), clamp(p[1], 70, H - 40)]));
  return <g className="dk-handle" transform={`translate(${at[0]} ${at[1]})`} role="button" tabIndex={0} aria-label={`拖动编舞旗 ${label}，它决定映射 f 把一半签号送到哪里`}
    onKeyDown={keyMove(at, p => onMove([clamp(p[0], 240, W - 70), clamp(p[1], 70, H - 40)]), W, H)} {...drag}>
    <circle r={34} fill="#ffffff" fillOpacity={0.55} className="dk-ring" stroke="#27446e" strokeDasharray="6 5" strokeWidth={2} />
    <path d="M-5 22 V-34 L25 -22 L-5 -10" fill="#7c3aed" stroke="#5b2bb0" strokeWidth={3} strokeLinejoin="round" />
    <text x={2} y={54} textAnchor="middle" fontSize={28} fontWeight={750} fill="#5b2bb0" stroke="#f6efe2" strokeWidth={5} paintOrder="stroke">{label}</text>
  </g>;
}

export function PushforwardFlags(_: WidgetProps) {
  const lots = useMemo(() => { const r = makeRng(31); return Array.from({ length: 20 }, () => [gaussian(r), gaussian(r)] as Pt); }, []);
  const marks = useMemo(() => [...cluster(32, 10, 400, 210, 40), ...cluster(33, 10, 720, 430, 40)], []);
  const [a, setA] = useState<Pt>([330, 470]);
  const [b, setB] = useState<Pt>([620, 170]);
  const [spread, setSpread] = useState(70);
  const q = lots.map(e => { const c = e[0] > 0 ? b : a; return [c[0] + spread * (e[0] - Math.sign(e[0]) * 0.8), c[1] + spread * e[1]] as Pt; });
  // Both directions, so piling everyone onto one group of marks still counts as far off.
  const gap = (meanNearest(q, marks) + meanNearest(marks, q)) / 2;
  const tracked = q[TRACKED];
  const tone = gap < 34 ? 'good' : gap < 70 ? 'mid' : 'bad';
  return <div className="dk-split">
    <div className="dk-stage">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="舞台：抽签决定噪声，映射 f 把每支签送到舞台位置">
        <StageFloor w={W} h={H} />
        <rect x={60} y={120} width={150} height={150} rx={14} fill="#fffdf6" stroke="#b9a98c" strokeWidth={3} />
        {lots.map((e, i) => <circle key={i} cx={135 + e[0] * 26} cy={195 + e[1] * 26} r={i === TRACKED ? 9 : 5} fill={i === TRACKED ? INK.net : '#a18f73'} />)}
        <text x={135} y={108} textAnchor="middle" fontSize={28} fontWeight={750} fill={INK.text}>签筒 ε</text>
        <path d={`M${135 + lots[TRACKED][0] * 26} ${195 + lots[TRACKED][1] * 26} Q ${(tracked[0] + 135) / 2} 40 ${tracked[0]} ${tracked[1] - 44}`} fill="none" stroke={INK.net} strokeWidth={3} strokeDasharray="8 7" />
        {marks.map((m, i) => <TapeMark key={i} at={m} />)}
        {q.map((p, i) => <Dancer key={i} at={[clamp(p[0], 30, W - 30), clamp(p[1], 56, H - 8)]} scale={1.15} color={i === TRACKED ? INK.net : INK.dancer} />)}
        <Flag at={a} label="f 左旗" onMove={setA} />
        <Flag at={b} label="f 右旗" onMove={setB} />
      </svg>
      <div className="dk-hint">拖紫旗：改的是 f，全队一起动</div>
    </div>
    <div className="dk-panel">
      <div className="dk-formula">
        <SymbolHint meaning="q：网络输出的分布，即推前分布。这里是舞者站位的分布。">q</SymbolHint> = <SymbolHint meaning="f_#：由映射 f 诱导的推前操作，把一个分布变成另一个分布。">f<sub>#</sub></SymbolHint> <SymbolHint meaning="p_ε：噪声先验，这里用抽签表示。">p<sub>ε</sub></SymbolHint> ≈ <SymbolHint meaning="p_data：数据分布，这里用蓝色胶带标记表示。">p<sub>data</sub></SymbolHint>
      </div>
      <p>每支签 ε 固定，<span className="dk-green">绿色舞者</span>总由同一支签决定。队形就是 q，蓝色标记来自数据。</p>
      <Slider label="队形松紧 s" value={spread} min={15} max={110} step={1} onChange={setSpread} display={`${spread}`} />
      <div className="dk-row"><span>队形与标记的平均距离（演示）</span><b className="dk-big">{gap.toFixed(0)}</b></div>
      <Feedback tone={tone}>{tone === 'good' ? '队形贴合两团标记：q 已接近数据分布。' : tone === 'mid' ? '差距在缩小，继续移动旗子或调松紧。' : '队形偏离标记，或有一团标记没人管：f 还需要更新。'}</Feedback>
      <p className="dk-muted">演示用 f(ε)=c+sε：ε₁ 的正负选旗子，再减去半边均值；真实 f 是神经网络。</p>
    </div>
  </div>;
}
