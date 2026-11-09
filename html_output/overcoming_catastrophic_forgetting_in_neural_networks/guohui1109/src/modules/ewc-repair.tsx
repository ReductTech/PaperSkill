import React, { useState } from 'react';
import { Console, ConsoleBody, Bar, C, FONT, T, fmt, useTweenVec, Slider, Verdict } from './ewcKit';
import { A_ANCHOR, F_A, PEN_A, TASK_B, TASK_C, Method, Vec, fisherOf, lossA, lossTask, mean, penaltyOf, trainStep } from './ewcMath';

const W = 760, H = 622;
const NAMES: Record<Method, string> = { sgd: 'SGD', l2: 'L2', ewc: 'EWC' };
const STAGES = ['歌 A', '歌 B', '歌 C'];
const OK = 0.2;

export function EwcRepair() {
  const [method, setMethod] = useState<Method>('sgd');
  const [lam, setLam] = useState(1);
  const [stage, setStage] = useState(0);
  const thB = trainStep(method, TASK_B, A_ANCHOR, [PEN_A], lam);
  const thC = trainStep(method, TASK_C, thB, [PEN_A, penaltyOf(TASK_B, thB)], lam);
  const target = [A_ANCHOR, thB, thC][stage];
  const shown = useTweenVec(target, 900);
  const la = lossA(shown), lb = lossTask(TASK_B, shown), lc = lossTask(TASK_C, shown);

  // Springs shown on the faders: stage 1 pulls to θ*_A; stage 2 pulls to the single merged penalty (see the merge page).
  const FB = fisherOf(TASK_B);
  const uni = (F: Vec) => F.map(() => mean(F));
  const FAeff = method === 'l2' ? uni(F_A) : F_A, FBeff = method === 'l2' ? uni(FB) : FB;
  let anchors: Vec = A_ANCHOR, stiff: Vec | undefined;
  if (method !== 'sgd' && stage === 1) stiff = FAeff.map(f => f * lam);
  if (method !== 'sgd' && stage === 2) {
    anchors = A_ANCHOR.map((a, i) => (FAeff[i] * a + FBeff[i] * thB[i]) / (FAeff[i] + FBeff[i]));
    stiff = FAeff.map((f, i) => (f + FBeff[i]) * lam);
  }
  const bad = [la > OK ? 'A' : '', lb > OK ? 'B' : '', lc > OK ? 'C' : ''].filter(Boolean);
  let verdict: React.ReactNode;
  if (stage === 0) verdict = <Verdict tone="info">歌 A 已学好。点“学下一首”，依次学歌 B、歌 C。</Verdict>;
  else if (stage === 1) verdict = <Verdict tone="info">歌 B 学完。再学歌 C，看看前两首还保不保得住。</Verdict>;
  else if (bad.length === 0) verdict = <Verdict tone="good">三首歌都保住了：两条旧弹簧合并成一条，容量没有增加。</Verdict>;
  else verdict = <Verdict tone="bad">歌 {bad.join('、')} 的误差仍然偏高。换一种方法或调 λ 再试。</Verdict>;
  const rows: { name: string; v: number; max: number; learned: boolean }[] = [
    { name: '歌 A', v: la, max: 1.5, learned: true },
    { name: '歌 B', v: lb, max: 1.5, learned: stage >= 1 },
    { name: '歌 C', v: lc, max: 1.5, learned: stage >= 2 },
  ];
  return <div className="ewc-page">
    <div className="ewc-scene" style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`依次学习三首歌，当前方法 ${NAMES[method]}`}>
        <ConsoleBody x={10} y={10} w={W - 20} h={H - 20} />
        {STAGES.map((s, i) => <g key={s} transform={`translate(${70 + i * 210} 30)`}>
          <rect width="170" height="48" rx="24" fill={i === stage ? C.orange : i < stage ? '#cfe7da' : '#fff'} stroke={i === stage ? C.orange : C.border} strokeWidth="3" />
          <text x="85" y="34" textAnchor="middle" fontSize={T.body} fontWeight="800" fill={i === stage ? '#fff' : C.text} fontFamily={FONT}>{s}</text>
        </g>)}
        <Console theta={shown} anchors={anchors} F={stiff} left={110} top={130} h={370} gap={160} />
      </svg>
    </div>
    <div className="ewc-side">
      <div className="ewc-btns" role="group" aria-label="选择方法">
        {(['sgd', 'l2', 'ewc'] as Method[]).map(m => <button key={m} className={`ewc-btn ${m === 'sgd' ? 'is-red' : m === 'ewc' ? 'is-green' : ''} ${method === m ? 'is-on' : ''}`}
          style={m === 'l2' && method === m ? { background: C.purple, borderColor: C.purple } : undefined} onClick={() => setMethod(m)}>{NAMES[m]}</button>)}
      </div>
      <Slider label="弹簧强度 λ" value={lam} min={0.1} max={6} step={0.1} onChange={setLam} display={fmt(lam, 1)} />
      <svg width="644" height="196" viewBox="0 0 644 196" role="img" aria-label="三首歌当前的误差">
        {rows.map((r, i) => <g key={r.name}>
          <text x="0" y={36 + i * 62} fontSize={T.body} fontWeight="700" fill={r.learned ? C.text : C.muted} fontFamily={FONT}>{r.name}</text>
          <Bar x={96} y={12 + i * 62} w={420} h={34} value={r.v} max={r.max} color={!r.learned ? '#c3ccd9' : r.v > OK ? C.red : C.green} />
          <text x={534} y={38 + i * 62} fontSize={T.body} fontWeight="800" fill={r.learned ? C.text : C.muted} fontFamily={FONT}>{r.learned ? fmt(r.v) : '未学'}</text>
        </g>)}
      </svg>
      <div className="ewc-btns">
        <button className="ewc-btn is-primary" disabled={stage >= 2} onClick={() => setStage(s => Math.min(2, s + 1))}>学下一首</button>
        <button className="ewc-btn" onClick={() => setStage(0)}>重来</button>
      </div>
      {verdict}
    </div>
  </div>;
}
