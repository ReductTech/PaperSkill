import React, { useMemo, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Arrow, Dancer, Feedback, Slider, StageFloor, TapeMark, useFrame, INK } from './danceKit';
import { cluster, driftAt, meanSquaredDrift, norm, Pt } from './driftCore';

const W = 906;
const H = 620;
const TAU = 90;
const HERO = 0;
const fields = (pts: Pt[], marks: Pt[]) => pts.map(p => driftAt(p, marks, pts, TAU).V);

export function FrozenTarget(_: WidgetProps) {
  const marks = useMemo(() => [...cluster(71, 10, 250, 210, 38), ...cluster(72, 10, 660, 400, 38)], []);
  const start = useMemo(() => cluster(73, 20, 460, 300, 60), []);
  const [pts, setPts] = useState<Pt[]>(start);
  const [eta, setEta] = useState(0.5);
  const [iter, setIter] = useState(0);
  const [history, setHistory] = useState<number[]>(() => [meanSquaredDrift(start, marks, TAU, 1, 1, false)]);
  const [queue, setQueue] = useState(0);
  const anim = useRef(0);
  const [moving, setMoving] = useState<{ from: Pt[]; to: Pt[] } | null>(null);
  const V = useMemo(() => fields(pts, marks), [pts, marks]);
  const heroX = pts[HERO];
  const heroV = V[HERO];
  const target: Pt = [heroX[0] + heroV[0], heroX[1] + heroV[1]];
  const distSq = (heroX[0] - target[0]) ** 2 + (heroX[1] - target[1]) ** 2;
  const shown = moving ? moving.from.map((p, i) => {
    const t = 1 - (1 - anim.current) ** 2;
    return [p[0] + (moving.to[i][0] - p[0]) * t, p[1] + (moving.to[i][1] - p[1]) * t] as Pt;
  }) : pts;
  useFrame(() => {
    if (moving) {
      anim.current = Math.min(1, anim.current + 0.09);
      if (anim.current >= 1) {
        setPts(moving.to);
        setHistory(h => [...h, meanSquaredDrift(moving.to, marks, TAU, 1, 1, false)].slice(-60));
        setIter(i => i + 1);
        setMoving(null);
      } else setMoving({ ...moving });
    } else if (queue > 0) {
      setQueue(q => Math.max(0, q - 1));
      anim.current = 0;
      setMoving({ from: pts, to: pts.map((p, i) => [p[0] + eta * V[i][0], p[1] + eta * V[i][1]] as Pt) });
    }
  }, Boolean(moving) || queue > 0);
  const reset = () => { setPts(start); setIter(0); setQueue(0); setMoving(null); setHistory([meanSquaredDrift(start, marks, TAU, 1, 1, false)]); };
  const top = Math.max(...history, 1);
  const bottom = Math.min(...history, top * 0.999);
  const chart = history.map((v, i) => `${(i / Math.max(history.length - 1, 1)) * 500},${84 - ((Math.log(v + 1e-3) - Math.log(bottom + 1e-3)) / (Math.log(top + 1e-3) - Math.log(bottom + 1e-3) + 1e-6)) * 76}`).join(' ');
  const last = history[history.length - 1];
  const tone = last < history[0] * 0.05 ? 'good' : iter === 0 ? 'mid' : eta >= 0.95 ? 'mid' : 'mid';
  return <div className="dk-split">
    <div className="dk-stage">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`第 ${iter} 拍，深色舞者到粉笔圈的距离平方 ${distSq.toFixed(0)}`}>
        <StageFloor w={W} h={H} />
        {marks.map((m, i) => <TapeMark key={i} at={m} />)}
        {shown.map((p, i) => i === HERO ? null : <Dancer key={i} at={p} />)}
        {!moving && <>
          <circle cx={target[0]} cy={target[1]} r={22} fill="#ffffff" stroke={INK.net} strokeWidth={5} strokeDasharray="7 6" />
          <Arrow from={heroX} vec={heroV} color={INK.net} width={6} />
          <text x={target[0] + 32} y={target[1] + 10} fontSize={28} fontWeight={750} fill={INK.net} stroke="#f6efe2" strokeWidth={5} paintOrder="stroke">冻结目标</text>
        </>}
        <Dancer at={shown[HERO]} scale={1.5} color={INK.text} />
      </svg>
      <div className="dk-hint">白圈是本拍的粉笔标记，练的时候它不动</div>
    </div>
    <div className="dk-panel">
      <div className="dk-formula" style={{ whiteSpace: 'normal' }}>
        <SymbolHint meaning="L：训练损失，对噪声 ε 取期望。">L</SymbolHint> = E‖<SymbolHint meaning="f_θ(ε)：网络预测，这里是舞者当前位置 x。">x</SymbolHint> − <SymbolHint meaning="stopgrad：停止梯度。目标视为常量，不对 V 反向传播，因为 V 依赖 q，对分布反传并不容易。">sg</SymbolHint>(x + <SymbolHint meaning="V：当前的漂移场，由这一批样本计算后冻结。">V</SymbolHint>)‖²
      </div>
      <div className="dk-row"><span>‖x − 目标‖²</span><b>{distSq.toFixed(1)}</b></div>
      <div className="dk-row dk-green"><span>‖V(x)‖²（数值相等）</span><b>{(norm(heroV) ** 2).toFixed(1)}</b></div>
      <Slider label="本拍步长 η（演示）" value={eta} min={0.1} max={1} step={0.05} onChange={setEta} display={eta.toFixed(2)} />
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="dk-btn is-primary" onClick={() => setQueue(q => q + 1)}>练一拍</button>
        <button type="button" className="dk-btn" onClick={() => setQueue(q => q + 10)}>连练 10 拍</button>
        <button type="button" className="dk-btn" onClick={reset}>重来</button>
      </div>
      <div className="dk-row"><span>全队 ‖V‖²（对数）</span><b>第 {iter} 拍</b></div>
      <svg viewBox="0 0 500 90" width="100%" height="90" role="img" aria-label={`全队平均漂移平方，当前 ${last.toFixed(1)}`}>
        <line x1={0} x2={500} y1={86} y2={86} stroke={INK.axis} strokeWidth={3} />
        <polyline points={chart} fill="none" stroke={INK.net} strokeWidth={5} strokeLinejoin="round" />
      </svg>
      <Feedback tone={tone}>{iter === 0
        ? '先算 V 并冻结目标，再把 x 拉过去；下一拍重新算。'
        : tone === 'good' ? `全队漂移已降到 ${last.toFixed(1)}，接近平衡。` : `新位置带来新的 V 和新目标，当前 ${last.toFixed(0)}。`}</Feedback>
    </div>
  </div>;
}
