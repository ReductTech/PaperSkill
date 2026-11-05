import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Dancer, Feedback, Slider, StageFloor, TapeMark, INK } from './danceKit';
import { cluster, driftStep, eulerFlow, gaussian, makeRng, meanNearest, Pt } from './driftCore';

const W = 724;
const H = 318;
const ORIGIN: Pt = [W / 2, H / 2 + 10];

export function IterationPlace(_: WidgetProps) {
  const marks = useMemo(() => [...cluster(41, 8, 190, H / 2 + 10, 20), ...cluster(42, 8, 534, H / 2 + 10, 20)], []);
  const eps = useMemo(() => { const r = makeRng(43); return Array.from({ length: 14 }, () => [ORIGIN[0] + gaussian(r) * 62, ORIGIN[1] + gaussian(r) * 52] as Pt); }, []);
  const frames = useMemo(() => {
    const list: Pt[][] = [eps];
    for (let i = 0; i < 120; i++) list.push(driftStep(list[list.length - 1], marks, 70, 0.3, 1, 1, false));
    return list;
  }, [eps, marks]);
  const [steps, setSteps] = useState(1);
  const [round, setRound] = useState(0);
  const paths = eps.map(e => eulerFlow(e, marks, ORIGIN, 58, steps));
  const ends = paths.map(p => p[p.length - 1]);
  const flowGap = meanNearest(ends, marks);
  const driftPts = frames[round];
  const driftGap = meanNearest(driftPts, marks);
  const tone = steps <= 2 ? 'bad' : driftGap < 20 && flowGap < 20 ? 'good' : 'mid';
  return <div className="ppt-layout dk-col">
    <div className="dk-two dk-flex">
      <div className="dk-col">
        <div className="dk-h dk-red">扩散 / 流：迭代在推理</div>
        <div className="dk-stage" style={{ height: H }}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`流模型演示：${steps} 步后离标记平均 ${flowGap.toFixed(0)}`}>
            <StageFloor w={W} h={H} />
            {marks.map((m, i) => <TapeMark key={i} at={m} size={7} />)}
            {paths.map((p, i) => <polyline key={i} points={p.map(v => v.join(',')).join(' ')} fill="none" stroke={INK.bad} strokeOpacity={0.4} strokeWidth={2} />)}
            {ends.map((p, i) => <Dancer key={i} at={p} scale={1.05} />)}
          </svg>
        </div>
        <Slider label="演出时调用网络的次数" value={steps} min={1} max={32} step={1} onChange={setSteps} display={`${steps} 次`} />
        <div className="dk-row"><span>离标记平均距离（演示）</span><b>{flowGap.toFixed(0)}</b></div>
      </div>
      <div className="dk-col">
        <div className="dk-h dk-green">Drifting：迭代在训练</div>
        <div className="dk-stage" style={{ height: H }}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`漂移演示：排练第 ${round} 轮，离标记平均 ${driftGap.toFixed(0)}`}>
            <StageFloor w={W} h={H} />
            {marks.map((m, i) => <TapeMark key={i} at={m} size={7} />)}
            {driftPts.map((p, i) => <Dancer key={i} at={p} scale={1.05} />)}
          </svg>
        </div>
        <Slider label="排练（训练）轮数" value={round} min={0} max={120} step={1} onChange={setRound} display={`${round} 轮`} />
        <div className="dk-row"><span>离标记平均距离（演示）</span><b>{driftGap.toFixed(0)}</b></div>
      </div>
    </div>
    <Feedback tone={tone}>{steps <= 2
      ? '左：一步欧拉把全队送到两团标记的均值，少调用就走不到位。右：排练轮数不影响演出，始终 1 次。'
      : '左：调用越多越准，但每次生成都要付这笔成本。右：同样的修正花在排练里，演出只调用 1 次。'}</Feedback>
  </div>;
}
