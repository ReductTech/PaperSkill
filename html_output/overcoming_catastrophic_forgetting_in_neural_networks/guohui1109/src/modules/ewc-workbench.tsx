import React, { useMemo, useState } from 'react';
import { Console, ConsoleBody, C, FONT, T, S, fmt, useTweenVec, Slider } from './ewcKit';
import { A_ANCHOR, F_A, FADER_MAX, PEN_A, TASK_B, Vec, dot, lossA, lossTask, trainPenalised, trainStep } from './ewcMath';

const W = 760, H = 532;
const METER_TOP = 70, METER_H = 330, LEVEL_MAX = 4 * FADER_MAX;
// One linear panel shows both the EWC/L2 frontier and the learner's current
// mix. The frontier (and therefore the λ-optimal point) is always inside this
// window; the orange current dot is clamped to the border when a fader is
// dragged far outside it, with a visible "超出折中区" badge.
const PX0 = 66, PY0 = 10, PWD = 380, PHT = 140;
const XMAX = 1.35, YMAX = 0.6;
const gx = (lb: number) => PX0 + 14 + (Math.min(lb, XMAX) / XMAX) * (PWD - 28);
const gy = (la: number) => PY0 + 14 + (1 - Math.min(la, YMAX) / YMAX) * (PHT - 28);

function frontier(method: 'ewc' | 'l2') {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const lam = 0.05 * Math.pow(400, i / 40);
    const th = trainStep(method, TASK_B, A_ANCHOR, [PEN_A], lam);
    pts.push(`${i ? 'L' : 'M'}${gx(lossTask(TASK_B, th)).toFixed(1)} ${gy(lossA(th)).toFixed(1)}`);
  }
  return pts.join('');
}

