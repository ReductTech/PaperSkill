import React, { useState } from 'react';
import { Console, ConsoleBody, C, FONT, T, fmt, useTweenVec, Verdict } from './ewcKit';
import { A_ANCHOR, FADER_MAX, TASK_B, Vec, lossA, lossTask, trainSgd, dot } from './ewcMath';

const W = 900, H = 622;
const METER_TOP = 96, METER_H = 360, LEVEL_MAX = 4 * FADER_MAX;

export function EwcForget() {
  const [theta, setTheta] = useState<Vec>(A_ANCHOR);
  const [ms, setMs] = useState(0);
  const shown = useTweenVec(theta, ms);
  const la = lossA(shown);
  const lb = lossTask(TASK_B, shown);
  const level = dot(TASK_B.w, shown);
  const drag = (i: number, v: number) => { setMs(0); setTheta(t => t.map((x, j) => (j === i ? v : x))); };
  const sgd = () => { setMs(1000); setTheta(trainSgd(TASK_B, theta)); };
  const reset = () => { setMs(600); setTheta(A_ANCHOR); };
  const yOf = (v: number) => METER_TOP + METER_H * (1 - Math.min(v, LEVEL_MAX) / LEVEL_MAX);
  const reached = lb < 0.05;
  let verdict: React.ReactNode;
  if (!reached) verdict = <Verdict tone="info">把总电平推到橙色目标线，歌 B 才算学会。</Verdict>;
  else if (la > 0.2) verdict = <Verdict tone="bad">歌 B 达标了，但歌 A 的混音被破坏——这就是灾难性遗忘。</Verdict>;
  else verdict = <Verdict tone="good">两首歌都保住了！改动落在了对歌 A 不重要的推子上。</Verdict>;
  return <div className="ewc-page">
    <div className="ewc-scene" style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="四个推子的调音台，拖动推子让总电平达到歌 B 的目标">
        <ConsoleBody x={14} y={14} w={W - 28} h={H - 28} />
        <rect x="44" y="62" width="46" height="14" rx="3" fill="none" stroke={C.blue} strokeWidth="3" strokeDasharray="7 5" />
        <text x="102" y="76" fontSize={T.body} fill={C.blue} fontWeight="700" fontFamily={FONT}>歌 A 的推子位置</text>
        <Console theta={shown} anchors={A_ANCHOR} onChange={drag} left={130} top={METER_TOP} h={METER_H} gap={150} />
        <text x="718" y="78" textAnchor="middle" fontSize={T.body} fontWeight="700" fill={C.text} fontFamily={FONT}>总电平</text>
        <rect x="690" y={METER_TOP} width="56" height={METER_H} rx="14" fill="#eef2ea" stroke={C.border} strokeWidth="2" />
        <rect x="690" y={yOf(level)} width="56" height={METER_TOP + METER_H - yOf(level)} rx="14" fill={reached ? C.green : C.blue} />
        <line x1="676" x2="760" y1={yOf(TASK_B.t)} y2={yOf(TASK_B.t)} stroke={C.orange} strokeWidth="5" />
        <text x="752" y={yOf(TASK_B.t) - 14} textAnchor="end" fontSize={T.body} fontWeight="700" fill={C.orange} fontFamily={FONT}>歌 B 目标</text>
      </svg>
    </div>
    <div className="ewc-side">
      <div className="ewc-kpis">
        <div className={`ewc-kpi ${la > 0.2 ? 'is-red' : 'is-green'}`}>歌 A 误差 <b>{fmt(la)}</b></div>
        <div className={`ewc-kpi ${reached ? 'is-green' : 'is-blue'}`}>歌 B 误差 <b>{fmt(lb)}</b></div>
      </div>
      <div className="ewc-btns">
        <button className="ewc-btn is-primary" onClick={sgd}>用 SGD 训练歌 B</button>
        <button className="ewc-btn" onClick={reset}>回到歌 A</button>
      </div>
      {verdict}
      <p className="ewc-muted">推子 = 网络权重；歌 B 只要求四个推子之和达标。</p>
    </div>
  </div>;
}
