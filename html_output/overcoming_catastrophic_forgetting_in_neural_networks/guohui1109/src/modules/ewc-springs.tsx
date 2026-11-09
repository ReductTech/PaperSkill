import React, { useState } from 'react';
import { Fader, C, FONT, T, fmt, useTweenVec, Verdict, Slider } from './ewcKit';
import { Method, Task, Vec, lossTask, trainStep } from './ewcMath';

// Two-fader version of the toy (Fig. 1 analogue). θ1 = 低频 (important to song A), θ2 = 镲片 (unimportant).
const A2: Vec = [0.7, 0.45];
const F2: Vec = [14, 0.5];
const TB2: Task = { id: 'B2', w: [1, 1], t: 1.95, kappa: 4 };
const lossA2 = (th: Vec) => 0.5 * (F2[0] * (th[0] - A2[0]) ** 2 + F2[1] * (th[1] - A2[1]) ** 2);

const W = 940, H = 622;
const X0 = 90, Y0 = 36, PW = 560, PH = 480;
const SX = PW / 1.0, SY = PH / 1.2;
const px = (t1: number) => X0 + (t1 - 0.2) * SX;
const py = (t2: number) => Y0 + (1.2 - t2) * SY;
const COLORS: Record<Method, string> = { sgd: C.red, l2: C.purple, ewc: C.green };
const NAMES: Record<Method, string> = { sgd: '无惩罚', l2: 'L2', ewc: 'EWC' };

export function EwcSprings() {
  const [method, setMethod] = useState<Method>('sgd');
  const [lam, setLam] = useState(1);
  const target = trainStep(method, TB2, A2, [{ anchor: A2, F: F2 }], lam);
  const th = useTweenVec(target, 800);
  const la = lossA2(th), lb = lossTask(TB2, th);
  const stiff: Vec | undefined = method === 'sgd' ? undefined
    : method === 'ewc' ? F2.map(f => f * lam) : F2.map(() => lam * (F2[0] + F2[1]) / 2);
  const color = COLORS[method];
  let verdict: React.ReactNode;
  if (la < 0.2 && lb < 0.1) verdict = <Verdict tone="good">两项都保住：软弹簧让不重要的镲片去承担改动，低频几乎不动。</Verdict>;
  else if (la >= 0.2 && lb < 0.1) verdict = <Verdict tone="bad">新任务学好了，但低频被一起推走，旧任务受损。</Verdict>;
  else if (la < 0.2) verdict = <Verdict tone="bad">旧任务保住了，但弹簧太紧，新任务没学好。</Verdict>;
  else verdict = <Verdict tone="bad">旧任务有损失，新任务也没学好。</Verdict>;
  const halo = { paintOrder: 'stroke' as const, stroke: C.bg, strokeWidth: 7, strokeLinejoin: 'round' as const };
  return <div className="ewc-page">
    <div className="ewc-scene" style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="二维参数空间：灰色为歌 A 低误差区，奶油色为歌 B 低误差区，箭头为所选方法从旧解出发到达的位置">
        <defs>
          <clipPath id="ewc-springs-clip"><rect x={X0} y={Y0} width={PW} height={PH} /></clipPath>
          {(['sgd', 'l2', 'ewc'] as Method[]).map(m => <marker key={m} id={`ewc-arrow-${m}`} markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
            <path d="M0 0 L9 4.5 L0 9 Z" fill={COLORS[m]} /></marker>)}
        </defs>
        <rect x={X0} y={Y0} width={PW} height={PH} fill="#fbfdf8" stroke={C.border} strokeWidth="2" />
        <g clipPath="url(#ewc-springs-clip)">
          <polygon fill="#f8efc4" stroke="#d6bd6a" strokeWidth="3" opacity="0.9"
            points={`${px(0.2)},${py(1.95 + 0.316 - 0.2)} ${px(1.2)},${py(1.95 + 0.316 - 1.2)} ${px(1.2)},${py(1.95 - 0.316 - 1.2)} ${px(0.2)},${py(1.95 - 0.316 - 0.2)}`} />
          <ellipse cx={px(A2[0])} cy={py(A2[1])} rx={0.207 * SX} ry={1.095 * SY} fill="#9aa890" fillOpacity="0.55" stroke={C.dark} strokeWidth="3" />
        </g>
        <text x={px(0.23)} y={py(1.1)} fontSize={T.body} fontWeight="700" fill={C.text} fontFamily={FONT} style={halo}>歌 A 低误差</text>
        <text x={px(0.84)} y={py(1.17)} fontSize={T.body} fontWeight="700" fill="#8a6d12" fontFamily={FONT} style={halo}>歌 B 低误差</text>
        <line x1={px(A2[0])} y1={py(A2[1])} x2={px(th[0])} y2={py(th[1])} stroke={color} strokeWidth="7" strokeLinecap="round"
          markerEnd={`url(#ewc-arrow-${method})`} opacity={Math.hypot(th[0] - A2[0], th[1] - A2[1]) > 0.01 ? 1 : 0} />
        <circle cx={px(th[0])} cy={py(th[1])} r="13" fill={color} stroke="#fff" strokeWidth="3" />
        <circle cx={px(A2[0])} cy={py(A2[1])} r="9" fill={C.text} />
        <text x={px(A2[0]) - 16} y={py(A2[1]) + 36} textAnchor="end" fontSize={T.body} fontWeight="800" fill={C.text} fontFamily={FONT} style={halo}>θ*_A</text>
        <text x={X0 + PW / 2} y={H - 22} textAnchor="middle" fontSize={T.body} fill={C.muted} fontFamily={FONT}>θ₁：低频（对歌 A 重要）→</text>
        <text transform={`translate(40 ${Y0 + PH / 2}) rotate(-90)`} textAnchor="middle" fontSize={T.body} fill={C.muted} fontFamily={FONT}>θ₂：镲片（不重要）→</text>
        <Fader cx={770} top={60} h={380} value={th[0]} label="低频" anchor={A2[0]} stiffness={stiff?.[0]} color={color} />
        <Fader cx={868} top={60} h={380} value={th[1]} label="镲片" anchor={A2[1]} stiffness={stiff?.[1]} color={color} />
      </svg>
    </div>
    <div className="ewc-side">
      <div className="ewc-btns" role="group" aria-label="选择约束方式">
        {(['sgd', 'l2', 'ewc'] as Method[]).map(m =>
          <button key={m} className={`ewc-btn ${m === 'sgd' ? 'is-red' : m === 'ewc' ? 'is-green' : ''} ${method === m ? 'is-on' : ''}`}
            style={m === 'l2' && method === m ? { background: C.purple, borderColor: C.purple } : undefined}
            onClick={() => setMethod(m)}>{NAMES[m]}</button>)}
      </div>
      <Slider label="弹簧强度 λ" value={lam} min={0.1} max={6} step={0.1} onChange={setLam} display={fmt(lam, 1)} />
      <div className="ewc-kpis">
        <div className={`ewc-kpi ${la < 0.2 ? 'is-green' : 'is-red'}`}>歌 A 误差 <b>{fmt(la)}</b></div>
        <div className={`ewc-kpi ${lb < 0.1 ? 'is-green' : 'is-red'}`}>歌 B 误差 <b>{fmt(lb)}</b></div>
      </div>
      {verdict}
    </div>
  </div>;
}