export function EwcWorkbench() {
  const [theta, setTheta] = useState<Vec>(A_ANCHOR);
  const [lam, setLam] = useState(1);
  const [ms, setMs] = useState(0);
  const shown = useTweenVec(theta, ms);
  const ewcPath = useMemo(() => frontier('ewc'), []);
  const l2Path = useMemo(() => frontier('l2'), []);
  const la = lossA(shown), lb = lossTask(TASK_B, shown);
  const pen = lam * la;                 // Σ (λ/2) F_i δ_i²  =  λ · L_A in this toy
  const total = lb + pen;
  const best = trainPenalised(TASK_B, [PEN_A], lam);
  const bestLb = lossTask(TASK_B, best);
  const bestLa = lossA(best);
  const bestTotal = bestLb + lam * bestLa;
  const level = dot(TASK_B.w, shown);
  const yOf = (v: number) => METER_TOP + METER_H * (1 - Math.min(v, LEVEL_MAX) / LEVEL_MAX);
  const solve = () => { setMs(900); setTheta(best); };
  const reset = () => { setMs(500); setTheta(A_ANCHOR); };
  const drag = (i: number, v: number) => { setMs(0); setTheta(t => t.map((x, j) => (j === i ? v : x))); };
  const gap = total - bestTotal;
  return <div className="ewc-page is-col" style={{ gap: 14 }}>
    <div className="ewc-formula" style={{ flex: 'none' }}>
      <S m="L(θ)：EWC 训练新任务时最小化的总损失。">ℒ</S>(θ) = <S m="L_B(θ)：只含新任务 B 的损失。">ℒ</S><sub>B</sub>(θ) + ∑<sub>i</sub> <S m="λ：旧任务相对新任务的重要程度，即弹簧强度。">λ</S>/2 · <S m="F_i：第 i 个参数的 Fisher 重要性（对角元素）。">F</S><sub>i</sub> (<S m="θ_i：第 i 个参数（推子）当前的取值。">θ</S><sub>i</sub> − <S m="θ*_{A,i}：旧任务 A 学完时第 i 个参数的取值，也就是弹簧的锚点。">θ*</S><sub>A,i</sub>)²
    </div>
    <div className="ewc-page" style={{ flex: 1, minHeight: 0 }}>
      <div className="ewc-scene" style={{ width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="带弹簧的调音台：拖动推子，或点击求解得到 EWC 最优混音">
          <ConsoleBody x={10} y={10} w={W - 20} h={H - 20} />
          <Console theta={shown} anchors={A_ANCHOR} F={F_A.map(f => f * lam)} onChange={drag} left={96} top={METER_TOP} h={METER_H} gap={134} />
          <text x="660" y="52" textAnchor="middle" fontSize={T.body} fontWeight="700" fill={C.text} fontFamily={FONT}>总电平</text>
          <rect x="632" y={METER_TOP} width="56" height={METER_H} rx="14" fill="#eef2ea" stroke={C.border} strokeWidth="2" />
          <rect x="632" y={yOf(level)} width="56" height={METER_TOP + METER_H - yOf(level)} rx="14" fill={lb < 0.05 ? C.green : C.blue} />
          <line x1="618" x2="702" y1={yOf(TASK_B.t)} y2={yOf(TASK_B.t)} stroke={C.orange} strokeWidth="5" />
        </svg>
      </div>
      <div className="ewc-side">
        <Slider label="弹簧强度 λ" value={lam} min={0.1} max={10} step={0.1} onChange={v => { setLam(v); }} display={fmt(lam, 1)} />
        <div className="ewc-kpis" style={{ gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div className="ewc-kpi">新任务 ℒ<sub>B</sub> <b>{fmt(lb)}</b></div>
          <div className="ewc-kpi">弹簧项 <b>{fmt(pen)}</b></div>
          <div className="ewc-kpi is-blue">总损失 ℒ <b>{fmt(total)}</b></div>
          <div className={`ewc-kpi ${la > 0.2 ? 'is-red' : 'is-green'}`}>旧任务 ℒ<sub>A</sub> <b>{fmt(la)}</b></div>
        </div>
        <div className="ewc-btns">
          <button className="ewc-btn is-primary" onClick={solve}>求最小总损失</button>
          <button className="ewc-btn" onClick={reset}>归位</button>
          <span style={{ alignSelf: 'center', fontSize: 'var(--ppt-body-text)', fontWeight: 800, color: gap < 0.02 ? C.green : C.muted }}>{gap < 0.02 ? '已达最优' : `距最优 +${fmt(gap)}`}</span>
        </div>
        <svg width="644" height="176" viewBox="0 0 644 176" style={{ flexShrink: 0 }} role="img"
          aria-label="新旧任务误差折中：绿线为 EWC，紫线为等刚度 L2；橙点为当前混音，绿色圆环为当前 λ 的最优混音">
          <rect x={PX0} y={PY0} width={PWD} height={PHT} fill="#fbfdf8" stroke={C.border} strokeWidth="2" />
          <text x={PX0 + 20} y={26} fontSize={T.body} fill={C.muted} fontFamily={FONT}>合成示意</text>
          <path d={l2Path} fill="none" stroke={C.purple} strokeWidth="5" />
          <path d={ewcPath} fill="none" stroke={C.green} strokeWidth="6" />
          <circle cx={gx(lb)} cy={gy(la)} r="12" fill={C.orange} stroke="#fff" strokeWidth="3" />
          <circle cx={gx(bestLb)} cy={gy(bestLa)} r="15" fill="none" stroke={C.green} strokeWidth="4" />
          {(lb > XMAX || la > YMAX) && <text x={PX0 + PWD - 8} y={28} textAnchor="end" fontSize={T.body}
            fontWeight="700" fill={C.red} fontFamily={FONT}>超出折中区</text>}
          <text x={PX0 + PWD / 2} y={168} textAnchor="middle" fontSize={T.body} fill={C.muted} fontFamily={FONT}>新任务误差 ℒ_B →</text>
          <text transform={`translate(24 ${PY0 + PHT / 2}) rotate(-90)`} textAnchor="middle" fontSize={T.body} fill={C.muted} fontFamily={FONT}>ℒ_A →</text>

          {/* Legend on the right, clear of the curve panel. */}
          <g transform="translate(470 20)">
            <line x1="0" x2="30" y1="0" y2="0" stroke={C.green} strokeWidth="6" strokeLinecap="round" />
            <text x="40" y="9" fontSize={T.body} fontWeight="700" fill={C.green} fontFamily={FONT}>EWC</text>
            <line x1="0" x2="30" y1="32" y2="32" stroke={C.purple} strokeWidth="5" strokeLinecap="round" />
            <text x="40" y="41" fontSize={T.body} fontWeight="700" fill={C.purple} fontFamily={FONT}>L2 代理</text>
            <circle cx="8" cy="72" r="9" fill={C.orange} stroke="#fff" strokeWidth="2" />
            <text x="28" y="81" fontSize={T.body} fill={C.text} fontFamily={FONT}>当前</text>
            <circle cx="8" cy="104" r="8" fill="none" stroke={C.green} strokeWidth="4" />
            <text x="28" y="113" fontSize={T.body} fill={C.text} fontFamily={FONT}>最佳</text>
          </g>
        </svg>
      </div>
    </div>
  </div>;
}
