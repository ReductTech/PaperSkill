import React, { useState } from 'react';
import { Console, ConsoleBody, Bar, C, FONT, T, fmt, Verdict } from './ewcKit';
import { A_ANCHOR, CHANNELS, F_A, Vec, lossA } from './ewcMath';

const W = 800, H = 622;
const TOP = 110, HH = 340;
const GAP = 170, LEFT = 120;
const MIN_NUDGE = 0.03;

export function EwcFisher() {
  const [theta, setTheta] = useState<Vec>(A_ANCHOR);
  const [measured, setMeasured] = useState<(number | null)[]>([null, null, null, null]);
  const delta = theta.map((v, i) => v - A_ANCHOR[i]);
  const dl = delta.map((d, i) => 0.5 * F_A[i] * d * d);
  const drag = (i: number, v: number) => {
    setTheta(t => t.map((x, j) => (j === i ? v : x)));
    const d = v - A_ANCHOR[i];
    if (Math.abs(d) >= MIN_NUDGE) {
      // F̂ = 2ΔL / δ². For this quadratic toy ΔL = ½Fδ², so the ratio is the
      // curvature F and is intentionally independent of how far the fader moves.
      const dLoss = 0.5 * F_A[i] * d * d;
      setMeasured(m => m.map((x, j) => (j === i ? (2 * dLoss) / (d * d) : x)));
    }
  };
  const nudgeAll = () => { setTheta(A_ANCHOR.map(a => a + 0.1)); setMeasured(F_A.slice()); };
  const reset = () => { setTheta(A_ANCHOR); setMeasured([null, null, null, null]); };
  const done = measured.every(m => m !== null);
  return <div className="ewc-page">
    <div className="ewc-scene" style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="拖动每个推子偏离歌 A 的位置，观察歌 A 误差的增加量">
        <ConsoleBody x={14} y={14} w={W - 28} h={H - 28} />
        <Console theta={theta} anchors={A_ANCHOR} onChange={drag} left={LEFT} top={TOP} h={HH} gap={GAP} />
        {dl.map((v, i) => <text key={i} x={LEFT + GAP * i} y={TOP - 22} textAnchor="middle" fontSize={T.body} fontWeight="800" fontFamily={FONT}
          fill={v > 0.02 ? C.red : C.muted}>+{fmt(v)}</text>)}
        <text x={W / 2} y={56} textAnchor="middle" fontSize={T.body} fill={C.muted} fontFamily={FONT}>每个推子偏离歌 A 后，歌 A 误差增加</text>
      </svg>
    </div>
    <div className="ewc-side">
      <h3 className="ewc-head">测得的重要性 F̂ᵢ <span className="ewc-muted" style={{ fontSize: 'var(--ppt-body-text)' }}>（曲率）</span></h3>
      <svg width="644" height="244" viewBox="0 0 644 244" role="img" aria-label="四个推子的 Fisher 对角估计">
        {CHANNELS.map((c, i) => <g key={c}>
          <text x="0" y={32 + i * 60} fontSize={T.body} fontWeight="700" fill={C.text} fontFamily={FONT}>{c}</text>
          <Bar x={96} y={10 + i * 60} w={400} h={30} value={measured[i] ?? 0} max={14} color={C.orange} />
          <text x={510} y={34 + i * 60} fontSize={T.body} fontWeight="800" fill={measured[i] === null ? C.muted : C.text} fontFamily={FONT}>
            {measured[i] === null ? '未测' : fmt(measured[i] as number, 1)}</text>
        </g>)}
      </svg>
      <div className="ewc-btns">
        <button className="ewc-btn is-primary" onClick={nudgeAll}>一键测四个</button>
        <button className="ewc-btn" onClick={reset}>清除</button>
      </div>
      {done
        ? <Verdict tone="good">F̂ 与推距无关：低频、鼓点曲率大，镲片曲率小。真实网络用一阶梯度估计 F。</Verdict>
        : <Verdict tone="info">逐个拉离虚线（≥0.03）。ΔL 随 δ² 变，但 F̂ = 2ΔL/δ² 对二次损失不变——这就是曲率。</Verdict>}
      <ul className="ewc-list">
        <li>(a) 极小点附近等价于损失的二阶导</li>
        <li>(b) 只需一阶导数即可算出</li>
        <li>(c) 半正定，Fᵢ ≥ 0</li>
      </ul>
    </div>
  </div>;
}
